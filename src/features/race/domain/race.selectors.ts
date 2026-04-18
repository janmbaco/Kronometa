import type {
  RaceHistoryEntry,
  RaceHistoryEntryView,
  RaceControlView,
  RaceConfiguration,
  RaceMode,
  RaceSession,
  RaceState,
  ResultRowView,
  Runner,
  RunnerRowView,
} from "./race.types";
import { formatDuration, formatGap } from "./time-format";

export function createInitialRaceState(
  mode: RaceMode = "mass_start",
  history: RaceHistoryEntry[] = [],
): RaceState {
  const config: RaceConfiguration = {
    mode,
    runners: [],
  };

  return {
    phase: "select_mode",
    config,
    session: createSessionFromConfig(config),
    history: history.map((entry) => ({
      ...entry,
      session: {
        ...entry.session,
        runners: entry.session.runners.map((runner) => ({ ...runner })),
      },
    })),
  };
}

export function createSessionFromConfig(config: RaceConfiguration): RaceSession {
  return {
    mode: config.mode,
    running: false,
    runners: config.runners.map((runner) => ({
      ...runner,
      status: "pending",
    })),
  };
}

export function getModeLabel(mode: RaceMode): string {
  return mode === "mass_start" ? "Salida masiva" : "Salidas escalonadas";
}

export function getRunnerStartAt(
  state: RaceState | RaceSession,
  runner: Runner,
): number | undefined {
  const mode = "config" in state ? state.config.mode : state.mode;
  const raceStartAt = "session" in state ? state.session.raceStartAt : state.raceStartAt;

  if (mode === "mass_start") {
    return raceStartAt;
  }

  return runner.startAt;
}

export function getRunnerElapsedMs(
  state: RaceState,
  runner: Runner,
  now: number,
): number | undefined {
  if (runner.status === "finished") {
    return runner.resultMs;
  }

  if (runner.status !== "running") {
    return undefined;
  }

  const startAt = getRunnerStartAt(state, runner);
  if (startAt === undefined) {
    return undefined;
  }

  return Math.max(0, now - startAt);
}

export function getFinishedRunners(state: RaceState): Runner[] {
  return getFinishedRunnersFromSession(state.session);
}

export function getFinishedRunnersFromSession(session: RaceSession): Runner[] {
  return session.runners
    .filter((runner) => runner.status === "finished" && runner.resultMs !== undefined)
    .sort((a, b) => (a.resultMs ?? 0) - (b.resultMs ?? 0));
}

export function canChangeRaceMode(state: RaceState): boolean {
  return (
    state.phase === "select_mode" ||
    state.phase === "register_runners" ||
    state.phase === "ready_to_start"
  );
}

export function getRaceControlView(
  state: RaceState,
  now: number,
): RaceControlView {
  const runners = state.session.runners;
  const pendingCount = runners.filter((runner) => runner.status === "pending").length;
  const runningCount = runners.filter((runner) => runner.status === "running").length;
  const finishedCount = runners.filter((runner) => runner.status === "finished").length;
  const raceClockMs =
    state.config.mode === "mass_start" && state.session.raceStartAt !== undefined
      ? Math.max(0, now - state.session.raceStartAt)
      : undefined;

  return {
    phase: state.phase,
    modeLabel: getModeLabel(state.config.mode),
    totalCount: runners.length,
    pendingCount,
    runningCount,
    finishedCount,
    raceClockLabel: formatDuration(raceClockMs),
    statusText: getRaceStatusText(state),
    canStartMass:
      state.phase === "ready_to_start" &&
      state.config.mode === "mass_start" &&
      runners.length > 0,
    canUndo: state.session.lastAction !== undefined,
    canExport: state.history.length > 0,
    canGoBackToRunners: state.phase === "ready_to_start",
    canConfirmRunners:
      state.phase === "register_runners" && state.config.runners.length > 0,
    canRepeatRace: state.phase === "finished" && state.config.runners.length > 0,
    lastActionLabel: state.session.lastAction?.label ?? "Sin accion para deshacer",
  };
}

