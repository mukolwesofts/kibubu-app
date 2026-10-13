// All app dates are YYYY-MM-DD strings in Africa/Nairobi time (UTC+3, no DST).

const TZ = "Africa/Nairobi";

export function todayNairobi(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (to - from). */
export function daysBetween(from: string, to: string): number {
  const ms =
    new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export function monthLabel(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
