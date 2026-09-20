import type { Feature, FeatureCollection } from "geojson";
import { AIRCRAFT, LEADERS, VESSELS } from "./data";
import { interpolateGreatCircle, bearing, sampleArc, splitAntimeridian } from "./geo";
import { P } from "./places";
import type {
  BoardRow,
  Confidence,
  FeedItem,
  FleetStatus,
  Leader,
  LeaderFix,
  LocalEvent,
  MotionMode,
  Place,
  PlaceKind,
  SkySnapshot,
  SourceKind,
  Trip,
  VesselFix,
  Waypoint,
} from "./types";
import { RANGE_END, RANGE_START } from "./types";
import { formatTime } from "./format";

function parse(iso: string): number {
  return Date.parse(iso);
}

function wp(
  t: number,
  place: Place,
  kind: PlaceKind,
  source: SourceKind,
  confidence: Confidence,
  extra?: Partial<Waypoint>,
): Waypoint {
  return {
    t,
    lat: place.lat,
    lng: place.lng,
    kind,
    label: extra?.label ?? place.name,
    city: place.city,
    source,
    confidence,
    ...extra,
  };
}

function tripWaypoints(leader: Leader, trip: Trip): Waypoint[] {
  const out: Waypoint[] = [];
  const dep = parse(trip.depart.t);
  const arr = parse(trip.arrive.t);
  const pre = Math.max(RANGE_START, dep - 50 * 60 * 1000);
  const airKind: PlaceKind = trip.kind === "vessel" ? "vessel" : "aircraft";
  out.push(
    wp(pre, trip.depart.place, trip.kind === "vessel" ? "vessel" : "transit", trip.source, trip.confidence, {
      tripId: trip.id,
      venue: trip.venue,
      label: trip.depart.place.name,
    }),
  );
  out.push(
    wp(dep, trip.depart.place, airKind, trip.source, trip.confidence, {
      tripId: trip.id,
      venue: trip.venue,
      label: `${trip.depart.place.city} wheels-up`,
    }),
  );
  out.push(
    wp(arr, trip.arrive.place, airKind, trip.source, trip.confidence, {
      tripId: trip.id,
      venue: trip.venue,
      label: trip.title,
    }),
  );
  if (trip.stayUntil) {
    const stay = parse(trip.stayUntil);
    out.push(
      wp(stay, trip.arrive.place, trip.kind, trip.source, trip.confidence, {
        tripId: trip.id,
        venue: trip.venue,
        label: trip.venue ?? trip.arrive.place.name,
      }),
    );
  }
  if (trip.returnDepart && trip.returnArrive) {
    const rdep = parse(trip.returnDepart);
    const rarr = parse(trip.returnArrive);
    const home = trip.returnTo ?? leader.residence;
    out.push(
      wp(rdep, trip.arrive.place, "transit", trip.source, trip.confidence, {
        tripId: trip.id,
        label: `Return — ${trip.arrive.place.name}`,
      }),
    );
    out.push(
      wp(rarr, home, "aircraft", trip.source, trip.confidence, {
        tripId: trip.id,
        label: `Return — ${home.name}`,
      }),
    );
  }
  return out;
}

export function leaderTrack(leader: Leader): Waypoint[] {
  const points: Waypoint[] = [
    wp(RANGE_START, leader.residence, "residence", "schedule", "official", {
      label: leader.residence.name,
    }),
  ];
  const extras: Waypoint[] = [];
  for (const ev of leader.localEvents) {
    extras.push(
      wp(parse(ev.t), ev.place, ev.kind, ev.source, ev.confidence, {
        label: ev.title,
        venue: ev.venue,
      }),
    );
    if (ev.tEnd) {
      extras.push(
        wp(parse(ev.tEnd), ev.place, ev.kind, ev.source, ev.confidence, {
          label: ev.title,
          venue: ev.venue,
        }),
      );
    }
  }
  for (const trip of leader.trips) {
    extras.push(...tripWaypoints(leader, trip));
  }
  extras.sort((a, b) => a.t - b.t);
  points.push(...extras);
  points.push(
    wp(RANGE_END, leader.residence, "residence", "schedule", "official", {
      label: leader.residence.name,
    }),
  );
  points.sort((a, b) => a.t - b.t);
  return points;
}

