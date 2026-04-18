import {
  Reactive,
  Services,
  PickComponent,
  PickRender,
} from "pick-components";

import type { RaceControlView } from "../race/domain/race.types";
import { RaceControlsLifecycle } from "./race-controls.lifecycle";
import styles from "./race-controls.styles.css?raw";
import template from "./race-controls.template.html?raw";

const EMPTY_CONTROL: RaceControlView = {
  phase: "select_mode",
  modeLabel: "Salida masiva",
  totalCount: 0,
  pendingCount: 0,
  runningCount: 0,
  finishedCount: 0,
  raceClockLabel: "--:--.---",
  statusText: "Sin corredores.",
  canStartMass: false,
  canUndo: false,
  canExport: false,
  canGoBackToRunners: false,
  canConfirmRunners: false,
  canRepeatRace: false,
  lastActionLabel: "Sin accion para deshacer",
};

@PickRender({
  selector: "race-controls",
  lifecycle: () => Services.get(RaceControlsLifecycle),
  template,
  styles,
})
export class RaceControlsComponent extends PickComponent {
  @Reactive control: RaceControlView = EMPTY_CONTROL;
  @Reactive raceClockLabel = EMPTY_CONTROL.raceClockLabel;
  @Reactive feedback = "";
  readonly startMassRequested$ = this.createIntent();
  readonly undoRequested$ = this.createIntent();
  readonly exportRequested$ = this.createIntent();
  readonly resetRequested$ = this.createIntent();

  requestStartMass(): void {
    this.startMassRequested$.notify();
  }

  requestUndo(): void {
    this.undoRequested$.notify();
  }

  requestExport(): void {
    this.exportRequested$.notify();
  }

  requestReset(): void {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm("¿Crear una sesion nueva y borrar los tiempos actuales?");
    if (confirmed) {
      this.resetRequested$.notify();
    }
  }
}
