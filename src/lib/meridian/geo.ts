import type { Feature, FeatureCollection } from "geojson";
import type { Place } from "./types";

const RAD = Math.PI / 180;

export function interpolateGreatCircle(
  a: Pick<Place, "lat" | "lng">,
  b: Pick<Place, "lat" | "lng">,
  t: number,
): { lat: number; lng: number } {
  const lat1 = a.lat * RAD;
  const lon1 = a.lng * RAD;
  const lat2 = b.lat * RAD;
  const lon2 = b.lng * RAD;
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat1 - lat2) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon1 - lon2) / 2) ** 2,
      ),
    );
  if (d < 1e-8) return { lat: a.lat, lng: a.lng };
  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);
  return {
    lat: (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI,
    lng: (Math.atan2(y, x) * 180) / Math.PI,
  };
}

export function bearing(
  a: Pick<Place, "lat" | "lng">,
  b: Pick<Place, "lat" | "lng">,
): number {
  const lat1 = a.lat * RAD;
  const lat2 = b.lat * RAD;
  const dLng = (b.lng - a.lng) * RAD;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function sampleArc(
  a: Pick<Place, "lat" | "lng">,
  b: Pick<Place, "lat" | "lng">,
  steps = 64,
): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const p = interpolateGreatCircle(a, b, i / steps);
    coords.push([p.lng, p.lat]);
  }
  return coords;
}

export function splitAntimeridian(coords: [number, number][]): [number, number][][] {
  const parts: [number, number][][] = [[]];
  for (const c of coords) {
    const part = parts[parts.length - 1];
    if (part && part.length) {
      const prev = part[part.length - 1];
      if (prev && Math.abs(c[0] - prev[0]) > 180) {
        parts.push([c]);
        continue;
      }
    }
    part?.push(c);
  }
  return parts.filter((p) => p.length > 1);
}

export function graticule(step = 30): FeatureCollection {
  const features: Feature[] = [];
  for (let lng = -180; lng <= 180; lng += step) {
    const coords: [number, number][] = [];
    for (let lat = -80; lat <= 80; lat += 2) coords.push([lng, lat]);
    features.push({
      type: "Feature",
      properties: { kind: lng === 0 ? "prime" : "meridian" },
      geometry: { type: "LineString", coordinates: coords },
    });
  }
  for (let lat = -60; lat <= 60; lat += step) {
    const coords: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += 2) coords.push([lng, lat]);
    features.push({
      type: "Feature",
      properties: { kind: lat === 0 ? "equator" : "parallel" },
      geometry: { type: "LineString", coordinates: coords },
    });
  }
  return { type: "FeatureCollection", features };
}

export function haversineKm(
  a: Pick<Place, "lat" | "lng">,
  b: Pick<Place, "lat" | "lng">,
): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLng = (b.lng - a.lng) * RAD;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(s));
}
