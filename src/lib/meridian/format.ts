import type { Confidence, MeetingVisibility, MotionMode, SourceKind } from "./types";

const utcStamp = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

const utcDay = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const utcTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

export function formatUtc(ms: number): string {
  return `${utcStamp.format(ms)} UTC`;
}

export function formatDay(ms: number): string {
  return utcDay.format(ms);
}

export function formatTime(ms: number): string {
  return `${utcTime.format(ms)}Z`;
}

export function formatCoords(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns}  ${Math.abs(lng).toFixed(2)}°${ew}`;
}

export function sourceLabel(s: SourceKind): string {
  switch (s) {
    case "schedule":
      return "Official";
    case "adsb":
      return "ADS-B";
    case "ais":
      return "Modeled";
    case "osint":
      return "OSINT";
  }
}

export function confidenceLabel(c: Confidence): string {
  switch (c) {
    case "official":
      return "Official";
    case "reported":
      return "Reported";
    case "modeled":
      return "Modeled";
  }
}

export function modeLabel(m: MotionMode): string {
  switch (m) {
    case "airborne":
      return "Airborne";
    case "at-sea":
      return "At sea";
    case "ground":
      return "In transit";
    case "stationary":
      return "On station";
  }
}

export function visibilityLabel(v: MeetingVisibility): string {
  switch (v) {
    case "public":
      return "Public";
    case "closed":
      return "Closed";
    case "unscheduled":
      return "Unscheduled";
  }
}

export function clampClock(ms: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, ms));
}

/** Parse ISO timestamp to ms; null if missing/invalid. Never fabricate. */
export function parseIsoMs(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/** `{n}m` or `{h}h {m}m` for non-negative whole minutes. */
export function formatDurationMinutes(totalMinutes: number): string {
  const n = Math.max(0, Math.floor(totalMinutes));
  if (n < 60) return `${n}m`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return `${h}h ${m}m`;
}

/**
 * Elapsed whole minutes since departure vs clock.
 * Hidden (null) when depart missing/invalid or clock has not reached depart.
 */
export function tripElapsedMinutes(clockMs: number, departIso: string | undefined | null): number | null {
  const departMs = parseIsoMs(departIso);
  if (departMs === null || clockMs < departMs) return null;
  return Math.max(0, Math.floor((clockMs - departMs) / 60_000));
}

/**
 * Remaining whole minutes until arrival vs clock.
 * Hidden (null) when arrive missing/invalid or clock past arrival.
 */
export function tripRemainingMinutes(clockMs: number, arriveIso: string | undefined | null): number | null {
  const arriveMs = parseIsoMs(arriveIso);
  if (arriveMs === null || clockMs > arriveMs) return null;
  return Math.max(0, Math.floor((arriveMs - clockMs) / 60_000));
}
