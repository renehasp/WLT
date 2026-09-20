import { P } from "./places";
import type { Meeting } from "./types";

function m(row: Meeting): Meeting {
  return row;
}

export const MEETINGS: Meeting[] = [
  m({
    id: "unga-week",
    t: "2026-09-18T14:00:00Z",
    tEnd: "2026-09-28T22:00:00Z",
    title: "UNGA 81 high-level week",
    detail: "Heads of state and government in New York. General debate 22–28 Sep.",
    venue: "UN Headquarters",
    place: P.unhq,
    visibility: "public",
    source: "schedule",
    confidence: "official",
    principals: [],
  }),
  m({
    id: "eu-council-sep",
    t: "2026-09-10T08:00:00Z",
    tEnd: "2026-09-11T16:00:00Z",
    title: "European Council",
    detail: "Formal summit of EU heads of government. Agenda: Ukraine, energy, enlargement.",
    venue: "Europa building",
    place: P.europa,
    visibility: "public",
    source: "schedule",
    confidence: "official",
    principals: [
      { id: "eu", name: "Costa", iso: "eu" },
      { id: "ec", name: "von der Leyen", iso: "eu" },
      { id: "de", name: "Merz", iso: "de" },
      { id: "fr", name: "Macron", iso: "fr" },
      { id: "nl", name: "Jetten", iso: "nl" },
    ],
  }),
  m({
    id: "climate-min",
    t: "2026-09-21T13:00:00Z",
    tEnd: "2026-09-21T17:30:00Z",
    title: "Climate ministerial",
    detail: "Pre-COP stocktake hosted on the margins of UNGA. Public remarks, closed working session.",
    venue: "UN Headquarters",
    place: P.unhq,
    visibility: "public",
    source: "schedule",
    confidence: "official",
    principals: [
      { id: "br", name: "Lula", iso: "br" },
      { id: "eu", name: "Costa", iso: "eu" },
      { id: "za", name: "Ramaphosa", iso: "za" },
    ],
  }),
  m({
    id: "debate-open",
    t: "2026-09-22T14:00:00Z",
    tEnd: "2026-09-22T21:00:00Z",
    title: "General debate opens",
    detail: "First day of UNGA general debate. Host country speaks first; US slot traditionally follows.",
    venue: "General Assembly Hall",
    place: P.unhq,
    visibility: "public",
    source: "schedule",
    confidence: "official",
    principals: [{ id: "us", name: "Trump", iso: "us" }],
  }),
  m({
    id: "trump-macron",
    t: "2026-09-21T16:30:00Z",
    tEnd: "2026-09-21T17:40:00Z",
    title: "Trump–Macron bilateral",
    detail: "Reported 70-minute bilateral at the Waldorf. Ukraine, tariffs, Lebanon.",
    venue: "Waldorf Astoria",
    place: P.waldorf,
    visibility: "closed",
    source: "schedule",
    confidence: "reported",
    principals: [
      { id: "us", name: "Trump", iso: "us" },
      { id: "fr", name: "Macron", iso: "fr" },
    ],
  }),
  m({
    id: "trump-burnham",
    t: "2026-09-22T15:10:00Z",
    tEnd: "2026-09-22T16:00:00Z",
    title: "Trump–Burnham bilateral",
    detail: "First US–UK meeting of the new British premier. AUKUS and steel tariffs on the paper.",
    venue: "Waldorf Astoria",
    place: P.waldorf,
    visibility: "closed",
    source: "schedule",
    confidence: "reported",
    principals: [
      { id: "us", name: "Trump", iso: "us" },
      { id: "gb", name: "Burnham", iso: "gb" },
    ],
  }),
  m({
    id: "modi-trump",
    t: "2026-09-23T14:20:00Z",
    tEnd: "2026-09-23T15:30:00Z",
    title: "Modi–Trump bilateral",
    detail: "Trade, energy, and Quad language. Pool spray at the top, then closed.",
    venue: "Waldorf Astoria",
    place: P.waldorf,
    visibility: "closed",
    source: "schedule",
    confidence: "reported",
    principals: [
      { id: "us", name: "Trump", iso: "us" },
      { id: "in", name: "Modi", iso: "in" },
    ],
  }),
  m({
    id: "quad-aside",
    t: "2026-09-22T18:40:00Z",
    tEnd: "2026-09-22T19:25:00Z",
    title: "Quad pull-aside",
    detail: "US, Japan, Australia, India — 45 minutes off the main schedule. No readout promised.",
    venue: "UN Delegates Lounge",
    place: P.unhq,
    visibility: "closed",
    source: "osint",
    confidence: "reported",
    principals: [
      { id: "us", name: "Trump", iso: "us" },
      { id: "jp", name: "Takaichi", iso: "jp" },
      { id: "au", name: "Albanese", iso: "au" },
      { id: "in", name: "Modi", iso: "in" },
    ],
  }),
  m({
    id: "eu-us-trade",
    t: "2026-09-23T11:00:00Z",
    tEnd: "2026-09-23T12:10:00Z",
    title: "EU–US trade huddle",
    detail: "Commission + Council presidents with the US trade team. Steel, autos, digital.",
    venue: "US Mission to the UN",
    place: P.sutton,
    visibility: "closed",
    source: "schedule",
    confidence: "reported",
    principals: [
      { id: "eu", name: "Costa", iso: "eu" },
      { id: "ec", name: "von der Leyen", iso: "eu" },
    ],
  }),
  m({
    id: "gcc-consult",
    t: "2026-09-23T20:00:00Z",
    tEnd: "2026-09-23T21:30:00Z",
    title: "Gulf coordination",
    detail: "Saudi, UAE, and host-country channel. Gaza language and energy window.",
    venue: "Private residence, Sutton Place",
    place: P.sutton,
    visibility: "closed",
    source: "osint",
    confidence: "reported",
    principals: [
      { id: "sa", name: "MBS", iso: "sa" },
      { id: "ae", name: "MBZ", iso: "ae" },
    ],
  }),
  m({
    id: "p5-consult",
    t: "2026-09-21T23:30:00Z",
    tEnd: "2026-09-22T01:00:00Z",
    title: "Reported P5 consult",
    detail: "No cameras. Perm-five political directors plus two principals. Agenda not published.",
    venue: "Sutton Place",
    place: P.sutton,
    visibility: "unscheduled",
    source: "osint",
    confidence: "modeled",
    principals: [
      { id: "us", name: "Trump", iso: "us" },
      { id: "fr", name: "Macron", iso: "fr" },
      { id: "gb", name: "Burnham", iso: "gb" },
    ],
  }),
  m({
    id: "zelenskyy-aside",
    t: "2026-09-21T19:10:00Z",
    tEnd: "2026-09-21T19:50:00Z",
    title: "Zelenskyy–Burnham pull-aside",
    detail: "Unlisted 40-minute hold after the Ukrainian arrival. Airspace and munitions.",
    venue: "UN Delegates Lounge",
    place: P.unhq,
    visibility: "unscheduled",
    source: "osint",
    confidence: "modeled",
    principals: [
      { id: "ua", name: "Zelenskyy", iso: "ua" },
      { id: "gb", name: "Burnham", iso: "gb" },
    ],
  }),
  m({
    id: "midtown-motorcade",
    t: "2026-09-20T22:15:00Z",
    tEnd: "2026-09-20T23:10:00Z",
    title: "Unannounced Midtown hold",
    detail: "NYPD freeze and a four-car motorcade into a hotel garage. No principal confirmed. Pattern matches a Gulf or East Asian arrival.",
    venue: "Midtown hotel",
    place: { name: "Midtown", city: "New York", lat: 40.758, lng: -73.979 },
    visibility: "unscheduled",
    source: "osint",
    confidence: "modeled",
    principals: [],
  }),
  m({
    id: "xi-putin-call",
    t: "2026-09-21T04:00:00Z",
    tEnd: "2026-09-21T04:40:00Z",
    title: "Xi–Putin call",
    detail: "Both staying off the UNGA floor. Kremlin pool later confirmed a ‘working telephone conversation’.",
    venue: "Zhongnanhai / Kremlin",
    place: P.zhongnanhai,
    visibility: "closed",
    source: "osint",
    confidence: "reported",
    principals: [
      { id: "cn", name: "Xi", iso: "cn" },
      { id: "ru", name: "Putin", iso: "ru" },
    ],
  }),
  m({
    id: "meloni-vdl",
    t: "2026-09-22T11:30:00Z",
    tEnd: "2026-09-22T12:20:00Z",
    title: "Meloni–von der Leyen",
    detail: "Migration pact and energy corridor. Brief doorstep, then closed.",
    venue: "EU delegation, New York",
    place: P.unhq,
    visibility: "closed",
    source: "schedule",
    confidence: "reported",
    principals: [
      { id: "it", name: "Meloni", iso: "it" },
      { id: "ec", name: "von der Leyen", iso: "eu" },
    ],
  }),
  m({
    id: "takaichi-lee",
    t: "2026-09-23T16:00:00Z",
    tEnd: "2026-09-23T16:50:00Z",
    title: "Takaichi–Lee bilateral",
    detail: "Japan–ROK first UNGA meeting of both new governments. Export controls and North Korea.",
    venue: "Japanese mission",
    place: P.unhq,
    visibility: "closed",
    source: "schedule",
    confidence: "official",
    principals: [
      { id: "jp", name: "Takaichi", iso: "jp" },
      { id: "kr", name: "Lee", iso: "kr" },
    ],
  }),
  m({
    id: "lula-ramaphosa",
    t: "2026-09-24T13:00:00Z",
    tEnd: "2026-09-24T13:50:00Z",
    title: "IBSA political consult",
    detail: "Lula, Ramaphosa, Modi — G20 handover language. Public photo only.",
    venue: "UN Headquarters",
    place: P.unhq,
    visibility: "public",
    source: "schedule",
    confidence: "official",
    principals: [
      { id: "br", name: "Lula", iso: "br" },
      { id: "za", name: "Ramaphosa", iso: "za" },
      { id: "in", name: "Modi", iso: "in" },
    ],
  }),
  m({
    id: "erdogan-sisi",
    t: "2026-09-24T18:20:00Z",
    tEnd: "2026-09-24T19:10:00Z",
    title: "Erdoğan–Sisi bilateral",
    detail: "Normalization track. Gaza and Eastern Mediterranean gas. Closed.",
    venue: "Turkish House",
    place: P.unhq,
    visibility: "closed",
    source: "osint",
    confidence: "reported",
    principals: [
      { id: "tr", name: "Erdoğan", iso: "tr" },
      { id: "eg", name: "Sisi", iso: "eg" },
    ],
  }),
  m({
    id: "no-cameras-gulf",
    t: "2026-09-22T02:10:00Z",
    tEnd: "2026-09-22T03:40:00Z",
    title: "No-cameras Gulf meeting",
    detail: "Doormen rotated; phones collected. Two principals, one interpreter. Not on any published diary.",
    venue: "Private floor, Midtown",
    place: P.sutton,
    visibility: "unscheduled",
    source: "osint",
    confidence: "modeled",
    principals: [{ id: "sa", name: "MBS", iso: "sa" }],
  }),
  m({
    id: "women-leaders",
    t: "2026-09-21T22:00:00Z",
    tEnd: "2026-09-22T00:30:00Z",
    title: "Women political leaders reception",
    detail: "Public reception. Sheinbaum expected; several European principals listed.",
    venue: "Lincoln Center",
    place: { name: "Lincoln Center", city: "New York", lat: 40.7725, lng: -73.9835 },
    visibility: "public",
    source: "schedule",
    confidence: "official",
    principals: [
      { id: "mx", name: "Sheinbaum", iso: "mx" },
      { id: "it", name: "Meloni", iso: "it" },
    ],
  }),
];

