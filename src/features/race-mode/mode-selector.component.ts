import {
  Listen,
  Reactive,
  Services,
  PickComponent,
  PickRender,
} from "pick-components";

import type { RaceMode } from "../race/domain/race.types";
import { ModeSelectorLifecycle } from "./mode-selector.lifecycle";
import styles from "./mode-selector.styles.css?raw";
import template from "./mode-selector.template.html?raw";

@PickRender({
  selector: "race-mode-selector",
  lifecycle: () => Services.get(ModeSelectorLifecycle),
  template,
  styles,
})
export class ModeSelectorComponent extends PickComponent {
  @Reactive mode: RaceMode = "mass_start";
  @Reactive canchange = "true";
  @Reactive message = "";
  readonly modeChangeRequested$ = this.createIntent<RaceMode>();

  get modeLabel(): string {
    return this.mode === "mass_start" ? "Salida masiva" : "Salidas escalonadas";
  }

  get modeLocked(): boolean {
    return this.canchange !== "true";
  }

  get hint(): string {
    if (this.message) {
      return this.message;
    }

    return this.modeLocked
      ? "El modo queda bloqueado cuando hay tiempos registrados."
      : "Puedes cambiarlo antes de iniciar el cronometraje.";
  }

  get massCardClass(): string {
    return this.getCardClass("mass_start");
  }

  get staggeredCardClass(): string {
    return this.getCardClass("staggered_start");
  }

  @Listen("#raceMode", "change")
  onModeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as RaceMode;
    this.requestMode(value);
  }

  @Listen(".mode-card", "click")
  onModeCardClick(event: Event): void {
    const target = event.target as Element | null;
    const button = target?.closest<HTMLButtonElement>(".mode-card");
    const mode = button?.dataset.mode as RaceMode | undefined;
    if (!button || !mode || this.modeLocked) {
      return;
    }

    const select = button
      .closest<HTMLElement>(".mode-panel")
      ?.querySelector<HTMLSelectElement>("#raceMode");
    if (select) {
      select.value = mode;
    }

    this.requestMode(mode);
  }

  private requestMode(value: RaceMode): void {
    this.modeChangeRequested$.notify(value);
  }

  private getCardClass(mode: RaceMode): string {
    return [
      "mode-card",
      this.mode === mode ? "selected" : "",
      this.modeLocked ? "locked" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }
}
