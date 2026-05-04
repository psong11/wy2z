// Time helpers. captured_at is stored UTC in Supabase. The dashboard renders
// absolute timestamps in Arkansas local time (America/Chicago, handles DST).

const TZ = "America/Chicago";

const ABSOLUTE_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const DATE_ONLY_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  month: "short",
  day: "numeric",
});

const TIME_ONLY_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
});

export function formatAbsolute(iso: string): string {
  return ABSOLUTE_FMT.format(new Date(iso));
}

export function formatDateOnly(iso: string): string {
  return DATE_ONLY_FMT.format(new Date(iso));
}

export function formatTimeOnly(iso: string): string {
  return TIME_ONLY_FMT.format(new Date(iso));
}

export function hoursSince(iso: string, now: Date = new Date()): number {
  return (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

/** Coarse "5h ago" / "yesterday" / "3d ago" for the hero chrome. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const hours = hoursSince(iso, now);
  if (hours < 1) {
    const m = Math.max(1, Math.round(hours * 60));
    return `${m}m ago`;
  }
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}
