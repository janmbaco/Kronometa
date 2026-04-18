export type RaceMode = "mass_start" | "staggered_start";

export type RunnerStatus = "pending" | "running" | "finished";

export type RacePhase =
  | "select_mode"
  | "register_runners"
  | "ready_to_start"
  | "running_mass"
  | "running_staggered"
  | "finished";

export interface RunnerConfig {
  id: string;
  bib: string;
  label: string;
}

export interface Runner {
  id: string;
  bib: string;
  label: string;
  status: RunnerStatus;
  startAt?: number;
  finishAt?: number;
  resultMs?: number;
}

export interface RaceAction {
  type:
    | "start_mass"
    | "start_runner"
    | "finish_runner"
    | "edit_result";
  label: string;
  at: number;
  previousPhase: RacePhase;
  previousSession: RaceSessionSnapshot;
}

export interface RaceConfiguration {
  mode: RaceMode;
  runners: RunnerConfig[];
}

export interface RaceHistoryEntry {
  id: string;
  completedAt: number;
  mode: RaceMode;
  runnerCount: number;
  session: RaceSessionSnapshot;
}

export interface RaceSession {
  mode: RaceMode;
  raceStartAt?: number;
  running: boolean;
  runners: Runner[];
  lastAction?: RaceAction;
  completedAt?: number;
}

export interface RaceState {
  phase: RacePhase;
  config: RaceConfiguration;
  session: RaceSession;
  history: RaceHistoryEntry[];
  lastFinishedSession?: RaceSessionSnapshot;
}

export type RaceSessionSnapshot = Omit<RaceSession, "lastAction">;

export interface RunnerRowView {
  id: string;
  bib: string;
  label: string;
  status: RunnerStatus;
  startAt?: number;
  resultMs?: number;
  statusLabel: string;
  elapsedLabel: string;
  referenceLabel: string;
  canStart: boolean;
  canFinish: boolean;
  canDelete: boolean;
  isFinished: boolean;
  isNextToStart: boolean;
  resultInputValue: string;
  rowClass: string;
}

export interface ResultRowView {
  position: number;
  runnerId: string;
  bib: string;
  label: string;
  timeLabel: string;
  gapLabel: string;
  isLeader: boolean;
  rowClass: string;
}

export interface RaceHistoryEntryView {
  id: string;
  completedAtLabel: string;
  modeLabel: string;
  runnerCountLabel: string;
  winnerLabel: string;
  bestTimeLabel: string;
  results: ResultRowView[];
}

export interface RaceControlView {
  phase: RacePhase;
  modeLabel: string;
  totalCount: number;
  pendingCount: number;
  runningCount: number;
  finishedCount: number;
  raceClockLabel: string;
  statusText: string;
  canStartMass: boolean;
  canUndo: boolean;
  canExport: boolean;
  canGoBackToRunners: boolean;
  canConfirmRunners: boolean;
  canRepeatRace: boolean;
  lastActionLabel: string;
}
