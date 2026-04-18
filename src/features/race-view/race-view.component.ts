import {
  Reactive,
  Services,
  PickComponent,
  PickRender,
} from "pick-components";

import type {
  RaceControlView,
  RaceMode,
  RacePhase,
  RunnerRowView,
} from "../race/domain/race.types";
import { RaceViewLifecycle } from "./race-view.lifecycle";
import styles from "./race-view.styles.css?raw";
import template from "./race-view.template.html?raw";

const EMPTY_CONTROL: RaceControlView = {
  phase: "ready_to_start",
  modeLabel: "Salida masiva",
  totalCount: 0,
  pendingCount: 0,
  runningCount: 0,
  finishedCount: 0,
  raceClockLabel: "--:--.---",
  statusText: "Lista preparada para iniciar.",
  canStartMass: false,
  canUndo: false,
  canExport: false,
  canGoBackToRunners: false,
  canConfirmRunners: false,
  canRepeatRace: false,
  lastActionLabel: "Sin accion para deshacer",
};

const EMPTY_RUNNER: RunnerRowView = {
  id: "",
  bib: "-",
  label: "-",
  status: "pending",
  startAt: undefined,
  resultMs: undefined,
  statusLabel: "Pendiente",
  elapsedLabel: "--:--.---",
  referenceLabel: "-",
  canStart: false,
  canFinish: false,
  canDelete: false,
  isFinished: false,
  isNextToStart: false,
  resultInputValue: "--:--.---",
  rowClass: "runner-row pending",
};

@PickRender({
  selector: "race-view",
  lifecycle: () => Services.get(RaceViewLifecycle),
  template,
  styles,
})
export class RaceViewComponent extends PickComponent {
  @Reactive phase: RacePhase = "ready_to_start";
  @Reactive mode: RaceMode = "mass_start";
  @Reactive isMassMode = true;
  @Reactive isStaggeredMode = false;
  @Reactive control: RaceControlView = EMPTY_CONTROL;
  @Reactive raceClockLabel = EMPTY_CONTROL.raceClockLabel;
  @Reactive runners: RunnerRowView[] = [];
  @Reactive pendingRunners: RunnerRowView[] = [];
  @Reactive waitingRunners: RunnerRowView[] = [];
  @Reactive runningRunners: RunnerRowView[] = [];
  @Reactive finishedRunners: RunnerRowView[] = [];
  @Reactive nextRunner: RunnerRowView = EMPTY_RUNNER;
  @Reactive hasNextRunner = false;
  @Reactive hasWaitingRunners = false;
  @Reactive hasRunningRunners = false;
  @Reactive hasFinishedRunners = false;
  @Reactive feedback = "";
  readonly startMassRequested$ = this.createIntent();
  readonly startNextRequested$ = this.createIntent();
  readonly undoRequested$ = this.createIntent();
  readonly backRequested$ = this.createIntent();

  requestStartMass(): void {
    this.startMassRequested$.notify();
  }

  requestStartNext(): void {
    this.startNextRequested$.notify();
  }

  requestUndo(): void {
    this.undoRequested$.notify();
  }

  requestBack(): void {
    this.backRequested$.notify();
  }
}
