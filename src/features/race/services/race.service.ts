import { Singleton } from "@janmbaco/injectkit";

import {
  createInitialRaceState,
  createSessionFromConfig,
  getRunnerStartAt,
} from "../domain/race.selectors";
import { transitionRacePhase } from "../domain/race-flow.machine";
import type {
  RaceAction,
  RaceHistoryEntry,
  RaceMode,
  RaceSession,
  RaceSessionSnapshot,
  RaceState,
  Runner,
  RunnerConfig,
} from "../domain/race.types";
import { parseDurationInput } from "../domain/time-format";
import { ClockService } from "./clock.service";
import { StorageService } from "./storage.service";

export type RaceListener = (state: RaceState) => void;

@Singleton({ deps: [ClockService, StorageService] })
export class RaceService {
  private state: RaceState;
  private readonly listeners = new Set<RaceListener>();

  constructor(
    private readonly clock: ClockService,
    private readonly storage: StorageService,
  ) {
    this.state = this.storage.load();
  }

  getSnapshot(): RaceState {
    return this.cloneState(this.state);
  }

  subscribe(listener: RaceListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());

    return () => {
      this.listeners.delete(listener);
    };
  }

  setMode(mode: RaceMode): void {
    if (!this.canEditConfiguration()) {
      throw new Error("No se puede cambiar el modo con la carrera en curso.");
    }

    const config = {
      ...this.state.config,
      mode,
    };

    this.commit({
      ...this.state,
      config,
      session: createSessionFromConfig(config),
    });
  }

  confirmModeSelection(): void {
    this.commit({
      ...this.state,
      phase: transitionRacePhase(this.state.phase, "mode_confirmed"),
    });
  }

  backToModeSelection(): void {
    if (!this.canEditConfiguration()) {
      throw new Error("No se puede volver al modo con la carrera en curso.");
    }

    this.commit({
      ...this.state,
      phase: transitionRacePhase(this.state.phase, "back_to_mode"),
    });
  }

  addRunner(bib: string, label: string): void {
    if (!this.canEditConfiguration()) {
      throw new Error("No se pueden añadir corredores con la carrera en curso.");
    }

    const normalizedBib = bib.trim();
    const normalizedLabel = label.trim() || `Dorsal ${normalizedBib}`;

    if (!normalizedBib) {
      throw new Error("El dorsal es obligatorio.");
    }

    if (this.state.config.runners.some((runner) => runner.bib === normalizedBib)) {
      throw new Error("Ya existe un corredor con ese dorsal.");
    }

    const runner: RunnerConfig = {
      id: this.createRunnerId(),
      bib: normalizedBib,
      label: normalizedLabel,
    };
    const config = {
      ...this.state.config,
      runners: [...this.state.config.runners, runner],
    };

    this.commit({
      ...this.state,
      phase: transitionRacePhase(this.state.phase, "runners_changed"),
      config,
      session: createSessionFromConfig(config),
    });
  }

  removeRunner(runnerId: string): void {
    if (!this.canEditConfiguration()) {
      throw new Error("No se pueden eliminar corredores con la carrera en curso.");
    }

    const runner = this.findRunner(runnerId);
    if (
      runner.status !== "pending" ||
      runner.startAt !== undefined ||
      runner.finishAt !== undefined ||
      runner.resultMs !== undefined
    ) {
      throw new Error("No se puede eliminar un corredor con tiempos registrados.");
    }

    const config = {
      ...this.state.config,
      runners: this.state.config.runners.filter(
        (current) => current.id !== runnerId,
      ),
    };

    if (config.runners.length === this.state.config.runners.length) {
      throw new Error("Corredor no encontrado.");
    }

    this.commit({
      ...this.state,
      phase: transitionRacePhase(this.state.phase, "runners_changed"),
      config,
      session: createSessionFromConfig(config),
    });
  }

  confirmRunnerSetup(): void {
    if (this.state.config.runners.length === 0) {
      throw new Error("Añade corredores antes de preparar la salida.");
    }

    this.commit({
      ...this.state,
      phase: transitionRacePhase(this.state.phase, "runners_confirmed"),
      session: createSessionFromConfig(this.state.config),
    });
  }

  backToRunnerSetup(): void {
    if (!this.canEditConfiguration()) {
      throw new Error("No se puede editar la lista con la carrera en curso.");
    }

    this.commit({
      ...this.state,
      phase: transitionRacePhase(this.state.phase, "back_to_runners"),
    });
  }

  startMassRace(): void {
    if (this.state.config.mode !== "mass_start") {
      throw new Error("La salida masiva solo esta disponible en modo salida masiva.");
    }

    if (this.state.phase !== "ready_to_start") {
      throw new Error("Prepara la lista antes de iniciar la salida.");
    }

    if (this.state.session.runners.length === 0) {
      throw new Error("Añade corredores antes de iniciar la carrera.");
    }

    const now = this.clock.getNow();
    const nextSession: RaceSession = {
      ...this.state.session,
      mode: this.state.config.mode,
      raceStartAt: now,
      running: true,
      runners: this.state.session.runners.map((runner) =>
        runner.status === "pending" ? { ...runner, status: "running" } : runner,
      ),
    };

    this.commitTiming("Inicio de salida masiva", "start_mass", {
      ...this.state,
      phase: transitionRacePhase(this.state.phase, "mass_started"),
      session: nextSession,
    });
  }

  startNextRunner(): void {
    const nextRunner = this.state.session.runners.find(
      (runner) => runner.status === "pending",
    );
    if (!nextRunner) {
      throw new Error("No quedan corredores pendientes de salida.");
    }

    this.startRunner(nextRunner.id);
  }

  startRunner(runnerId: string): void {
    if (this.state.config.mode !== "staggered_start") {
      throw new Error("Las salidas individuales solo estan disponibles en modo escalonado.");
    }

    if (
      this.state.phase !== "ready_to_start" &&
      this.state.phase !== "running_staggered"
    ) {
      throw new Error("La salida escalonada no esta preparada.");
    }

    const runner = this.findRunner(runnerId);
    const nextPendingRunner = this.state.session.runners.find(
      (current) => current.status === "pending",
    );
    if (runner.id !== nextPendingRunner?.id) {
      throw new Error("Solo se puede iniciar el siguiente corredor pendiente.");
    }

    if (runner.status !== "pending") {
      throw new Error("Solo se puede iniciar un corredor pendiente.");
    }

    const now = this.clock.getNow();
    const nextSession: RaceSession = {
      ...this.state.session,
      mode: this.state.config.mode,
      running: true,
      runners: this.state.session.runners.map((current) =>
        current.id === runnerId
          ? { ...current, status: "running", startAt: now }
          : current,
      ),
    };

    this.commitTiming(`Salida del dorsal ${runner.bib}`, "start_runner", {
      ...this.state,
      phase: transitionRacePhase(this.state.phase, "runner_started"),
      session: nextSession,
    });
  }

  finishRunner(runnerId: string): void {
    const now = this.clock.getNow();
    const runner = this.findRunner(runnerId);
    if (runner.status !== "running") {
      throw new Error("Solo se puede marcar llegada de corredores en carrera.");
    }

    const startAt = getRunnerStartAt(this.state, runner);
    if (startAt === undefined) {
      throw new Error("No hay hora de salida para este corredor.");
    }

    const resultMs = Math.max(0, now - startAt);
    const runners = this.state.session.runners.map((current) =>
      current.id === runnerId
        ? {
            ...current,
            status: "finished" as const,
            finishAt: now,
            resultMs,
          }
        : current,
    );
    const isFinished = runners.every((current) => current.status === "finished");
    const nextSession: RaceSession = {
      ...this.state.session,
      running: runners.some((current) => current.status === "running"),
      completedAt: isFinished ? now : this.state.session.completedAt,
      runners,
    };

    this.commitTiming(`Llegada del dorsal ${runner.bib}`, "finish_runner", {
      ...this.state,
      phase: isFinished
        ? transitionRacePhase(this.state.phase, "race_finished")
        : this.state.phase,
      session: nextSession,
      history: isFinished
        ? this.upsertHistoryEntry(this.state.history, nextSession)
        : this.state.history,
      lastFinishedSession: isFinished
        ? this.toSessionSnapshot(nextSession)
        : this.state.lastFinishedSession,
    });
  }

  editRunnerResultFromText(runnerId: string, input: string): void {
    const parsed = parseDurationInput(input);
    if (parsed === null) {
      throw new Error("Usa un tiempo tipo 12:34.567, 1:02:03.000 o segundos.");
    }

    this.editRunnerResult(runnerId, parsed);
  }

  editRunnerResult(runnerId: string, resultMs: number): void {
    if (!Number.isFinite(resultMs) || resultMs < 0) {
      throw new Error("El tiempo debe ser positivo.");
    }

    const runner = this.findRunner(runnerId);
    if (runner.status !== "finished") {
      throw new Error("Solo se pueden editar tiempos ya registrados.");
    }

    const startAt = getRunnerStartAt(this.state, runner);
    const finishAt = startAt === undefined ? runner.finishAt : startAt + resultMs;
    const nextSession = {
      ...this.state.session,
      runners: this.state.session.runners.map((current) =>
        current.id === runnerId
          ? {
              ...current,
              finishAt,
              resultMs,
            }
          : current,
      ),
    };

    this.commitTiming(`Edicion del dorsal ${runner.bib}`, "edit_result", {
      ...this.state,
      session: nextSession,
      history:
        this.state.phase === "finished"
          ? this.upsertHistoryEntry(this.state.history, nextSession)
          : this.state.history,
      lastFinishedSession:
        this.state.phase === "finished"
          ? this.toSessionSnapshot(nextSession)
          : this.state.lastFinishedSession,
    });
  }

  undoLastTimingAction(): void {
    if (!this.state.session.lastAction) {
      throw new Error("No hay accion de cronometraje para deshacer.");
    }

    const action = this.state.session.lastAction;
    const previousSession = this.cloneSession(action.previousSession);
    const history = this.restoreHistoryForUndo(action, previousSession);

    this.commit({
      ...this.state,
      phase: action.previousPhase,
      session: previousSession,
      history,
      lastFinishedSession: this.getLatestFinishedSession(history),
    });
  }

  repeatRaceConfiguration(): void {
    if (this.state.config.runners.length === 0) {
      throw new Error("No hay corredores para repetir la carrera.");
    }

    this.commit({
      ...this.state,
      phase: transitionRacePhase(this.state.phase, "race_repeated"),
      session: createSessionFromConfig(this.state.config),
    });
  }

  resetSession(): void {
    this.commit({
      ...createInitialRaceState(this.state.config.mode, this.state.history),
      lastFinishedSession: this.getLatestFinishedSession(this.state.history),
    });
  }

  clearLocalData(): void {
    this.storage.clear();
    this.state = createInitialRaceState();
    this.listeners.forEach((listener) => listener(this.getSnapshot()));
  }

  private canEditConfiguration(): boolean {
    return (
      this.state.phase === "select_mode" ||
      this.state.phase === "register_runners" ||
      this.state.phase === "ready_to_start"
    );
  }

  private findRunner(runnerId: string): Runner {
    const runner = this.state.session.runners.find(
      (current) => current.id === runnerId,
    );
    if (!runner) {
      throw new Error("Corredor no encontrado.");
    }

    return runner;
  }

  private commitTiming(
    label: string,
    type: RaceAction["type"],
    nextState: RaceState,
  ): void {
    const action: RaceAction = {
      type,
      label,
      at: this.clock.getNow(),
      previousPhase: this.state.phase,
      previousSession: this.toSessionSnapshot(this.state.session),
    };

    this.commit({
      ...nextState,
      session: {
        ...nextState.session,
        running: nextState.session.runners.some(
          (runner) => runner.status === "running",
        ),
        lastAction: action,
      },
    });
  }

  private commit(nextState: RaceState): void {
    this.state = this.cloneState({
      ...nextState,
      session: {
        ...nextState.session,
        running: nextState.session.runners.some(
          (runner) => runner.status === "running",
        ),
      },
    });
    this.storage.save(this.state);
    this.listeners.forEach((listener) => listener(this.getSnapshot()));
  }

  private toSessionSnapshot(session: RaceSession): RaceSessionSnapshot {
    return {
      mode: session.mode,
      raceStartAt: session.raceStartAt,
      running: session.running,
      completedAt: session.completedAt,
      runners: session.runners.map((runner) => ({ ...runner })),
    };
  }

  private upsertHistoryEntry(
    history: RaceHistoryEntry[],
    session: RaceSession,
  ): RaceHistoryEntry[] {
    if (session.completedAt === undefined) {
      return this.cloneHistory(history);
    }

    const existingIndex = history.findIndex((entry) =>
      this.isSameHistorySession(entry, session),
    );
    const existingEntry =
      existingIndex >= 0 ? history[existingIndex] : undefined;
    const nextEntry = this.createHistoryEntry(session, existingEntry?.id);

    if (existingIndex < 0) {
      return [...this.cloneHistory(history), nextEntry];
    }

    return history.map((entry, index) =>
      index === existingIndex ? nextEntry : this.cloneHistoryEntry(entry),
    );
  }

  private restoreHistoryForUndo(
    action: RaceAction,
    previousSession: RaceSession,
  ): RaceHistoryEntry[] {
    if (this.state.phase !== "finished") {
      return this.cloneHistory(this.state.history);
    }

    if (action.previousPhase !== "finished") {
      return this.removeHistoryEntry(this.state.history, this.state.session);
    }

    return this.upsertHistoryEntry(this.state.history, previousSession);
  }

  private removeHistoryEntry(
    history: RaceHistoryEntry[],
    session: RaceSession,
  ): RaceHistoryEntry[] {
    if (session.completedAt === undefined) {
      return this.cloneHistory(history);
    }

    return history
      .filter((entry) => !this.isSameHistorySession(entry, session))
      .map((entry) => this.cloneHistoryEntry(entry));
  }

  private createHistoryEntry(
    session: RaceSession,
    existingId?: string,
  ): RaceHistoryEntry {
    const completedAt = session.completedAt ?? this.clock.getNow();
    const snapshot = this.toSessionSnapshot({
      ...session,
      completedAt,
      running: false,
    });

    return {
      id: existingId ?? this.createHistoryId(completedAt),
      completedAt,
      mode: snapshot.mode,
      runnerCount: snapshot.runners.length,
      session: snapshot,
    };
  }

  private isSameHistorySession(
    entry: RaceHistoryEntry,
    session: RaceSession,
  ): boolean {
    return (
      session.completedAt !== undefined &&
      entry.completedAt === session.completedAt &&
      entry.session.runners.length === session.runners.length
    );
  }

  private getLatestFinishedSession(
    history: RaceHistoryEntry[],
  ): RaceSessionSnapshot | undefined {
    const latest = [...history].sort((a, b) => b.completedAt - a.completedAt)[0];
    return latest ? this.cloneSession(latest.session) : undefined;
  }

  private cloneHistory(history: RaceHistoryEntry[]): RaceHistoryEntry[] {
    return history.map((entry) => this.cloneHistoryEntry(entry));
  }

  private cloneHistoryEntry(entry: RaceHistoryEntry): RaceHistoryEntry {
    return {
      ...entry,
      session: this.cloneSession(entry.session),
    };
  }

  private cloneState(state: RaceState): RaceState {
    return {
      ...state,
      config: {
        ...state.config,
        runners: state.config.runners.map((runner) => ({ ...runner })),
      },
      session: this.cloneSession(state.session),
      history: this.cloneHistory(state.history),
      lastFinishedSession: state.lastFinishedSession
        ? this.cloneSession(state.lastFinishedSession)
        : undefined,
    };
  }

  private cloneSession<T extends RaceSession | RaceSessionSnapshot>(
    session: T,
  ): T {
    return {
      ...session,
      runners: session.runners.map((runner) => ({ ...runner })),
      lastAction: "lastAction" in session && session.lastAction
        ? {
            ...session.lastAction,
            previousSession: {
              ...session.lastAction.previousSession,
              runners: session.lastAction.previousSession.runners.map((runner) => ({
                ...runner,
              })),
            },
          }
        : undefined,
    } as T;
  }

  private createRunnerId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `runner-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private createHistoryId(completedAt: number): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `history-${crypto.randomUUID()}`;
    }

    return `history-${completedAt}-${Math.random().toString(16).slice(2)}`;
  }
}
