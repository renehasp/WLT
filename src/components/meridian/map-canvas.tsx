import { useEffect, useRef, useState } from "react";
import type {
  GeoJSON as LeafletGeoJSON,
  Layer,
  LayerGroup,
  Map as LeafletMap,
  Marker,
} from "leaflet";
import { Calendar, Plane, Ship } from "lucide-react";
import { createRoot, type Root } from "react-dom/client";
import { graticule } from "@/lib/meridian/geo";
import { useWorld } from "@/lib/meridian/use-world";
import { useMeridian } from "@/lib/meridian/store";
import { meetingStatus, pickClusterEvent, type EventCluster } from "@/lib/meridian/meetings";
import type { FleetStatus, LeaderFix, VesselFix } from "@/lib/meridian/types";
import { cn } from "@/lib/utils";

const GRATICULE = graticule(30);

const OSM_FR = "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";
const OSM_DE = "https://tile.openstreetmap.de/{z}/{x}/{y}.png";

function flagUrl(iso: string) {
  if (iso === "un") return "https://flagcdn.com/w80/un.png";
  return `https://flagcdn.com/w80/${iso}.png`;
}

function Pin({ fix, selected }: { fix: LeaderFix; selected: boolean }) {
  const live = fix.mode === "airborne" || fix.mode === "at-sea";
  return (
    <button
      type="button"
      className={cn("m-pin", live && "is-live", selected && "is-selected")}
      aria-label={`${fix.leader.name}, ${fix.city}`}
    >
      <span className="m-pulse" />
      {live ? (
        <span className="absolute top-0 right-0 z-10 grid size-3.5 place-items-center rounded-full bg-bg text-live shadow-[var(--shadow-border)]">
          <Plane className="size-2.5" strokeWidth={2} />
        </span>
      ) : null}
      <span className="m-disc">
        <img
          src={flagUrl(fix.leader.iso)}
          alt=""
          draggable={false}
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = "none";
            const sib = el.nextElementSibling as HTMLElement | null;
            if (sib) sib.hidden = false;
          }}
        />
        <span className="m-code" hidden>
          {fix.leader.iso.toUpperCase()}
        </span>
      </span>
      {selected ? <span className="m-label">{fix.leader.shortName}</span> : null}
    </button>
  );
}

function Craft({ row }: { row: FleetStatus }) {
  return (
    <button
      type="button"
      className={cn("m-craft", row.status === "adsb" && "is-adsb")}
      aria-label={`${row.callsign} ${row.label}`}
      style={{ transform: `rotate(${row.heading}deg)` }}
    >
      <span className="m-craft-body">
        <Plane className="size-3.5" strokeWidth={1.75} />
      </span>
    </button>
  );
}

function Boat({ row }: { row: VesselFix }) {
  return (
    <button type="button" className="m-ship" aria-label={row.vessel.name}>
      <span className="m-ship-body">
        <Ship className="size-3.5" strokeWidth={1.75} />
      </span>
    </button>
  );
}

function EventPin({
  cluster,
  selected,
  live,
  clock,
}: {
  cluster: EventCluster;
  selected: boolean;
  live: boolean;
  clock: number;
}) {
  const primary = pickClusterEvent(cluster, clock);
  return (
    <button
      type="button"
      className={cn("m-event", live && "is-live", selected && "is-selected")}
      aria-label={`${primary.title}, ${cluster.city}`}
    >
      <span className="m-event-pulse" />
      <span className="m-event-body">
        <Calendar className="size-3.5" strokeWidth={1.75} />
      </span>
      {cluster.items.length > 1 ? (
        <span className="m-event-count">{cluster.items.length}</span>
      ) : null}
      <span className="m-label">{selected ? primary.title : cluster.city}</span>
    </button>
  );
}

type MarkerRec = { marker: Marker; root: Root };

type LeafletNS = typeof import("leaflet");

function waitForBox(el: HTMLElement, timeoutMs = 2500): Promise<void> {
  if (el.clientWidth > 2 && el.clientHeight > 2) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      ro.disconnect();
      window.clearTimeout(tid);
      resolve();
    };
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 2 && el.clientHeight > 2) finish();
    });
    ro.observe(el);
    const tid = window.setTimeout(finish, timeoutMs);
  });
}

