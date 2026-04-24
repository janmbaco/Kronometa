import { Transient } from "@janmbaco/injectkit";
import { PickLifecycleManager } from "pick-components";

import {
  getHistoryEntryViews,
  getRaceControlView,
  getResultRowViews,
  getRunnerRowViews,
} from "../race/domain/race.selectors";
import { ClockService } from "../race/services/clock.service";
import { ExportService } from "../race/services/export.service";
import { RaceService } from "../race/services/race.service";
import type { ResultsViewComponent } from "./results-view.component";

@Transient({ deps: [RaceService, ClockService, ExportService] })
export class ResultsViewLifecycle extends PickLifecycleManager<ResultsViewComponent> {
  constructor(
    private readonly raceService: RaceService,
    private readonly clockService: ClockService,
    private readonly exportService: ExportService,
  ) {
    super();
  }

  protected onComponentReady(component: ResultsViewComponent): void {
    this.addSubscription(
      this.raceService.subscribe((state) => {
        const now = this.clockService.getNow();
        component.control = getRaceControlView(state, now);
        component.results = getResultRowViews(state);
        component.history = getHistoryEntryViews(state);
        component.historyCountLabel =
          state.history.length === 1
            ? "1 carrera"
            : `${state.history.length} carreras`;
        component.runners = getRunnerRowViews(state, now);
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
      component.repeatRequested$.subscribe(() => {
        this.run(
          component,
          () => this.raceService.repeatRaceConfiguration(),
          "Carrera preparada con los mismos corredores.",
        );
      }),
    );

    this.addSubscription(
      component.resetRequested$.subscribe(() => {
        this.run(
          component,
          () => this.raceService.resetSession(),
          "Configuracion reiniciada. El historico se conserva.",
        );
      }),
    );

    this.addSubscription(
      component.clearLocalDataRequested$.subscribe(() => {
        this.run(
          component,
          () => this.raceService.clearLocalData(),
          "Datos locales borrados.",
        );
      }),
    );
  }

  private run(
    component: ResultsViewComponent,
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
