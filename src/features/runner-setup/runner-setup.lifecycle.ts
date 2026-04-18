import { Transient } from "@janmbaco/injectkit";
import { PickLifecycleManager } from "pick-components";

import {
  getRaceControlView,
  getRunnerRowViews,
} from "../race/domain/race.selectors";
import { ClockService } from "../race/services/clock.service";
import { RaceService } from "../race/services/race.service";
import type { RunnerSetupComponent } from "./runner-setup.component";

@Transient({ deps: [RaceService, ClockService] })
export class RunnerSetupLifecycle extends PickLifecycleManager<RunnerSetupComponent> {
  constructor(
    private readonly raceService: RaceService,
    private readonly clockService: ClockService,
  ) {
    super();
  }

  protected onComponentReady(component: RunnerSetupComponent): void {
    this.addSubscription(
      this.raceService.subscribe((state) => {
        const now = this.clockService.getNow();
        component.control = getRaceControlView(state, now);
        component.runners = getRunnerRowViews(state, now);
      }),
    );

    this.addSubscription(
      component.backRequested$.subscribe(() => {
        this.run(component, () => this.raceService.backToModeSelection());
      }),
    );

    this.addSubscription(
      component.continueRequested$.subscribe(() => {
        this.run(component, () => this.raceService.confirmRunnerSetup());
      }),
    );
  }

  private run(component: RunnerSetupComponent, action: () => void): void {
    try {
      action();
      component.feedback = "";
    } catch (error) {
      component.feedback =
        error instanceof Error ? error.message : "No se pudo continuar.";
    }
  }
}
