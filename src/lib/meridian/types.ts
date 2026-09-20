export type Region =
  | "americas"
  | "europe"
  | "asia-pacific"
  | "mena"
  | "africa"
  | "multilateral";

export type SourceKind = "schedule" | "adsb" | "ais" | "osint";
export type Confidence = "official" | "reported" | "modeled";

export type PlaceKind =
  | "residence"
  | "event"
  | "transit"
  | "summit"
  | "aircraft"
  | "vessel"
  | "unga";

export type Place = {
  name: string;
  city: string;
  lat: number;
  lng: number;
};

export type Aircraft = {
  id: string;
  name: string;
  tail: string;
  callsign: string;
  icao24: string;
  operator: string;
  note: string;
  home: Place;
};

export type Vessel = {
  id: string;
  name: string;
  flag: string;
  mmsi?: string;
  operator: string;
  note: string;
  leaderId?: string;
};

export type Trip = {
  id: string;
  title: string;
  kind: PlaceKind;
  source: SourceKind;
  confidence: Confidence;
  depart: { t: string; place: Place };
  arrive: { t: string; place: Place };
  venue?: string;
  stayUntil?: string;
  returnDepart?: string;
  returnArrive?: string;
  returnTo?: Place;
  aircraftId?: string;
  vesselId?: string;
};

export type LocalEvent = {
  id: string;
  t: string;
  tEnd?: string;
  title: string;
  venue: string;
  place: Place;
  kind: PlaceKind;
  source: SourceKind;
  confidence: Confidence;
};

export type Leader = {
  id: string;
  name: string;
  shortName: string;
  title: string;
  country: string;
  iso: string;
  region: Region;
  since: string;
  residence: Place;
  aircraft?: Aircraft;
  vesselId?: string;
  trips: Trip[];
  localEvents: LocalEvent[];
};

export type Waypoint = {
  t: number;
  lat: number;
  lng: number;
  kind: PlaceKind;
  label: string;
  city: string;
  source: SourceKind;
  confidence: Confidence;
  tripId?: string;
  venue?: string;
};

export type MotionMode = "stationary" | "ground" | "airborne" | "at-sea";

export type LeaderFix = {
  leader: Leader;
  lat: number;
  lng: number;
  heading: number;
  kind: PlaceKind;
  label: string;
  city: string;
  mode: MotionMode;
  source: SourceKind;
  confidence: Confidence;
  trip?: Trip;
  progress?: number;
  from?: { lat: number; lng: number };
  to?: { lat: number; lng: number };
};

export type SkyContact = {
  icao24: string;
  callsign: string;
  lat: number;
  lng: number;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  onGround: boolean;
  lastContact: number;
};

export type SkySnapshot = {
  fetchedAt: number;
  status: "live" | "dark" | "unreachable";
  contacts: SkyContact[];
  provider?: string;
};

export type FleetStatus = {
  aircraft: Aircraft;
  leaderId: string;
  leaderName: string;
  country: string;
  iso: string;
  status: "adsb" | "modeled" | "dark" | "parked";
  lat: number;
  lng: number;
  heading: number;
  callsign: string;
  label: string;
};

export type VesselFix = {
  vessel: Vessel;
  lat: number;
  lng: number;
  heading: number;
  label: string;
  source: SourceKind;
  confidence: Confidence;
  underway: boolean;
};

export type BoardRow = {
  id: string;
  kind: "air" | "sea" | "event";
  status: string;
  principal: string;
  iso: string;
  ident: string;
  route: string;
  eta: string;
  source: SourceKind;
};

export type FeedItem = {
  id: string;
  t: number;
  title: string;
  detail: string;
  iso?: string;
  source: SourceKind;
  leaderId?: string;
};

export type MeetingVisibility = "public" | "closed" | "unscheduled";

export type Meeting = {
  id: string;
  t: string;
  tEnd?: string;
  title: string;
  detail: string;
  venue: string;
  place: Place;
  visibility: MeetingVisibility;
  source: SourceKind;
  confidence: Confidence;
  principals: { id: string; name: string; iso: string }[];
};

export const RANGE_START = Date.parse("2026-09-06T00:00:00Z");
export const RANGE_END = Date.parse("2026-09-28T00:00:00Z");
export const UNGA = {
  start: Date.parse("2026-09-18T14:00:00Z"),
  debate: Date.parse("2026-09-22T14:00:00Z"),
  end: Date.parse("2026-09-28T22:00:00Z"),
};
