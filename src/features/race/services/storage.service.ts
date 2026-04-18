import { Singleton } from "@janmbaco/injectkit";

import {
  createInitialRaceState,
  createSessionFromConfig,
} from "../domain/race.selectors";
import type {
  RaceConfiguration,
  RaceHistoryEntry,
  RaceMode,
  RacePhase,
  RaceSession,
  RaceSessionSnapshot,
  RaceState,
  Runner,
  RunnerConfig,
} from "../domain/race.types";

const STORAGE_KEY = "kronometa.state.v2";
const LEGACY_STORAGE_KEY = "kronometa.session.v1";

@Singleton()
export class StorageService {
  load(): RaceState {
    if (typeof window === "undefined") {
      return createInitialRaceState();
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return this.normalize(JSON.parse(raw));
      } catch {
        return createInitialRaceState();
      }
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      try {
        return this.normalizeLegacy(JSON.parse(legacyRaw));
      } catch {
        return createInitialRaceState();
      }
    }

    return createInitialRaceState();
  }

  save(state: RaceState): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  private normalize(value: unknown): RaceState {
    if (!value || typeof value !== "object") {
      return createInitialRaceState();
    }

    const candidate = value as Partial<RaceState>;
    const config = this.normalizeConfig(candidate.config);
    const session = this.normalizeSession(candidate.session, config);
    const phase = this.normalizePhase(candidate.phase, session, config);
    const history = this.mergeHistoryEntries(
      this.normalizeHistory(candidate.history),
      candidate.lastFinishedSession
        ? this.createHistoryEntryFromSession(
            this.normalizeSession(candidate.lastFinishedSession, config),
          )
        : undefined,
    );

    return {
      phase,
      config,
      session,
      history,
      lastFinishedSession: this.getLatestFinishedSession(history),
    };
  }

  private normalizeLegacy(value: unknown): RaceState {
    if (!value || typeof value !== "object") {
      return createInitialRaceState();
    }

    const legacy = value as {
      mode?: RaceMode;
      raceStartAt?: number;
      running?: boolean;
      runners?: Runner[];
      lastAction?: unknown;
    };
    const mode = legacy.mode === "staggered_start" ? legacy.mode : "mass_start";
    const runners = this.normalizeRunners(legacy.runners);
    const config: RaceConfiguration = {
      mode,
      runners: runners.map(({ id, bib, label }) => ({ id, bib, label })),
    };
    const session: RaceSession = {
      mode,
      raceStartAt:
        typeof legacy.raceStartAt === "number" ? legacy.raceStartAt : undefined,
      running: runners.some((runner) => runner.status === "running"),
      runners,
    };

    return {
      phase: this.normalizePhase(undefined, session, config),
      config,
      session,
      history: this.mergeHistoryEntries(
        this.createHistoryEntryFromSession(session),
      ),
      lastFinishedSession: this.createHistoryEntryFromSession(session)?.session,
    };
  }

  private normalizeConfig(value: unknown): RaceConfiguration {
    if (!value || typeof value !== "object") {
      return { mode: "mass_start", runners: [] };
    }

    const candidate = value as Partial<RaceConfiguration>;
    return {
      mode:
        candidate.mode === "staggered_start" ? "staggered_start" : "mass_start",
      runners: this.normalizeRunnerConfigs(candidate.runners),
    };
  }

  private normalizeSession(
    value: unknown,
    config: RaceConfiguration,
  ): RaceSession {
    if (!value || typeof value !== "object") {
      return createSessionFromConfig(config);
    }

    const candidate = value as Partial<RaceSession>;
    const runners = this.normalizeRunners(candidate.runners);

    return {
      mode:
        candidate.mode === "staggered_start" ? "staggered_start" : config.mode,
      raceStartAt:
        typeof candidate.raceStartAt === "number"
          ? candidate.raceStartAt
          : undefined,
      running: runners.some((runner) => runner.status === "running"),
      runners: runners.length > 0 ? runners : createSessionFromConfig(config).runners,
      lastAction: candidate.lastAction,
      completedAt:
        typeof candidate.completedAt === "number"
          ? candidate.completedAt
          : undefined,
    };
  }

  private normalizePhase(
    value: unknown,
    session: RaceSession,
    config: RaceConfiguration,
  ): RacePhase {
    if (
      value === "select_mode" ||
      value === "register_runners" ||
      value === "ready_to_start" ||
      value === "running_mass" ||
      value === "running_staggered" ||
      value === "finished"
    ) {
      return value;
    }

    if (
      session.runners.length > 0 &&
      session.runners.every((runner) => runner.status === "finished")
    ) {
      return "finished";
    }

    if (session.runners.some((runner) => runner.status === "running")) {
      return config.mode === "mass_start" ? "running_mass" : "running_staggered";
    }

    return config.runners.length > 0 ? "ready_to_start" : "select_mode";
  }

  private normalizeRunnerConfigs(value: unknown): RunnerConfig[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((runner) => runner && typeof runner === "object")
      .map((runner) => runner as Partial<RunnerConfig>)
      .filter((runner) => typeof runner.id === "string" && typeof runner.bib === "string")
      .map((runner) => ({
        id: runner.id as string,
        bib: runner.bib as string,
        label:
          typeof runner.label === "string"
            ? runner.label
            : `Dorsal ${runner.bib}`,
      }));
  }

  private normalizeRunners(value: unknown): Runner[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((runner) => runner && typeof runner === "object")
      .map((runner) => runner as Partial<Runner>)
      .filter((runner) => typeof runner.id === "string" && typeof runner.bib === "string")
      .map((runner) => ({
        id: runner.id as string,
        bib: runner.bib as string,
        label:
          typeof runner.label === "string"
            ? runner.label
            : `Dorsal ${runner.bib}`,
        status:
          runner.status === "running" || runner.status === "finished"
            ? runner.status
            : "pending",
        startAt: typeof runner.startAt === "number" ? runner.startAt : undefined,
        finishAt:
          typeof runner.finishAt === "number" ? runner.finishAt : undefined,
        resultMs:
          typeof runner.resultMs === "number" ? runner.resultMs : undefined,
      }));
  }

  private normalizeHistory(value: unknown): RaceHistoryEntry[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return this.mergeHistoryEntries(
      ...value.map((entry) => this.normalizeHistoryEntry(entry)),
    );
  }

  private normalizeHistoryEntry(value: unknown): RaceHistoryEntry | undefined {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    const candidate = value as Partial<RaceHistoryEntry>;
    const mode =
      candidate.mode === "staggered_start" ? "staggered_start" : "mass_start";
    const config: RaceConfiguration = { mode, runners: [] };
    const session = this.normalizeSession(candidate.session, config);
    const completedAt =
      typeof candidate.completedAt === "number"
        ? candidate.completedAt
        : this.inferCompletedAt(session);

    if (completedAt === undefined || session.runners.length === 0) {
      return undefined;
    }

    return {
      id:
        typeof candidate.id === "string"
          ? candidate.id
          : this.createHistoryId(completedAt),
      completedAt,
      mode: session.mode,
      runnerCount:
        typeof candidate.runnerCount === "number"
          ? candidate.runnerCount
          : session.runners.length,
      session: this.toSessionSnapshot(session, completedAt),
    };
  }

  private createHistoryEntryFromSession(
    session: RaceSession,
  ): RaceHistoryEntry | undefined {
    if (
      session.runners.length === 0 ||
      !session.runners.some(
        (runner) => runner.status === "finished" && runner.resultMs !== undefined,
      )
    ) {
      return undefined;
    }

    const completedAt = session.completedAt ?? this.inferCompletedAt(session);
    if (completedAt === undefined) {
      return undefined;
    }

    return {
      id: this.createHistoryId(completedAt),
      completedAt,
      mode: session.mode,
      runnerCount: session.runners.length,
      session: this.toSessionSnapshot(session, completedAt),
    };
  }

  private mergeHistoryEntries(
    ...entries: Array<RaceHistoryEntry | RaceHistoryEntry[] | undefined>
  ): RaceHistoryEntry[] {
    const merged: RaceHistoryEntry[] = [];

    for (const entryOrList of entries) {
      const list = Array.isArray(entryOrList)
        ? entryOrList
        : entryOrList
          ? [entryOrList]
          : [];

      for (const entry of list) {
        const index = merged.findIndex(
          (current) =>
            current.completedAt === entry.completedAt &&
            current.mode === entry.mode &&
            current.runnerCount === entry.runnerCount,
        );

        if (index >= 0) {
          merged[index] = this.cloneHistoryEntry(entry);
        } else {
          merged.push(this.cloneHistoryEntry(entry));
        }
      }
    }

    return merged;
  }

  private getLatestFinishedSession(
    history: RaceHistoryEntry[],
  ): RaceSessionSnapshot | undefined {
    const latest = [...history].sort((a, b) => b.completedAt - a.completedAt)[0];
    return latest
      ? {
          ...latest.session,
          runners: latest.session.runners.map((runner) => ({ ...runner })),
        }
      : undefined;
  }

  private cloneHistoryEntry(entry: RaceHistoryEntry): RaceHistoryEntry {
    return {
      ...entry,
      session: {
        ...entry.session,
        runners: entry.session.runners.map((runner) => ({ ...runner })),
      },
    };
  }

  private inferCompletedAt(session: RaceSession): number | undefined {
    const finishTimes = session.runners
      .map((runner) => runner.finishAt)
      .filter((finishAt): finishAt is number => typeof finishAt === "number");

    if (finishTimes.length > 0) {
      return Math.max(...finishTimes);
    }

    return typeof session.completedAt === "number"
      ? session.completedAt
      : undefined;
  }

  private createHistoryId(completedAt: number): string {
    return `history-${completedAt}`;
  }

  private toSessionSnapshot(
    session: RaceSession,
    completedAt: number,
  ): RaceSessionSnapshot {
    return {
      mode: session.mode,
      raceStartAt: session.raceStartAt,
      running: false,
      completedAt,
      runners: session.runners.map((runner) => ({ ...runner })),
    };
  }
}