const TRACKS = new Map<string, Waypoint[]>(LEADERS.map((l) => [l.id, leaderTrack(l)]));

export function getTrack(leaderId: string): Waypoint[] {
  return TRACKS.get(leaderId) ?? [];
}

function segmentMode(from: Waypoint, to: Waypoint): MotionMode {
  const dt = to.t - from.t;
  const dist = Math.hypot(to.lat - from.lat, to.lng - from.lng);
  if (from.kind === "vessel" || to.kind === "vessel") {
    return dist > 0.35 && dt < 72 * 3600 * 1000 ? "at-sea" : dist > 0.35 ? "at-sea" : "stationary";
  }
  if (dist > 5 && dt > 20 * 60 * 1000 && dt < 36 * 3600 * 1000) return "airborne";
  if (dist > 0.2 && dt > 5 * 60 * 1000 && dt < 8 * 3600 * 1000) return "ground";
  return "stationary";
}

export function fixAt(leader: Leader, t: number): LeaderFix {
  const track = getTrack(leader.id);
  if (track.length === 0) {
    return {
      leader,
      lat: leader.residence.lat,
      lng: leader.residence.lng,
      heading: 0,
      kind: "residence",
      label: leader.residence.name,
      city: leader.residence.city,
      mode: "stationary",
      source: "schedule",
      confidence: "official",
    };
  }
  const first = track[0];
  if (t <= first.t) {
    return {
      leader,
      lat: first.lat,
      lng: first.lng,
      heading: 0,
      kind: first.kind,
      label: first.label,
      city: first.city,
      mode: "stationary",
      source: first.source,
      confidence: first.confidence,
    };
  }
  const last = track[track.length - 1];
  if (t >= last.t) {
    return {
      leader,
      lat: last.lat,
      lng: last.lng,
      heading: 0,
      kind: last.kind,
      label: last.label,
      city: last.city,
      mode: "stationary",
      source: last.source,
      confidence: last.confidence,
    };
  }
  let i = 0;
  while (i < track.length - 1 && track[i + 1].t < t) i++;
  const a = track[i];
  const b = track[i + 1];
  const span = Math.max(1, b.t - a.t);
  const u = (t - a.t) / span;
  const mode = segmentMode(a, b);
  const pos =
    mode === "stationary" ? { lat: a.lat, lng: a.lng } : interpolateGreatCircle(a, b, u);
  const trip = leader.trips.find((tr) => tr.id === a.tripId || tr.id === b.tripId);
  const airborneCity = trip?.arrive.place.city ?? b.city;
  return {
    leader,
    lat: pos.lat,
    lng: pos.lng,
    heading: mode === "stationary" ? 0 : bearing(a, b),
    kind: u < 0.5 ? a.kind : b.kind,
    label:
      mode === "airborne"
        ? `En route ${airborneCity}`
        : u < 0.85
          ? a.label
          : b.label,
    city: mode === "airborne" ? airborneCity : u < 0.85 ? a.city : b.city,
    mode,
    source: a.source,
    confidence: a.confidence === "official" && mode === "airborne" ? "modeled" : a.confidence,
    trip,
    progress: u,
    from: mode === "stationary" ? undefined : { lat: a.lat, lng: a.lng },
    to: mode === "stationary" ? undefined : { lat: b.lat, lng: b.lng },
  };
}

function isLive(clock: number, now: number): boolean {
  return Math.abs(clock - now) < 3 * 60 * 1000;
}

export function applySky(fix: LeaderFix, sky: SkySnapshot | null, now: number, clock: number): LeaderFix {
  if (!sky || sky.status !== "live" || !isLive(clock, now)) return fix;
  const icao = fix.leader.aircraft?.icao24.toLowerCase();
  if (!icao) return fix;
  const hit = sky.contacts.find((c) => c.icao24 === icao && !c.onGround);
  if (!hit) return fix;
  return {
    ...fix,
    lat: hit.lat,
    lng: hit.lng,
    heading: hit.heading ?? fix.heading,
    mode: "airborne",
    kind: "aircraft",
    source: "adsb",
    confidence: "official",
    label: hit.callsign.trim() || fix.leader.aircraft?.callsign || fix.label,
  };
}

export function worldFixes(clock: number, sky: SkySnapshot | null, now = Date.now()): LeaderFix[] {
  return LEADERS.map((l) => applySky(fixAt(l, clock), sky, now, clock));
}

