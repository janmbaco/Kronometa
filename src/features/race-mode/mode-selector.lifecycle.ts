import { Transient } from "@janmbaco/injectkit";
import { PickLifecycleManager } from "pick-components";

import { RaceService } from "../race/services/race.service";
import type { ModeSelectorComponent } from "./mode-selector.component";

@Transient({ deps: [RaceService] })
export class ModeSelectorLifecycle extends PickLifecycleManager<ModeSelectorComponent> {
  constructor(private readonly raceService: RaceService) {
    super();
  }

  protected onComponentReady(component: ModeSelectorComponent): void {
    this.addSubscription(
      component.modeChangeRequested$.subscribe((mode) => {
        try {
          this.raceService.setMode(mode);
          component.message = "";
        } catch (error) {
          component.message =
            error instanceof Error ? error.message : "No se pudo cambiar el modo.";
        }
      }),
    );
  }
}
