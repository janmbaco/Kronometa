import {
  Reactive,
  Services,
  PickComponent,
  PickRender,
} from "pick-components";

import type {
  RaceControlView,
  RaceHistoryEntryView,
  ResultRowView,
  RunnerRowView,
} from "../race/domain/race.types";
import { ResultsViewLifecycle } from "./results-view.lifecycle";
import styles from "./results-view.styles.css?raw";
import template from "./results-view.template.html?raw";

const EMPTY_CONTROL: RaceControlView = {
  phase: "finished",
  modeLabel: "Salida masiva",
  totalCount: 0,
  pendingCount: 0,
  runningCount: 0,
  finishedCount: 0,
  raceClockLabel: "--:--.---",
  statusText: "Resultados disponibles.",
  canStartMass: false,
  canUndo: false,
  canExport: false,
  canGoBackToRunners: false,
  canConfirmRunners: false,
  canRepeatRace: false,
  lastActionLabel: "Sin accion para deshacer",
};

@PickRender({
  selector: "results-view",
  lifecycle: () => Services.get(ResultsViewLifecycle),
  template,
  styles,
})
export class ResultsViewComponent extends PickComponent {
  @Reactive control: RaceControlView = EMPTY_CONTROL;
  @Reactive results: ResultRowView[] = [];
  @Reactive history: RaceHistoryEntryView[] = [];
  @Reactive historyCountLabel = "0 carreras";
  @Reactive runners: RunnerRowView[] = [];
  @Reactive feedback = "";
  readonly exportRequested$ = this.createIntent();
  readonly repeatRequested$ = this.createIntent();
  readonly resetRequested$ = this.createIntent();

  requestExport(): void {
    this.exportRequested$.notify();
  }

  requestRepeat(): void {
    this.repeatRequested$.notify();
  }

  requestReset(): void {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(
        "¿Crear una carrera nueva? La configuracion actual se reinicia, pero el historico se conserva.",
      );
    if (confirmed) {
      this.resetRequested$.notify();
    }
  }
}