const WINDOW_PAST = 6 * 3600 * 1000;
const WINDOW_FUTURE = 8 * 86_400_000;

export function meetingsAround(clock: number): Meeting[] {
  return MEETINGS.filter((ev) => {
    const start = Date.parse(ev.t);
    const end = ev.tEnd ? Date.parse(ev.tEnd) : start;
    return end >= clock - WINDOW_PAST && start <= clock + WINDOW_FUTURE;
  }).sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
}

export function meetingStatus(ev: Meeting, clock: number): "live" | "upcoming" | "ended" {
  const start = Date.parse(ev.t);
  const end = ev.tEnd ? Date.parse(ev.tEnd) : start + 60 * 60 * 1000;
  if (clock >= start && clock <= end) return "live";
  if (clock > end) return "ended";
  return "upcoming";
}

export type EventCluster = {
  key: string;
  lat: number;
  lng: number;
  venue: string;
  city: string;
  items: Meeting[];
};

export function clusterMeetings(meetings: Meeting[]): EventCluster[] {
  const map = new Map<string, EventCluster>();
  for (const ev of meetings) {
    const key = `${ev.place.lat.toFixed(2)}:${ev.place.lng.toFixed(2)}`;
    let cluster = map.get(key);
    if (!cluster) {
      cluster = {
        key,
        lat: ev.place.lat,
        lng: ev.place.lng,
        venue: ev.venue,
        city: ev.place.city,
        items: [],
      };
      map.set(key, cluster);
    }
    cluster.items.push(ev);
  }
  for (const cluster of map.values()) {
    cluster.items.sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  }
  return [...map.values()];
}

export function pickClusterEvent(cluster: EventCluster, clock: number): Meeting {
  const live = cluster.items.find((ev) => meetingStatus(ev, clock) === "live");
  if (live) return live;
  const next = cluster.items.find((ev) => meetingStatus(ev, clock) === "upcoming");
  return next ?? cluster.items[0];
}

export function meetingById(id: string | null): Meeting | undefined {
  if (!id) return undefined;
  return MEETINGS.find((ev) => ev.id === id);
}
