import {
  Reactive,
  Services,
  PickComponent,
  PickRender,
} from "pick-components";

import {
  canChangeRaceMode,
  getRaceControlView,
  getResultRowViews,
  getRunnerRowViews,
} from "../race/domain/race.selectors";
import type {
  RaceControlView,
  RaceMode,
  RacePhase,
  RaceState,
  ResultRowView,
  RunnerRowView,
} from "../race/domain/race.types";
import { KronometaAppInitializer } from "./kronometa-app.initializer";
import { KronometaAppLifecycle } from "./kronometa-app.lifecycle";
import styles from "./kronometa-app.styles.css?raw";
import template from "./kronometa-app.template.html?raw";

const EMPTY_CONTROL: RaceControlView = {
  phase: "select_mode",
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
  selector: "kronometa-app",
  initializer: () => Services.get(KronometaAppInitializer),
  lifecycle: () => Services.get(KronometaAppLifecycle),
  skeleton:
    '<main class="app-shell" aria-busy="true"><p>Cargando sesion de cronometraje...</p></main>',
  errorTemplate:
    '<main class="app-shell"><p role="alert">No se pudo iniciar Kronometa.</p></main>',
  template,
  styles,
})
export class KronometaAppComponent extends PickComponent {
  @Reactive phase: RacePhase = "select_mode";
  @Reactive mode: RaceMode = "mass_start";
  @Reactive canchange = "true";
  @Reactive control: RaceControlView = EMPTY_CONTROL;
  @Reactive runners: RunnerRowView[] = [];
  @Reactive results: ResultRowView[] = [];

  hydrate(state: RaceState, now: number): void {
    this.phase = state.phase;
    this.mode = state.config.mode;
    this.canchange = String(canChangeRaceMode(state));
    this.control = getRaceControlView(state, now);
    this.runners = getRunnerRowViews(state, now);
    this.results = getResultRowViews(state);
  }
}