function mountMarker(
  L: LeafletNS,
  map: LeafletMap,
  node: HTMLElement,
  lng: number,
  lat: number,
  group?: LayerGroup,
): MarkerRec {
  const icon = L.divIcon({
    html: node as unknown as string,
    className: "m-leaflet-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
  const marker = L.marker([lat, lng], {
    icon,
    keyboard: false,
    riseOnHover: true,
    riseOffset: 120,
  });
  if (group) marker.addTo(group);
  else marker.addTo(map);
  return { marker, root: createRoot(node) };
}

function setLayerOn(map: LeafletMap, layer: Layer, on: boolean) {
  const has = map.hasLayer(layer);
  if (on && !has) layer.addTo(map);
  if (!on && has) layer.remove();
}

export function MapCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const libRef = useRef<LeafletNS | null>(null);
  const overlayRef = useRef<{
    graticule: LeafletGeoJSON;
    tracks: LeafletGeoJSON;
    behind: LeafletGeoJSON;
    ahead: LeafletGeoJSON;
    events: LayerGroup;
  } | null>(null);
  const leaderMarks = useRef(new Map<string, MarkerRec>());
  const airMarks = useRef(new Map<string, MarkerRec>());
  const seaMarks = useRef(new Map<string, MarkerRec>());
  const eventMarks = useRef(new Map<string, MarkerRec>());
  const [mapReady, setMapReady] = useState(false);
  const world = useWorld();
  const worldRef = useRef(world);
  worldRef.current = world;
  const layers = useMeridian((s) => s.layers);
  const selectedId = useMeridian((s) => s.selectedId);
  const selectedEventId = useMeridian((s) => s.selectedEventId);
  const focusAt = useMeridian((s) => s.focusAt);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    let cancelled = false;
    const host = hostRef.current;
    const tracks = worldRef.current.tracks;
    const timers: number[] = [];
    let ro: ResizeObserver | null = null;
    const fit = () => mapRef.current?.invalidateSize({ animate: false });

    (async () => {
      const leafletMod = await import("leaflet");
      const L = (leafletMod as { default?: LeafletNS }).default ?? (leafletMod as LeafletNS);
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !host.isConnected) return;
      await waitForBox(host);
      if (cancelled || !host.isConnected) return;

      if ("_leaflet_id" in host) {
        host.replaceChildren();
        delete (host as { _leaflet_id?: number })._leaflet_id;
      }

      libRef.current = L;
      const map = L.map(host, {
        center: [28, 12],
        zoom: 2,
        minZoom: 1,
        maxZoom: 12,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        zoomControl: false,
        attributionControl: true,
        preferCanvas: true,
        worldCopyJump: true,
        bounceAtZoomLimits: false,
        inertia: true,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true,
        easeLinearity: 0.25,
      });
      map.attributionControl.setPrefix(false);
      mapRef.current = map;

      const tileOpts = {
        maxZoom: 12,
        minZoom: 1,
        detectRetina: false,
        keepBuffer: 1,
        updateWhenZooming: false,
        updateWhenIdle: true,
        className: "m-tiles",
        attribution: "© OpenStreetMap",
      };

      const osm = L.tileLayer(OSM_FR, {
        ...tileOpts,
        subdomains: "abc",
      });
      let osmOk = false;
      let fellBack = false;
      const useFallback = () => {
        if (fellBack || cancelled || osmOk) return;
        fellBack = true;
        map.removeLayer(osm);
        L.tileLayer(OSM_DE, tileOpts).addTo(map);
      };

      osm.on("tileload", () => {
        osmOk = true;
      });
      osm.on("tileerror", () => {
        if (!osmOk) useFallback();
      });
      timers.push(
        window.setTimeout(() => {
          if (!osmOk) useFallback();
        }, 4000),
      );
      osm.addTo(map);

      const graticuleLayer = L.geoJSON(GRATICULE, {
        interactive: false,
        style: (feature) => {
          const kind = feature?.properties?.kind;
          if (kind === "prime") return { color: "#c5cdd6", opacity: 0.22, weight: 1.1, fill: false };
          if (kind === "equator") return { color: "#c5cdd6", opacity: 0.18, weight: 1, fill: false };
          return { color: "#c5cdd6", opacity: 0.07, weight: 0.6, fill: false };
        },
      }).addTo(map);
      const tracksLayer = L.geoJSON(tracks, {
        interactive: false,
        style: { color: "#8a9a8e", opacity: 0.22, weight: 1.15, fill: false },
      }).addTo(map);
      const trailStyle =
        (color: string) =>
        (feature?: { properties?: { selected?: boolean } | null }) => ({
          color,
          opacity: feature?.properties?.selected ? 0.95 : 0.72,
          weight: feature?.properties?.selected ? 2.8 : 1.5,
          fill: false as const,
        });
      const behindLayer = L.geoJSON(worldRef.current.trails.behind, {
        interactive: false,
        style: trailStyle("#c07060"),
      }).addTo(map);
      const aheadLayer = L.geoJSON(worldRef.current.trails.ahead, {
        interactive: false,
        style: trailStyle("#7d9a8c"),
      }).addTo(map);
      const eventsLayer = L.layerGroup().addTo(map);
      overlayRef.current = {
        graticule: graticuleLayer,
        tracks: tracksLayer,
        behind: behindLayer,
        ahead: aheadLayer,
        events: eventsLayer,
      };

      map.on("click", (e) => {
        const t = (e.originalEvent.target as HTMLElement | null) ?? null;
        if (t?.closest(".m-pin, .m-craft, .m-ship, .m-event, .m-leaflet-icon")) return;
        useMeridian.getState().clearSelection();
      });

      const fitNow = () => {
        if (cancelled || !mapRef.current) return;
        map.invalidateSize({ animate: false });
      };
      ro = new ResizeObserver(fitNow);
      ro.observe(host);
      window.addEventListener("orientationchange", fit);
      window.addEventListener("resize", fit);
      document.addEventListener("visibilitychange", fit);
      window.visualViewport?.addEventListener("resize", fit);
      timers.push(window.setTimeout(fitNow, 60));
      timers.push(window.setTimeout(fitNow, 280));
      timers.push(window.setTimeout(fitNow, 900));

      map.whenReady(() => {
        fitNow();
        if (!cancelled) setMapReady(true);
      });
    })().catch(() => {
      /* map init failed; host stays on the dark fallback fill */
    });

    return () => {
      cancelled = true;
      for (const id of timers) window.clearTimeout(id);
      ro?.disconnect();
      window.removeEventListener("orientationchange", fit);
      window.removeEventListener("resize", fit);
      document.removeEventListener("visibilitychange", fit);
      window.visualViewport?.removeEventListener("resize", fit);
      for (const bag of [leaderMarks.current, airMarks.current, seaMarks.current, eventMarks.current]) {
        for (const rec of bag.values()) {
          rec.marker.remove();
          rec.root.unmount();
        }
        bag.clear();
      }
      overlayRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = libRef.current;
    const overlay = overlayRef.current;
    if (!map || !L || !overlay || !mapReady) return;

    setLayerOn(map, overlay.graticule, layers.graticule);
    setLayerOn(map, overlay.tracks, layers.tracks);
    const showTrails = layers.leaders || layers.tracks;
    setLayerOn(map, overlay.behind, showTrails);
    setLayerOn(map, overlay.ahead, showTrails);
    setLayerOn(map, overlay.events, layers.events);

    overlay.behind.clearLayers();
    overlay.behind.addData(world.trails.behind);
    overlay.ahead.clearLayers();
    overlay.ahead.addData(world.trails.ahead);

    const eventUsed = new Set<string>();
    if (layers.events) {
      for (const cluster of world.clusters) {
        eventUsed.add(cluster.key);
        let rec = eventMarks.current.get(cluster.key);
        if (!rec) {
          const el = document.createElement("div");
          const key = cluster.key;
          rec = mountMarker(L, map, el, cluster.lng, cluster.lat, overlay.events);
          rec.marker.setZIndexOffset(450);
          eventMarks.current.set(key, rec);
          rec.marker.on("click", (ev) => {
            L.DomEvent.stopPropagation(ev);
            const current = worldRef.current.clusters.find((c) => c.key === key);
            if (!current) return;
            const pick = pickClusterEvent(current, useMeridian.getState().clock);
            useMeridian.getState().openEvent(pick.id);
          });
        }
        rec.marker.setLatLng([cluster.lat, cluster.lng]);
        const selected = cluster.items.some((item) => item.id === selectedEventId);
        const live = cluster.items.some(
          (item) => meetingStatus(item, useMeridian.getState().clock) === "live",
        );
        rec.root.render(
          <EventPin
            cluster={cluster}
            selected={selected}
            live={live}
            clock={useMeridian.getState().clock}
          />,
        );
      }
    }
    for (const [id, rec] of eventMarks.current) {
      if (!eventUsed.has(id) || !layers.events) {
        rec.marker.remove();
        rec.root.unmount();
        eventMarks.current.delete(id);
      }
    }

    const used = new Set<string>();
    if (layers.leaders) {
      for (const fix of world.fixes) {
        used.add(fix.leader.id);
        let rec = leaderMarks.current.get(fix.leader.id);
        if (!rec) {
          const el = document.createElement("div");
          const leaderId = fix.leader.id;
          rec = mountMarker(L, map, el, fix.lng, fix.lat);
          leaderMarks.current.set(leaderId, rec);
          rec.marker.on("click", (ev) => {
            L.DomEvent.stopPropagation(ev);
            useMeridian.getState().select(leaderId);
          });
        }
        rec.marker.setLatLng([fix.lat, fix.lng]);
        rec.root.render(<Pin fix={fix} selected={selectedId === fix.leader.id} />);
      }
    }
    for (const [id, rec] of leaderMarks.current) {
      if (!used.has(id) || !layers.leaders) {
        rec.marker.remove();
        rec.root.unmount();
        leaderMarks.current.delete(id);
      }
    }

    const airUsed = new Set<string>();
    if (layers.aircraft) {
      for (const row of world.fleet) {
        if (row.status === "parked") continue;
        if (row.leaderId && layers.leaders && world.visible.has(row.leaderId)) continue;
        airUsed.add(row.aircraft.id);
        let rec = airMarks.current.get(row.aircraft.id);
        if (!rec) {
          const el = document.createElement("div");
          const leaderId = row.leaderId;
          rec = mountMarker(L, map, el, row.lng, row.lat);
          airMarks.current.set(row.aircraft.id, rec);
          rec.marker.on("click", (ev) => {
            L.DomEvent.stopPropagation(ev);
            if (leaderId) useMeridian.getState().select(leaderId);
          });
        }
        rec.marker.setLatLng([row.lat, row.lng]);
        rec.root.render(<Craft row={row} />);
      }
    }
    for (const [id, rec] of airMarks.current) {
      if (!airUsed.has(id) || !layers.aircraft) {
        rec.marker.remove();
        rec.root.unmount();
        airMarks.current.delete(id);
      }
    }

    const seaUsed = new Set<string>();
    if (layers.vessels) {
      for (const row of world.vessels) {
        seaUsed.add(row.vessel.id);
        let rec = seaMarks.current.get(row.vessel.id);
        if (!rec) {
          const el = document.createElement("div");
          const leaderId = row.vessel.leaderId;
          rec = mountMarker(L, map, el, row.lng, row.lat);
          seaMarks.current.set(row.vessel.id, rec);
          rec.marker.on("click", (ev) => {
            L.DomEvent.stopPropagation(ev);
            if (leaderId) useMeridian.getState().select(leaderId);
          });
        }
        rec.marker.setLatLng([row.lat, row.lng]);
        rec.root.render(<Boat row={row} />);
      }
    }
    for (const [id, rec] of seaMarks.current) {
      if (!seaUsed.has(id) || !layers.vessels) {
        rec.marker.remove();
        rec.root.unmount();
        seaMarks.current.delete(id);
      }
    }
  }, [world, layers, selectedId, selectedEventId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    if (useMeridian.getState().focusAt) return;
    const fix = worldRef.current.allFixes.find((f) => f.leader.id === selectedId);
    if (!fix) return;
    map.flyTo([fix.lat, fix.lng], Math.max(map.getZoom(), 4), {
      duration: 0.7,
      easeLinearity: 0.22,
    });
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusAt) return;
    map.flyTo([focusAt.lat, focusAt.lng], Math.max(map.getZoom(), focusAt.zoom ?? 5), {
      duration: 0.7,
      easeLinearity: 0.22,
    });
  }, [focusAt]);

  return (
    <div className="absolute inset-0 isolate z-0 overflow-hidden bg-bg">
      <div ref={hostRef} className="meridian-map absolute inset-0 h-full w-full" />
    </div>
  );
}
