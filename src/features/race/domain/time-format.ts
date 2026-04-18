const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_SECOND = 1000;

function pad(value: number, size: number): string {
  return String(value).padStart(size, "0");
}

export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms)) {
    return "--:--.---";
  }

  const safeMs = Math.max(0, Math.round(ms));
  const hours = Math.floor(safeMs / MS_PER_HOUR);
  const minutes = Math.floor((safeMs % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((safeMs % MS_PER_MINUTE) / MS_PER_SECOND);
  const milliseconds = safeMs % MS_PER_SECOND;

  if (hours > 0) {
    return `${hours}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(milliseconds, 3)}`;
  }

  return `${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(milliseconds, 3)}`;
}

export function formatGap(ms: number): string {
  if (ms <= 0) {
    return "lider";
  }

  return `+${formatDuration(ms)}`;
}

export function parseDurationInput(input: string): number | null {
  const trimmed = input.trim().replace(",", ".");
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(":");
  if (parts.length > 3) {
    return null;
  }

  const numericParts = parts.map((part) => Number(part));
  if (numericParts.some((part) => !Number.isFinite(part) || part < 0)) {
    return null;
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (numericParts.length === 3) {
    [hours, minutes, seconds] = numericParts;
  } else if (numericParts.length === 2) {
    [minutes, seconds] = numericParts;
  } else {
    [seconds] = numericParts;
  }

  if (minutes >= 60 || seconds >= 60) {
    return null;
  }

  return Math.round(
    hours * MS_PER_HOUR + minutes * MS_PER_MINUTE + seconds * MS_PER_SECOND,
  );
}
