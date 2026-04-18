import { Transient } from "@janmbaco/injectkit";
import { PickLifecycleManager } from "pick-components";

import { getPhaseForRoute, getRouteForPhase } from "../race/domain/race-flow.machine";
import { ClockService } from "../race/services/clock.service";
import { RaceService } from "../race/services/race.service";
import { KronometaRoutingService } from "../routing/services/kronometa-routing.service";
import type { KronometaAppComponent } from "./kronometa-app.component";

@Transient({ deps: [RaceService, ClockService, KronometaRoutingService] })
export class KronometaAppLifecycle extends PickLifecycleManager<KronometaAppComponent> {
  constructor(
    private readonly raceService: RaceService,
    private readonly clockService: ClockService,
    private readonly routingService: KronometaRoutingService,
  ) {
    super();
  }

  protected onComponentReady(component: KronometaAppComponent): void {
    const syncRoute = () => {
      const state = this.raceService.getSnapshot();
      const expectedPath = getRouteForPhase(state.phase);
      const currentPath = this.routingService.getCurrentPath();
      const currentPhase = getPhaseForRoute(currentPath);

      if (currentPath === "/" || currentPhase === null || currentPath !== expectedPath) {
        this.routingService.navigateTo(expectedPath, { replace: true });
      }
    };

    this.addSubscription(
      this.raceService.subscribe((state) => {
        component.hydrate(state, this.clockService.getNow());
        syncRoute();
      }),
    );
    this.addSubscription(this.routingService.subscribe(syncRoute));
    syncRoute();
  }
}
