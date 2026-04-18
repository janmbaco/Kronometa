import {
  Reactive,
  Services,
  PickComponent,
  PickRender,
} from "pick-components";

import type {
  RaceControlView,
  RunnerRowView,
} from "../race/domain/race.types";
import { RunnerSetupLifecycle } from "./runner-setup.lifecycle";
import styles from "./runner-setup.styles.css?raw";
import template from "./runner-setup.template.html?raw";

const EMPTY_CONTROL: RaceControlView = {
  phase: "register_runners",
  modeLabel: "Salida masiva",
  totalCount: 0,
  pendingCount: 0,
  runningCount: 0,
  finishedCount: 0,
  raceClockLabel: "--:--.---",
  statusText: "Añade corredores para preparar la carrera.",
  canStartMass: false,
  canUndo: false,
  canExport: false,
  canGoBackToRunners: false,
  canConfirmRunners: false,
  canRepeatRace: false,
  lastActionLabel: "Sin accion para deshacer",
};

@PickRender({
  selector: "runner-setup-view",
  lifecycle: () => Services.get(RunnerSetupLifecycle),
  template,
  styles,
})
export class RunnerSetupComponent extends PickComponent {
  @Reactive control: RaceControlView = EMPTY_CONTROL;
  @Reactive runners: RunnerRowView[] = [];
  @Reactive feedback = "";
  readonly backRequested$ = this.createIntent();
  readonly continueRequested$ = this.createIntent();

  requestBack(): void {
    this.backRequested$.notify();
  }

  requestContinue(): void {
    this.continueRequested$.notify();
  }
}
