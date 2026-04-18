import { Transient } from "@janmbaco/injectkit";
import { PickLifecycleManager } from "pick-components";

import { formatDuration } from "../race/domain/time-format";
import type { RunnerRowView } from "../race/domain/race.types";
import { ClockService } from "../race/services/clock.service";
import { RaceService } from "../race/services/race.service";
import type { RunnerRowComponent } from "./runner-row.component";

@Transient({ deps: [RaceService, ClockService] })
export class RunnerRowLifecycle extends PickLifecycleManager<RunnerRowComponent> {
  constructor(
    private readonly raceService: RaceService,
    private readonly clockService: ClockService,
  ) {
    super();
  }

  protected onComponentReady(component: RunnerRowComponent): void {
    let stopClock: (() => void) | null = null;

    const syncElapsed = () => {
      const elapsedLabel = this.getElapsedLabel(
        component.row,
        this.clockService.getNow(),
      );

      if (component.elapsedLabel !== elapsedLabel) {
        component.elapsedLabel = elapsedLabel;
      }
    };

    const stopClockSubscription = () => {
      stopClock?.();
      stopClock = null;
    };

    const syncClockSubscription = () => {
      if (component.row.status === "running" && !stopClock) {
        stopClock = this.clockService.subscribe(syncElapsed);
      }

      if (component.row.status !== "running") {
        stopClockSubscription();
      }

      syncElapsed();
    };

    const syncRow = () => {
      component.syncManualTimeStateForRow();
      syncClockSubscription();
    };

    this.addSubscription(component.getPropertyObservable("row").subscribe(syncRow));
    this.addSubscription(stopClockSubscription);
    syncRow();

    this.addSubscription(
      component.startRequested$.subscribe(() => {
        this.run(component, () => this.raceService.startRunner(component.row.id), "Salida registrada.");
      }),
    );

    this.addSubscription(
      component.finishRequested$.subscribe(() => {
        this.run(component, () => this.raceService.finishRunner(component.row.id), "Llegada registrada.");
      }),
    );

    this.addSubscription(
      component.deleteRequested$.subscribe(() => {
        this.run(
          component,
          () => this.raceService.removeRunner(component.row.id),
          "Corredor eliminado.",
        );
      }),
    );

    this.addSubscription(
      component.manualTimeRequested$.subscribe((manualTimeInput) => {
        const didUpdate = this.run(
          component,
          () =>
            this.raceService.editRunnerResultFromText(
              component.row.id,
              manualTimeInput,
            ),
          "Tiempo actualizado.",
        );
        if (didUpdate) {
          component.closeManualTimeEdit();
        }
      }),
    );
  }

  private run(
    component: RunnerRowComponent,
    action: () => void,
    successMessage: string,
  ): boolean {
    try {
      action();
      component.feedback = successMessage;
      return true;
    } catch (error) {
      component.feedback =
        error instanceof Error ? error.message : "No se pudo aplicar la accion.";
      return false;
    }
  }

  private getElapsedLabel(row: RunnerRowView, now: number): string {
    if (row.status === "finished") {
      return formatDuration(row.resultMs);
    }

    if (row.status !== "running" || row.startAt === undefined) {
      return formatDuration(undefined);
    }

    return formatDuration(Math.max(0, now - row.startAt));
  }
}
