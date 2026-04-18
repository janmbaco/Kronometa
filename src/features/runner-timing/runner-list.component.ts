import { Pick } from "pick-components";

import type { RunnerRowView } from "../race/domain/race.types";
import styles from "./runner-list.styles.css?raw";
import template from "./runner-list.template.html?raw";

interface RunnerListState {
  runners: RunnerRowView[];
}

@Pick<RunnerListState>("runner-list", (ctx) => {
  ctx.state({
    runners: [],
  });
  ctx.html(template);
  ctx.css(styles);
})
export class RunnerListComponent {}
