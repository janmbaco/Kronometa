import { Transient } from "@janmbaco/injectkit";
import { PickLifecycleManager } from "pick-components";

import {
  getRaceControlView,
  getRunnerRowViews,
} from "../race/domain/race.selectors";
import { formatDuration } from "../race/domain/time-format";
import { ClockService } from "../race/services/clock.service";
import { RaceService } from "../race/services/race.service";
import type { RaceViewComponent } from "./race-view.component";

@Transient({ deps: [RaceService, ClockService] })
export class RaceViewLifecycle extends PickLifecycleManager<RaceViewComponent> {
  constructor(
    private readonly raceService: RaceService,
    private readonly clockService: ClockService,
  ) {
    super();
  }

  protected onComponentReady(component: RaceViewComponent): void {
    const syncClock = () => {
      const state = this.raceService.getSnapshot();
      const nextLabel =
        state.config.mode === "mass_start" && state.session.raceStartAt !== undefined
          ? formatDuration(this.clockService.getNow() - state.session.raceStartAt)
          : formatDuration(undefined);

      if (component.raceClockLabel !== nextLabel) {
        component.raceClockLabel = nextLabel;
      }
    };

    this.addSubscription(
      this.raceService.subscribe((state) => {
        const now = this.clockService.getNow();
        const runners = getRunnerRowViews(state, now);
        const pending = runners.filter((runner) => runner.status === "pending");
        const [nextRunner, ...waitingRunners] = pending;

        component.phase = state.phase;
        component.mode = state.config.mode;
        component.isMassMode = state.config.mode === "mass_start";
        component.isStaggeredMode = state.config.mode === "staggered_start";
        component.control = getRaceControlView(state, now);
        component.raceClockLabel = component.control.raceClockLabel;
        component.runners = runners;
        component.pendingRunners = pending;
        component.waitingRunners = waitingRunners;
        component.runningRunners = runners.filter(
          (runner) => runner.status === "running",
        );
        component.finishedRunners = runners.filter(
          (runner) => runner.status === "finished",
        );
        component.nextRunner = nextRunner ?? component.nextRunner;
        component.hasNextRunner = nextRunner !== undefined;
        component.hasWaitingRunners = waitingRunners.length > 0;
        component.hasRunningRunners = component.runningRunners.length > 0;
        component.hasFinishedRunners = component.finishedRunners.length > 0;
        syncClock();
      }),
    );
    this.addSubscription(this.clockService.subscribe(syncClock));

    this.addSubscription(
      component.startMassRequested$.subscribe(() => {
        this.run(component, () => this.raceService.startMassRace(), "Salida iniciada.");
      }),
    );

    this.addSubscription(
      component.startNextRequested$.subscribe(() => {
        this.run(
          component,
          () => this.raceService.startNextRunner(),
          "Salida registrada.",
        );
      }),
    );

    this.addSubscription(
      component.undoRequested$.subscribe(() => {
        this.run(
          component,
          () => this.raceService.undoLastTimingAction(),
          "Ultima accion deshecha.",
        );
      }),
    );

    this.addSubscription(
      component.backRequested$.subscribe(() => {
        this.run(component, () => this.raceService.backToRunnerSetup(), "");
      }),
    );
  }

  private run(
    component: RaceViewComponent,
    action: () => void,
    successMessage: string,
  ): void {
    try {
      action();
      component.feedback = successMessage;
    } catch (error) {
      component.feedback =
        error instanceof Error ? error.message : "No se pudo completar la accion.";
    }
  }
}
