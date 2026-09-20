import { RANGE_END, RANGE_START } from "./types";
import { clampClock } from "./format";
import { useMeridian } from "./store";

export type ShareSnapshot = {
  clock?: number;
  live: boolean;
  id?: string;
  eventId?: string;
};

export function parseShareSearch(search: string): ShareSnapshot {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const live = params.get("live") === "1" || params.get("live") === "true";
  const raw = params.get("t");
  let clock: number | undefined;
  if (raw) {
    const trimmed = raw.trim();
    const asNum = Number(trimmed);
    const numeric = Number.isFinite(asNum) && trimmed !== "" && !/[T-]/.test(trimmed);
    const parsed = numeric ? (asNum < 1e12 ? asNum * 1000 : asNum) : Date.parse(trimmed);
    if (Number.isFinite(parsed)) clock = clampClock(parsed, RANGE_START, RANGE_END);
  }
  const id = params.get("id") || undefined;
  const eventId = params.get("e") || undefined;
  return { clock, live, id, eventId };
}

export function buildShareSearch(snap: ShareSnapshot): string {
  const params = new URLSearchParams();
  if (snap.live) params.set("live", "1");
  else if (snap.clock != null) params.set("t", new Date(snap.clock).toISOString());
  if (snap.id) params.set("id", snap.id);
  if (snap.eventId) params.set("e", snap.eventId);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export function currentShareUrl(origin = typeof window === "undefined" ? "" : window.location.origin): string {
  const s = useMeridian.getState();
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  const search = buildShareSearch({
    clock: s.clock,
    live: s.followLive,
    id: s.selectedId ?? undefined,
    eventId: s.selectedEventId ?? undefined,
  });
  return `${origin}${path}${search}`;
}

export function applyShareSearch(search: string): boolean {
  const snap = parseShareSearch(search);
  const store = useMeridian.getState();
  if (snap.live || snap.clock == null) store.goLive();
  else store.setClock(snap.clock);
  if (snap.id) store.select(snap.id);
  if (snap.eventId) store.openEvent(snap.eventId);
  return snap.clock != null || snap.live || Boolean(snap.id) || Boolean(snap.eventId);
}
