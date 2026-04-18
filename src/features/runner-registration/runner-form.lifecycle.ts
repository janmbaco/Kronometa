import { Transient } from "@janmbaco/injectkit";
import { PickLifecycleManager } from "pick-components";

import { RaceService } from "../race/services/race.service";
import type { RunnerFormComponent } from "./runner-form.component";

@Transient({ deps: [RaceService] })
export class RunnerFormLifecycle extends PickLifecycleManager<RunnerFormComponent> {
  constructor(private readonly raceService: RaceService) {
    super();
  }

  protected onComponentReady(component: RunnerFormComponent): void {
    this.addSubscription(
      component.addRunnerRequested$.subscribe(({ bib, label }) => {
        try {
          this.raceService.addRunner(bib, label);
          component.message = "Corredor añadido.";
          component.clearForm();
        } catch (error) {
          component.message =
            error instanceof Error ? error.message : "No se pudo añadir el corredor.";
        }
      }),
    );
  }
}
