import { Transient } from "@janmbaco/injectkit";
import { PickLifecycleManager } from "pick-components";

import { formatDuration } from "../race/domain/time-format";
import { ClockService } from "../race/services/clock.service";
import { ExportService } from "../race/services/export.service";
import { RaceService } from "../race/services/race.service";
import type { RaceControlsComponent } from "./race-controls.component";

@Transient({ deps: [RaceService, ExportService, ClockService] })
export class RaceControlsLifecycle extends PickLifecycleManager<RaceControlsComponent> {
  constructor(
    private readonly raceService: RaceService,
    private readonly exportService: ExportService,
    private readonly clockService: ClockService,
  ) {
    super();
  }

  protected onComponentReady(component: RaceControlsComponent): void {
    const syncClock = () => {
      const raceClockLabel = this.getRaceClockLabel();
      if (component.raceClockLabel !== raceClockLabel) {
        component.raceClockLabel = raceClockLabel;
      }
    };

    this.addSubscription(
      component.getPropertyObservable("control").subscribe(syncClock),
    );
    this.addSubscription(this.clockService.subscribe(syncClock));
    syncClock();

    this.addSubscription(
      component.startMassRequested$.subscribe(() => {
        this.run(component, () => this.raceService.startMassRace(), "Salida iniciada.");
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
      component.exportRequested$.subscribe(() => {
        try {
          const csv = this.exportService.toHistoryCsv(
            this.raceService.getSnapshot(),
          );
          this.exportService.downloadCsv("kronometa-historico.csv", csv);
          component.feedback = "CSV historico exportado.";
        } catch (error) {
          component.feedback =
            error instanceof Error ? error.message : "No se pudo exportar.";
        }
      }),
    );

    this.addSubscription(
      component.resetRequested$.subscribe(() => {
        this.run(
          component,
          () => this.raceService.resetSession(),
          "Sesion reiniciada.",
        );
      }),
    );
  }

  private run(
    component: RaceControlsComponent,
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

  private getRaceClockLabel(): string {
    const state = this.raceService.getSnapshot();

    if (state.config.mode !== "mass_start" || state.session.raceStartAt === undefined) {
      return formatDuration(undefined);
    }

    return formatDuration(this.clockService.getNow() - state.session.raceStartAt);
  }
}
