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
      return "AIS";
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
