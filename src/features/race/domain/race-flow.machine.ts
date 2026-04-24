import type { RacePhase } from "./race.types";

export type RaceFlowEvent =
  | "select_mode"
  | "mode_confirmed"
  | "runners_changed"
  | "runners_confirmed"
  | "back_to_mode"
  | "back_to_runners"
  | "mass_started"
  | "runner_started"
  | "race_finished"
  | "race_repeated"
  | "session_reset";

const TRANSITIONS: Record<RacePhase, Partial<Record<RaceFlowEvent, RacePhase>>> = {
  select_mode: {
    select_mode: "select_mode",
    mode_confirmed: "register_runners",
    session_reset: "select_mode",
  },
  register_runners: {
    select_mode: "register_runners",
    runners_changed: "register_runners",
    runners_confirmed: "ready_to_start",
    back_to_mode: "select_mode",
    session_reset: "select_mode",
  },
  ready_to_start: {
    runners_changed: "register_runners",
    back_to_mode: "select_mode",
    back_to_runners: "register_runners",
    mass_started: "running_mass",
    runner_started: "running_staggered",
    session_reset: "select_mode",
  },
  running_mass: {
    race_finished: "finished",
    session_reset: "select_mode",
  },
  running_staggered: {
    runner_started: "running_staggered",
    race_finished: "finished",
    session_reset: "select_mode",
  },
  finished: {
    race_repeated: "ready_to_start",
    session_reset: "select_mode",
  },
};

export function transitionRacePhase(
  phase: RacePhase,
  event: RaceFlowEvent,
): RacePhase {
  return TRANSITIONS[phase][event] ?? phase;
}

export function getRouteForPhase(phase: RacePhase): string {
  if (phase === "select_mode") {
    return "/setup/mode";
  }

  if (phase === "register_runners") {
    return "/setup/runners";
  }

  if (phase === "finished") {
    return "/results";
  }

  return "/race";
}

export function getPhaseForRoute(path: string): RacePhase | null {
  if (path === "/" || path === "/setup/mode") {
    return "select_mode";
  }

  if (path === "/setup/runners") {
    return "register_runners";
  }

  if (path === "/race") {
    return "ready_to_start";
  }

  if (path === "/results") {
    return "finished";
  }

  return null;
}
