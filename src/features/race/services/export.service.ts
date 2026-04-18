import { Singleton } from "@janmbaco/injectkit";

import { getFinishedRunnersFromSession } from "../domain/race.selectors";
import type { RaceState } from "../domain/race.types";
import { formatDuration, formatGap } from "../domain/time-format";

@Singleton()
export class ExportService {
  toCsv(state: RaceState): string {
    return this.toHistoryCsv(state);
  }

  toHistoryCsv(state: RaceState): string {
    const rows = [...state.history]
      .sort((a, b) => a.completedAt - b.completedAt)
      .flatMap((entry) => {
        const finished = getFinishedRunnersFromSession(entry.session);
        const leader = finished[0];
        const leaderMs = leader?.resultMs ?? 0;
        const timestamp = new Date(entry.completedAt).toISOString();

        return finished.map((runner, index) => {
          const resultMs = runner.resultMs ?? 0;
          const gapMs = resultMs - leaderMs;
          const isLeader = index === 0;

          return [
            entry.id,
            timestamp,
            entry.mode,
            String(entry.runnerCount),
            leader?.bib ?? "",
            leader?.label ?? "",
            String(index + 1),
            runner.bib,
            runner.label,
            String(resultMs),
            formatDuration(resultMs),
            String(gapMs),
            formatGap(gapMs),
            runner.status,
            isLeader ? "true" : "false",
          ];
        });
      });

    return [
      [
        "race_id",
        "timestamp",
        "mode",
        "total_runners",
        "winner_bib",
        "winner_label",
        "position",
        "bib",
        "label",
        "result_ms",
        "formatted_time",
        "gap_ms",
        "formatted_gap",
        "final_status",
        "is_leader",
      ],
      ...rows,
    ]
      .map((row) => row.map((cell) => this.escapeCell(cell)).join(","))
      .join("\n");
  }

  downloadCsv(filename: string, csv: string): void {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private escapeCell(value: string): string {
    if (!/[",\n]/.test(value)) {
      return value;
    }

    return `"${value.replace(/"/g, '""')}"`;
  }
}
