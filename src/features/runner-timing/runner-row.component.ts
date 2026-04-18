import {
  Listen,
  Reactive,
  Services,
  PickComponent,
  PickRender,
} from "pick-components";

import type { RunnerRowView } from "../race/domain/race.types";
import { parseDurationInput } from "../race/domain/time-format";
import { RunnerRowLifecycle } from "./runner-row.lifecycle";
import styles from "./runner-row.styles.css?raw";
import template from "./runner-row.template.html?raw";

const EMPTY_ROW: RunnerRowView = {
  id: "",
  bib: "-",
  label: "-",
  status: "pending",
  startAt: undefined,
  resultMs: undefined,
  statusLabel: "Pendiente",
  elapsedLabel: "--:--.---",
  referenceLabel: "-",
  canStart: false,
  canFinish: false,
  canDelete: false,
  isFinished: false,
  isNextToStart: false,
  resultInputValue: "--:--.---",
  rowClass: "runner-row pending",
};

@PickRender({
  selector: "runner-row",
  lifecycle: () => Services.get(RunnerRowLifecycle),
  template,
  styles,
})
export class RunnerRowComponent extends PickComponent {
  @Reactive row: RunnerRowView = EMPTY_ROW;
  @Reactive elapsedLabel = EMPTY_ROW.elapsedLabel;
  @Reactive manualTimeDraft = EMPTY_ROW.resultInputValue;
  @Reactive manualTimeCanSave = false;
  @Reactive manualTimeHelp = "";
  @Reactive manualTimeInputInvalid = false;
  @Reactive isManualTimeEditing = false;
  @Reactive showActionBar = false;
  @Reactive showManualTimeEditAction = false;
  @Reactive showManualTimeForm = false;
  @Reactive feedback = "";
  readonly startRequested$ = this.createIntent();
  readonly finishRequested$ = this.createIntent();
  readonly deleteRequested$ = this.createIntent();
  readonly manualTimeRequested$ = this.createIntent<string>();

  private currentRowId = EMPTY_ROW.id;

  requestStart(): void {
    this.startRequested$.notify();
  }

  requestFinish(): void {
    this.finishRequested$.notify();
  }

  requestDelete(): void {
    this.deleteRequested$.notify();
  }

  startManualTimeEdit(): void {
    if (!this.row.isFinished) {
      return;
    }

    this.feedback = "";
    this.isManualTimeEditing = true;
    this.manualTimeDraft = this.row.resultInputValue;
    this.updateManualTimeState();
  }

  cancelManualTimeEdit(): void {
    this.closeManualTimeEdit();
  }

  closeManualTimeEdit(): void {
    this.isManualTimeEditing = false;
    this.manualTimeDraft = this.row.resultInputValue;
    this.manualTimeCanSave = false;
    this.manualTimeInputInvalid = false;
    this.manualTimeHelp = "";
    this.syncActionVisibility();
  }

  syncManualTimeStateForRow(): void {
    if (this.row.id !== this.currentRowId) {
      this.currentRowId = this.row.id;
      this.closeManualTimeEdit();
      return;
    }

    if (!this.row.isFinished) {
      this.closeManualTimeEdit();
      return;
    }

    if (!this.isManualTimeEditing) {
      this.manualTimeDraft = this.row.resultInputValue;
    }

    this.updateManualTimeState();
  }

  @Listen("#manualTimeEdit", "click")
  onManualTimeEditClick(): void {
    this.startManualTimeEdit();
  }

  @Listen("#manualTimeForm", "submit")
  onManualTimeSubmit(event: Event): void {
    event.preventDefault();
    const form = this.findManualTimeForm(event);
    if (!form) {
      return;
    }

    this.requestManualTimeFromForm(form);
  }

  @Listen("#manualTimeInput", "input")
  onManualTimeInput(event: Event): void {
    const target = event.target as Element | null;
    const input = target?.closest<HTMLInputElement>("#manualTimeInput");
    if (!input) {
      return;
    }

    this.manualTimeDraft = input.value;
    this.updateManualTimeState();
  }

  @Listen("#manualTimeSave", "click")
  onManualTimeClick(event: Event): void {
    const target = event.target as Element | null;
    const button = target?.closest<HTMLButtonElement>("#manualTimeSave");
    const form = button?.closest<HTMLFormElement>("#manualTimeForm") ?? null;
    if (!form) {
      return;
    }

    this.requestManualTimeFromForm(form);
  }

  @Listen("#manualTimeCancel", "click")
  onManualTimeCancelClick(): void {
    this.cancelManualTimeEdit();
  }

  private requestManualTimeFromForm(form: HTMLFormElement): void {
    this.manualTimeDraft =
      form.querySelector<HTMLInputElement>("#manualTimeInput")?.value ?? "";
    this.updateManualTimeState();

    if (!this.manualTimeCanSave) {
      return;
    }

    this.manualTimeRequested$.notify(this.manualTimeDraft);
  }

  private findManualTimeForm(event: Event): HTMLFormElement | null {
    const target = event.target as Element | null;
    return target?.closest<HTMLFormElement>("#manualTimeForm") ?? null;
  }

  private updateManualTimeState(): void {
    const trimmed = this.manualTimeDraft.trim();
    const parsed = parseDurationInput(trimmed);
    const currentMs = this.row.resultMs;
    const hasChanged = parsed !== null && parsed !== currentMs;

    this.manualTimeInputInvalid = trimmed.length > 0 && parsed === null;
    this.manualTimeCanSave =
      this.row.isFinished &&
      this.isManualTimeEditing &&
      parsed !== null &&
      hasChanged;

    if (!this.isManualTimeEditing) {
      this.manualTimeHelp = "";
    } else if (trimmed.length === 0) {
      this.manualTimeHelp = "Introduce un tiempo para guardar cambios.";
    } else if (parsed === null) {
      this.manualTimeHelp =
        "Usa 12:34.567, 1:02:03.000 o segundos.";
    } else if (!hasChanged) {
      this.manualTimeHelp = "Cambia el tiempo para habilitar el guardado.";
    } else {
      this.manualTimeHelp = "Listo para guardar.";
    }

    this.syncActionVisibility();
  }

  private syncActionVisibility(): void {
    this.showManualTimeForm = this.row.isFinished && this.isManualTimeEditing;
    this.showManualTimeEditAction =
      this.row.isFinished && !this.isManualTimeEditing;
    this.showActionBar =
      this.row.canStart ||
      this.row.canFinish ||
      this.row.canDelete ||
      this.showManualTimeEditAction;
  }
}
