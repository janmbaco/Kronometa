import { Transient } from "@janmbaco/injectkit";
import { PickInitializer } from "pick-components";

import { ClockService } from "../race/services/clock.service";
import { RaceService } from "../race/services/race.service";
import type { KronometaAppComponent } from "./kronometa-app.component";

@Transient({ deps: [RaceService, ClockService] })
export class KronometaAppInitializer extends PickInitializer<KronometaAppComponent> {
  constructor(
    private readonly raceService: RaceService,
    private readonly clockService: ClockService,
  ) {
    super();
  }

  protected onInitialize(component: KronometaAppComponent): boolean {
    component.hydrate(
      this.raceService.getSnapshot(),
      this.clockService.getNow(),
    );
    return true;
  }
}
