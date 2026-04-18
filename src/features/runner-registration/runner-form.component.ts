import {
  Listen,
  Reactive,
  Services,
  PickComponent,
  PickRender,
} from "pick-components";

import { RunnerFormLifecycle } from "./runner-form.lifecycle";
import styles from "./runner-form.styles.css?raw";
import template from "./runner-form.template.html?raw";

export interface AddRunnerIntent {
  bib: string;
  label: string;
}

@PickRender({
  selector: "runner-form",
  lifecycle: () => Services.get(RunnerFormLifecycle),
  template,
  styles,
})
export class RunnerFormComponent extends PickComponent {
  @Reactive message = "";
  readonly addRunnerRequested$ = this.createIntent<AddRunnerIntent>();
  private submittedForm: HTMLFormElement | null = null;

  @Listen("#runnerForm", "submit")
  onSubmit(event: Event): void {
    event.preventDefault();
    const form = this.findSubmittedForm(event);
    if (!form) {
      return;
    }

    const bib = form.querySelector<HTMLInputElement>("#bibInput")?.value ?? "";
    const label =
      form.querySelector<HTMLInputElement>("#labelInput")?.value ?? "";

    this.submittedForm = form;
    this.addRunnerRequested$.notify({ bib, label });
  }

  clearForm(): void {
    this.submittedForm?.reset();
    this.submittedForm?.querySelector<HTMLInputElement>("#bibInput")?.focus();
  }

  private findSubmittedForm(event: Event): HTMLFormElement | null {
    const target = event.target as Element | null;
    return target?.closest<HTMLFormElement>("#runnerForm") ?? null;
  }
}
