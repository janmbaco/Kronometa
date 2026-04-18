import {
  Reactive,
  Services,
  PickComponent,
  PickRender,
} from "pick-components";

import type { RaceMode } from "../race/domain/race.types";
import { SetupModeLifecycle } from "./setup-mode.lifecycle";
import styles from "./setup-mode.styles.css?raw";
import template from "./setup-mode.template.html?raw";

@PickRender({
  selector: "setup-mode-view",
  lifecycle: () => Services.get(SetupModeLifecycle),
  template,
  styles,
})
export class SetupModeComponent extends PickComponent {
  @Reactive mode: RaceMode = "mass_start";
  @Reactive feedback = "";
  readonly continueRequested$ = this.createIntent();

  requestContinue(): void {
    this.continueRequested$.notify();
  }
}
