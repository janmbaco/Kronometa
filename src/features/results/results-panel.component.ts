import { Pick } from "pick-components";

import type { ResultRowView } from "../race/domain/race.types";
import styles from "./results-panel.styles.css?raw";
import template from "./results-panel.template.html?raw";

interface ResultsPanelState {
  results: ResultRowView[];
}

@Pick<ResultsPanelState>("results-panel", (ctx) => {
  ctx.state({
    results: [],
  });
  ctx.html(template);
  ctx.css(styles);
})
export class ResultsPanelComponent {}
