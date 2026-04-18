import { Transient } from "@janmbaco/injectkit";
import { PickLifecycleManager } from "pick-components";

import { RaceService } from "../race/services/race.service";
import type { SetupModeComponent } from "./setup-mode.component";

@Transient({ deps: [RaceService] })
export class SetupModeLifecycle extends PickLifecycleManager<SetupModeComponent> {
  constructor(private readonly raceService: RaceService) {
    super();
  }

  protected onComponentReady(component: SetupModeComponent): void {
    this.addSubscription(
      this.raceService.subscribe((state) => {
        component.mode = state.config.mode;
      }),
    );

    this.addSubscription(
      component.continueRequested$.subscribe(() => {
        try {
          this.raceService.confirmModeSelection();
          component.feedback = "";
        } catch (error) {
          component.feedback =
            error instanceof Error ? error.message : "No se pudo continuar.";
        }
      }),
    );
  }
}