export function trackLine(leader: Leader): FeatureCollection {
  const track = getTrack(leader.id);
  const features: Feature[] = [];
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i];
    const b = track[i + 1];
    const mode = segmentMode(a, b);
    if (mode === "stationary") continue;
    const samples = sampleArc(a, b, mode === "airborne" ? 72 : 16);
    for (const part of splitAntimeridian(samples)) {
      features.push({
        type: "Feature",
        properties: {
          leaderId: leader.id,
          mode,
          tripId: a.tripId ?? b.tripId ?? "",
        },
        geometry: { type: "LineString", coordinates: part },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

export function allTrackCollection(): FeatureCollection {
  const features = LEADERS.flatMap((l) => trackLine(l).features);
  return { type: "FeatureCollection", features };
}

export function headingArcs(fix: LeaderFix): { behind: FeatureCollection; ahead: FeatureCollection } {
  const empty: FeatureCollection = { type: "FeatureCollection", features: [] };
  if (!fix.from || !fix.to) return { behind: empty, ahead: empty };
  if (fix.mode === "stationary") return { behind: empty, ahead: empty };
  const u = fix.progress ?? 0;
  const behindFeats: Feature[] = [];
  const aheadFeats: Feature[] = [];
  if (u > 0.02) {
    for (const part of splitAntimeridian(sampleArc(fix.from, fix, 36))) {
      behindFeats.push({
        type: "Feature",
        properties: { id: fix.leader.id, dir: "behind", selected: false },
        geometry: { type: "LineString", coordinates: part },
      });
    }
  }
  if (u < 0.98) {
    for (const part of splitAntimeridian(sampleArc(fix, fix.to, 36))) {
      aheadFeats.push({
        type: "Feature",
        properties: { id: fix.leader.id, dir: "ahead", selected: false },
        geometry: { type: "LineString", coordinates: part },
      });
    }
  }
  return {
    behind: { type: "FeatureCollection", features: behindFeats },
    ahead: { type: "FeatureCollection", features: aheadFeats },
  };
}

export function allHeadingArcs(
  fixes: LeaderFix[],
  selectedId: string | null,
): { behind: FeatureCollection; ahead: FeatureCollection } {
  const behind: Feature[] = [];
  const ahead: Feature[] = [];
  for (const fix of fixes) {
    if (fix.mode === "ground" && fix.leader.id !== selectedId) continue;
    const arcs = headingArcs(fix);
    const mark = (fc: FeatureCollection, selected: boolean) =>
      fc.features.map((f) => ({
        ...f,
        properties: { ...(f.properties ?? {}), selected, id: fix.leader.id },
      }));
    const sel = fix.leader.id === selectedId;
    behind.push(...mark(arcs.behind, sel));
    ahead.push(...mark(arcs.ahead, sel));
  }
  return {
    behind: { type: "FeatureCollection", features: behind },
    ahead: { type: "FeatureCollection", features: ahead },
  };
}

export function eventsAt(clock: number, windowMs = 36 * 3600 * 1000): LocalEvent[] {
  const out: LocalEvent[] = [];
  for (const l of LEADERS) {
    for (const ev of l.localEvents) {
      const t = parse(ev.t);
      if (Math.abs(t - clock) <= windowMs) out.push(ev);
    }
    for (const trip of l.trips) {
      const t = parse(trip.arrive.t);
      if (Math.abs(t - clock) <= windowMs) {
        out.push({
          id: trip.id,
          t: trip.arrive.t,
          title: trip.title,
          venue: trip.venue ?? trip.arrive.place.name,
          place: trip.arrive.place,
          kind: trip.kind,
          source: trip.source,
          confidence: trip.confidence,
        });
      }
    }
  }
  return out.sort((a, b) => parse(a.t) - parse(b.t));
}

const VESSEL_PATHS: Record<string, { t: number; place: Place }[]> = {
  azzam: [
    { t: RANGE_START, place: P.liguria },
    { t: Date.parse("2026-09-14T12:00:00Z"), place: P.liguria },
    { t: Date.parse("2026-09-18T08:00:00Z"), place: P.corsica },
    { t: Date.parse("2026-09-24T12:00:00Z"), place: P.liguria },
    { t: RANGE_END, place: P.liguria },
  ],
  kapitan: [
    { t: RANGE_START, place: P.merdeka },
    { t: Date.parse("2026-09-12T01:00:00Z"), place: P.merdeka },
    { t: Date.parse("2026-09-12T06:00:00Z"), place: P.javaSea },
    { t: Date.parse("2026-09-13T08:00:00Z"), place: P.javaSea },
    { t: Date.parse("2026-09-13T14:00:00Z"), place: P.merdeka },
    { t: RANGE_END, place: P.merdeka },
  ],
};

export function vesselFix(id: string, clock: number): VesselFix | null {
  const vessel = VESSELS.find((v) => v.id === id);
  const path = VESSEL_PATHS[id];
  if (!vessel || !path || path.length === 0) return null;
  let i = 0;
  while (i < path.length - 1 && path[i + 1].t < clock) i++;
  const a = path[i];
  const b = path[Math.min(i + 1, path.length - 1)];
  const span = Math.max(1, b.t - a.t);
  const u = Math.min(1, Math.max(0, (clock - a.t) / span));
  const pos = interpolateGreatCircle(a.place, b.place, u);
  const moving = Math.hypot(b.place.lat - a.place.lat, b.place.lng - a.place.lng) > 0.4;
  return {
    vessel,
    lat: pos.lat,
    lng: pos.lng,
    heading: moving ? bearing(a.place, b.place) : 0,
    label: vessel.name,
    source: "ais",
    confidence: "reported",
    underway: moving && u > 0 && u < 1,
  };
}

export function allVessels(clock: number): VesselFix[] {
  return VESSELS.map((v) => vesselFix(v.id, clock)).filter((v): v is VesselFix => v !== null);
}

export function fleetAt(clock: number, sky: SkySnapshot | null, now = Date.now()): FleetStatus[] {
  const live = isLive(clock, now);
  const seen = new Set<string>();
  const rows: FleetStatus[] = [];

  for (const leader of LEADERS) {
    const ac = leader.aircraft;
    if (!ac || seen.has(ac.id)) continue;
    seen.add(ac.id);
    const fix = applySky(fixAt(leader, clock), sky, now, clock);
    const adsb =
      live &&
      sky?.status === "live" &&
      sky.contacts.some((c) => c.icao24 === ac.icao24.toLowerCase() && !c.onGround);
    let status: FleetStatus["status"] = "parked";
    if (adsb) status = "adsb";
    else if (fix.mode === "airborne") status = "modeled";
    else if (fix.mode !== "stationary") status = "dark";
    rows.push({
      aircraft: ac,
      leaderId: leader.id,
      leaderName: leader.shortName,
      country: leader.country,
      iso: leader.iso,
      status,
      lat: fix.lat,
      lng: fix.lng,
      heading: fix.heading,
      callsign: ac.callsign,
      label:
        status === "adsb"
          ? "ADS-B contact"
          : status === "modeled"
            ? "Modeled airborne"
            : status === "dark"
              ? "Transponder dark"
              : "Parked",
    });
  }

  for (const ac of AIRCRAFT) {
    if (seen.has(ac.id)) continue;
    const hit =
      live && sky?.status === "live"
        ? sky.contacts.find((c) => c.icao24 === ac.icao24.toLowerCase())
        : undefined;
    rows.push({
      aircraft: ac,
      leaderId: "",
      leaderName: ac.operator,
      country: ac.operator,
      iso: "",
      status: hit && !hit.onGround ? "adsb" : "parked",
      lat: hit?.lat ?? ac.home.lat,
      lng: hit?.lng ?? ac.home.lng,
      heading: hit?.heading ?? 0,
      callsign: hit?.callsign.trim() || ac.callsign,
      label: hit && !hit.onGround ? "ADS-B contact" : "Parked",
    });
  }
  return rows;
}

export function boardRows(clock: number, sky: SkySnapshot | null): BoardRow[] {
  const rows: BoardRow[] = [];
  for (const l of LEADERS) {
    const fix = fixAt(l, clock);
    if (fix.mode === "airborne" && fix.trip) {
      rows.push({
        id: `${l.id}-air`,
        kind: "air",
        status: sky?.contacts.some((c) => c.icao24 === l.aircraft?.icao24.toLowerCase() && !c.onGround)
          ? "ADS-B"
          : "MODELED",
        principal: l.shortName,
        iso: l.iso,
        ident: l.aircraft?.callsign ?? "VIP",
        route: `${fix.trip.depart.place.city} → ${fix.trip.arrive.place.city}`,
        eta: formatTime(Date.parse(fix.trip.arrive.t)),
        source: fix.source,
      });
    } else {
      for (const trip of l.trips) {
        const dep = parse(trip.depart.t);
        const arr = parse(trip.arrive.t);
        if (clock < dep && dep - clock < 18 * 3600 * 1000) {
          rows.push({
            id: `${trip.id}-sched`,
            kind: "air",
            status: "SCHEDULED",
            principal: l.shortName,
            iso: l.iso,
            ident: l.aircraft?.callsign ?? "VIP",
            route: `${trip.depart.place.city} → ${trip.arrive.place.city}`,
            eta: formatTime(dep),
            source: trip.source,
          });
        } else if (clock >= arr && clock < arr + 6 * 3600 * 1000 && trip.kind === "unga") {
          rows.push({
            id: `${trip.id}-arr`,
            kind: "event",
            status: "ARRIVED",
            principal: l.shortName,
            iso: l.iso,
            ident: "UNGA",
            route: trip.arrive.place.city,
            eta: formatTime(arr),
            source: trip.source,
          });
        }
      }
    }
  }
  for (const v of allVessels(clock)) {
    if (!v.underway) continue;
    rows.push({
      id: v.vessel.id,
      kind: "sea",
      status: "AIS",
      principal: v.vessel.name,
      iso: v.vessel.flag,
      ident: v.vessel.mmsi ?? "SEA",
      route: v.label,
      eta: "—",
      source: "ais",
    });
  }
  const rank = (s: string) =>
    s === "ADS-B" ? 0 : s === "MODELED" ? 1 : s === "AIS" ? 2 : s === "SCHEDULED" ? 3 : 4;
  return rows.sort((a, b) => rank(a.status) - rank(b.status) || a.principal.localeCompare(b.principal));
}

export function feedItems(clock: number): FeedItem[] {
  const items: FeedItem[] = [
    {
      id: "unga-window",
      t: Date.parse("2026-09-18T14:00:00Z"),
      title: "UNGA high-level week opens",
      detail: "18–28 September · New York. General debate 22–28 Sep.",
      source: "schedule",
    },
  ];
  for (const l of LEADERS) {
    for (const ev of l.localEvents) {
      items.push({
        id: ev.id,
        t: parse(ev.t),
        title: ev.title,
        detail: `${l.shortName} · ${ev.venue}`,
        iso: l.iso,
        source: ev.source,
        leaderId: l.id,
      });
    }
    for (const trip of l.trips) {
      const dep = parse(trip.depart.t);
      const arr = parse(trip.arrive.t);
      items.push({
        id: `${trip.id}-dep`,
        t: dep,
        title: dep > clock ? `Departs ${trip.depart.place.city}` : `Departed ${trip.depart.place.city}`,
        detail: `${l.shortName} · ${trip.title}`,
        iso: l.iso,
        source: trip.source,
        leaderId: l.id,
      });
      items.push({
        id: `${trip.id}-arr`,
        t: arr,
        title: arr > clock ? `Arrives ${trip.arrive.place.city}` : `Arrived ${trip.arrive.place.city}`,
        detail: `${l.shortName} · ${trip.title}`,
        iso: l.iso,
        source: trip.source,
        leaderId: l.id,
      });
    }
  }
  return items
    .filter((it) => it.t <= clock + 6 * 3600 * 1000 && it.t >= clock - 72 * 3600 * 1000)
    .sort((a, b) => b.t - a.t)
    .slice(0, 24);
}

export function timelineMarks(): { t: number; label: string; kind: string }[] {
  const marks: { t: number; label: string; kind: string }[] = [
    { t: Date.parse("2026-09-18T14:00:00Z"), label: "UNGA opens", kind: "summit" },
    { t: Date.parse("2026-09-22T14:00:00Z"), label: "General debate", kind: "summit" },
  ];
  for (const l of LEADERS) {
    for (const trip of l.trips) {
      if (trip.kind === "unga") {
        marks.push({ t: parse(trip.depart.t), label: l.shortName, kind: "depart" });
      }
    }
  }
  return marks.sort((a, b) => a.t - b.t);
}

export { RANGE_START, RANGE_END };