export function getRunnerRowViews(
  state: RaceState,
  now: number,
): RunnerRowView[] {
  const nextPendingId = getNextPendingRunner(state)?.id;

  return state.session.runners.map((runner) => {
    const elapsedMs = getRunnerElapsedMs(state, runner, now);
    const reference =
      state.config.mode === "mass_start"
        ? state.session.raceStartAt
        : runner.startAt;
    const isNextToStart = runner.id === nextPendingId;

    return {
      id: runner.id,
      bib: runner.bib,
      label: runner.label,
      status: runner.status,
      startAt: reference,
      resultMs: runner.resultMs,
      statusLabel: getRunnerStatusLabel(runner.status),
      elapsedLabel: formatDuration(elapsedMs),
      referenceLabel: reference ? new Date(reference).toLocaleTimeString() : "-",
      canStart:
        state.config.mode === "staggered_start" &&
        (state.phase === "ready_to_start" || state.phase === "running_staggered") &&
        runner.status === "pending" &&
        isNextToStart,
      canFinish: runner.status === "running",
      canDelete:
        (state.phase === "register_runners" ||
          state.phase === "ready_to_start") &&
        runner.status === "pending" &&
        runner.startAt === undefined &&
        runner.finishAt === undefined &&
        runner.resultMs === undefined,
      isFinished: runner.status === "finished",
      isNextToStart,
      resultInputValue: formatDuration(runner.resultMs),
      rowClass: [
        "runner-row",
        runner.status,
        isNextToStart ? "next-to-start" : "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  });
}

export function getNextPendingRunner(state: RaceState): Runner | undefined {
  return state.session.runners.find((runner) => runner.status === "pending");
}

export function getResultRowViews(state: RaceState): ResultRowView[] {
  return getSessionResultRowViews(state.session);
}

export function getSessionResultRowViews(session: RaceSession): ResultRowView[] {
  const finished = getFinishedRunnersFromSession(session);
  const bestMs = finished[0]?.resultMs ?? 0;

  return finished.map((runner, index) => {
    const resultMs = runner.resultMs ?? 0;
    const isLeader = index === 0;

    return {
      position: index + 1,
      runnerId: runner.id,
      bib: runner.bib,
      label: runner.label,
      timeLabel: formatDuration(resultMs),
      gapLabel: formatGap(resultMs - bestMs),
      isLeader,
      rowClass: isLeader ? "leader" : "",
    };
  });
}

export function getHistoryEntryViews(state: RaceState): RaceHistoryEntryView[] {
  return [...state.history]
    .sort((a, b) => b.completedAt - a.completedAt)
    .map((entry) => {
      const results = getSessionResultRowViews(entry.session);
      const winner = results[0];

      return {
        id: entry.id,
        completedAtLabel: formatHistoryDate(entry.completedAt),
        modeLabel: getModeLabel(entry.mode),
        runnerCountLabel:
          entry.runnerCount === 1
            ? "1 corredor"
            : `${entry.runnerCount} corredores`,
        winnerLabel: winner
          ? `${winner.bib} · ${winner.label}`
          : "Sin resultados",
        bestTimeLabel: winner?.timeLabel ?? "--:--.---",
        results,
      };
    });
}

function getRaceStatusText(state: RaceState): string {
  if (state.phase === "select_mode") {
    return "Elige el tipo de salida para crear la carrera.";
  }

  if (state.config.runners.length === 0) {
    return "Añade corredores para preparar la carrera.";
  }

  if (state.phase === "register_runners") {
    return "Carga la lista de corredores antes de preparar la salida.";
  }

  if (state.phase === "ready_to_start") {
    return "Lista preparada para iniciar.";
  }

  if (state.phase === "finished") {
    return "Carrera finalizada. Resultados disponibles.";
  }

  if (state.session.running) {
    return "Cronometraje en curso.";
  }

  if (state.session.runners.some((runner) => runner.status === "finished")) {
    return "Resultados disponibles.";
  }

  return state.config.mode === "staggered_start"
    ? "Listo para iniciar salidas individuales."
    : "Listo.";
}

function getRunnerStatusLabel(status: Runner["status"]): string {
  if (status === "pending") {
    return "Pendiente";
  }

  if (status === "running") {
    return "En carrera";
  }

  return "Finalizado";
}

function formatHistoryDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  });
}
