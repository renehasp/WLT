import { create } from "zustand";
import type { MeetingVisibility, Region, SkySnapshot } from "./types";
import { RANGE_END, RANGE_START } from "./types";
import { clampClock } from "./format";
import { meetingById } from "./meetings";

export type RailTab = "roster" | "board" | "fleet";
export type WireFilter = "all" | MeetingVisibility;

export type Layers = {
  leaders: boolean;
  aircraft: boolean;
  vessels: boolean;
  tracks: boolean;
  events: boolean;
  graticule: boolean;
};

type Focus = { lat: number; lng: number; zoom?: number } | null;

type State = {
  clock: number;
  followLive: boolean;
  playing: boolean;
  speed: number;
  selectedId: string | null;
  query: string;
  region: Region | "all";
  layers: Layers;
  railTab: RailTab;
  sky: SkySnapshot | null;
  aboutOpen: boolean;
  notesOpen: boolean;
  mobileRail: boolean;
  wireOpen: boolean;
  wireFilter: WireFilter;
  focusAt: Focus;
  selectedEventId: string | null;
  setClock: (n: number, opts?: { follow?: boolean }) => void;
  togglePlay: () => void;
  setSpeed: (n: number) => void;
  select: (id: string | null) => void;
  setQuery: (q: string) => void;
  setRegion: (r: Region | "all") => void;
  setLayer: (k: keyof Layers, v: boolean) => void;
  setRailTab: (t: RailTab) => void;
  setSky: (s: SkySnapshot | null) => void;
  setAboutOpen: (v: boolean) => void;
  setNotesOpen: (v: boolean) => void;
  setMobileRail: (v: boolean) => void;
  setWireOpen: (v: boolean) => void;
  setWireFilter: (v: WireFilter) => void;
  setFocusAt: (v: Focus) => void;
  openMeeting: (place: { lat: number; lng: number }, leaderId?: string | null) => void;
  openEvent: (id: string | null) => void;
  selectLeader: (id: string | null, opts?: { keepEvent?: boolean }) => void;
  clearSelection: () => void;
  goLive: () => void;
  tick: (dtMs: number) => void;
};

const SSR_CLOCK = Date.parse("2026-09-20T08:00:00Z");

function boundedNow(): number {
  return clampClock(Date.now(), RANGE_START, RANGE_END);
}

export const useMeridian = create<State>()((set, get) => ({
  clock: SSR_CLOCK,
  followLive: false,
  playing: false,
  speed: 3 * 3600 * 1000,
  selectedId: null,
  query: "",
  region: "all",
  layers: {
    leaders: true,
    aircraft: true,
    vessels: true,
    tracks: true,
    events: true,
    graticule: true,
  },
  railTab: "roster",
  sky: null,
  aboutOpen: false,
  notesOpen: false,
  mobileRail: false,
  wireOpen: false,
  wireFilter: "all",
  focusAt: null,
  selectedEventId: null,
  setClock: (n, opts) =>
    set({
      clock: clampClock(n, RANGE_START, RANGE_END),
      followLive: opts?.follow ?? false,
      playing: false,
    }),
  togglePlay: () =>
    set((s) => ({
      playing: !s.playing,
      followLive: false,
    })),
  setSpeed: (n) => set({ speed: n }),
  select: (id) =>
    set({
      selectedId: id,
      selectedEventId: null,
      focusAt: null,
      mobileRail: id ? false : get().mobileRail,
    }),
  selectLeader: (id, opts) =>
    set({
      selectedId: id,
      selectedEventId: opts?.keepEvent ? get().selectedEventId : null,
      focusAt: null,
      mobileRail: id ? false : get().mobileRail,
    }),
  setQuery: (q) => set({ query: q }),
  setRegion: (r) => set({ region: r }),
  setLayer: (k, v) => set((s) => ({ layers: { ...s.layers, [k]: v } })),
  setRailTab: (t) => set({ railTab: t }),
  setSky: (sky) => set({ sky }),
  setAboutOpen: (aboutOpen) => set({ aboutOpen, notesOpen: aboutOpen ? false : get().notesOpen }),
  setNotesOpen: (notesOpen) => set({ notesOpen, aboutOpen: notesOpen ? false : get().aboutOpen }),
  setMobileRail: (mobileRail) => set({ mobileRail }),
  setWireOpen: (wireOpen) => set({ wireOpen }),
  setWireFilter: (wireFilter) => set({ wireFilter }),
  setFocusAt: (focusAt) => set({ focusAt }),
  openMeeting: (place, leaderId) =>
    set({
      focusAt: { lat: place.lat, lng: place.lng, zoom: 5 },
      selectedId: leaderId ?? get().selectedId,
      wireOpen: true,
      mobileRail: false,
    }),
  openEvent: (id) => {
    if (!id) {
      set({ selectedEventId: null });
      return;
    }
    const ev = meetingById(id);
    set({
      selectedEventId: id,
      wireOpen: true,
      mobileRail: false,
      focusAt: ev
        ? { lat: ev.place.lat, lng: ev.place.lng, zoom: 6 }
        : get().focusAt,
    });
  },
  clearSelection: () =>
    set({
      selectedId: null,
      selectedEventId: null,
      focusAt: null,
    }),
  goLive: () =>
    set({
      clock: boundedNow(),
      followLive: true,
      playing: false,
    }),
  tick: (dtMs) => {
    const s = get();
    if (s.followLive) {
      set({ clock: boundedNow() });
      return;
    }
    if (!s.playing) return;
    const next = s.clock + s.speed * (dtMs / 1000);
    if (next >= RANGE_END) {
      set({ clock: RANGE_END, playing: false });
      return;
    }
    set({ clock: next });
  },
}));
