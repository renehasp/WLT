import { createServerFn } from "@tanstack/react-start";
import { AIRCRAFT } from "./data";
import type { SkyContact, SkySnapshot } from "./types";

let cache: { at: number; snap: SkySnapshot } | null = null;

type LolAc = {
  hex?: string;
  flight?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | "ground";
  gs?: number;
  track?: number;
  seen?: number;
};

function hexes(): string[] {
  return [...new Set(AIRCRAFT.map((a) => a.icao24.toLowerCase()).filter(Boolean))];
}

function contactFromLol(row: LolAc, now: number): SkyContact | null {
  const icao24 = String(row.hex ?? "").toLowerCase();
  const lat = typeof row.lat === "number" ? row.lat : null;
  const lng = typeof row.lon === "number" ? row.lon : null;
  if (!icao24 || lat == null || lng == null) return null;
  const alt = row.alt_baro;
  const onGround = alt === "ground" || alt === 0;
  return {
    icao24,
    callsign: String(row.flight ?? "").trim(),
    lat,
    lng,
    altitude: typeof alt === "number" ? alt : null,
    velocity: typeof row.gs === "number" ? row.gs : null,
    heading: typeof row.track === "number" ? row.track : null,
    onGround,
    lastContact: now / 1000 - (typeof row.seen === "number" ? row.seen : 0),
  };
}

function contactFromOpenSky(row: Array<string | number | boolean | null>, now: number): SkyContact | null {
  const icao24 = String(row[0] ?? "").toLowerCase();
  const lat = typeof row[6] === "number" ? row[6] : null;
  const lng = typeof row[5] === "number" ? row[5] : null;
  if (!icao24 || lat == null || lng == null) return null;
  return {
    icao24,
    callsign: String(row[1] ?? ""),
    lng,
    lat,
    altitude: typeof row[7] === "number" ? row[7] : null,
    velocity: typeof row[9] === "number" ? row[9] : null,
    heading: typeof row[10] === "number" ? row[10] : null,
    onGround: Boolean(row[8]),
    lastContact: typeof row[4] === "number" ? row[4] : now / 1000,
  };
}

async function fetchJson(url: string, ms: number): Promise<unknown> {
  const ctrl = new AbortController();
  const kill = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        accept: "application/json",
        "user-agent": "WLT/1.0 (world-leaders-tracker)",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(kill);
  }
}

function merge(into: Map<string, SkyContact>, hit: SkyContact | null, allow: Set<string>) {
  if (!hit || !allow.has(hit.icao24)) return;
  into.set(hit.icao24, hit);
}

async function pull(): Promise<SkySnapshot> {
  const now = Date.now();
  const ttl = cache?.snap.status === "unreachable" ? 12_000 : 40_000;
  if (cache && now - cache.at < ttl) return cache.snap;

  const allow = new Set(hexes());
  const bag = new Map<string, SkyContact>();
  let ok = false;
  let provider = "adsb.lol";

  const lolHex = `https://api.adsb.lol/v2/hex/${[...allow].join(",")}`;
  const sources = [lolHex, "https://api.adsb.lol/v2/mil", "https://api.adsb.fi/v2/mil"];

  const lolResults = await Promise.all(sources.map((url) => fetchJson(url, 6500)));
  for (const body of lolResults) {
    const ac = (body as { ac?: LolAc[] } | null)?.ac;
    if (!ac) continue;
    ok = true;
    for (const row of ac) merge(bag, contactFromLol(row, now), allow);
  }

  if (!ok) {
    const url = new URL("https://opensky-network.org/api/states/all");
    for (const h of allow) url.searchParams.append("icao24", h);
    const body = (await fetchJson(url.toString(), 2500)) as
      | { states?: Array<Array<string | number | boolean | null>> }
      | null;
    if (body && Array.isArray(body.states)) {
      ok = true;
      provider = "opensky";
      for (const row of body.states) merge(bag, contactFromOpenSky(row, now), allow);
    }
  }

  const contacts = [...bag.values()];
  const snap: SkySnapshot = {
    fetchedAt: now,
    status: ok ? (contacts.length ? "live" : "dark") : "unreachable",
    contacts,
    provider: ok ? provider : undefined,
  };
  cache = { at: now, snap };
  return snap;
}

export const fetchVipSky = createServerFn({ method: "POST" }).handler(async () => {
  return pull();
});
