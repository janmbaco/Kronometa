import { Pick } from "pick-components";

import type { RaceHistoryEntryView } from "../race/domain/race.types";
import styles from "./history-entry.styles.css?raw";
import template from "./history-entry.template.html?raw";

const EMPTY_HISTORY_ENTRY: RaceHistoryEntryView = {
  id: "",
  completedAtLabel: "",
  modeLabel: "",
  runnerCountLabel: "0 corredores",
  winnerLabel: "Sin resultados",
  bestTimeLabel: "--:--.---",
  results: [],
};

interface HistoryEntryState {
  entry: RaceHistoryEntryView;
}

@Pick<HistoryEntryState>("history-entry", (ctx) => {
  ctx.state({
    entry: EMPTY_HISTORY_ENTRY,
  });
  ctx.html(template);
  ctx.css(styles);
})
export class HistoryEntryComponent {}
