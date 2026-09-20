import { useEffect, useState } from "react";
import { Plane, Ship, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CraftOverlay } from "@/components/meridian/craft-overlay";
import { VESSELS } from "@/lib/meridian/data";
import { getTrack } from "@/lib/meridian/engine";
import {
  confidenceLabel,
  formatCoords,
  formatDurationMinutes,
  formatUtc,
  modeLabel,
  sourceLabel,
  tripElapsedMinutes,
  tripRemainingMinutes,
} from "@/lib/meridian/format";
import { useMeridian } from "@/lib/meridian/store";
import { useWorld } from "@/lib/meridian/use-world";

export function DetailPanel() {
  const selectedId = useMeridian((s) => s.selectedId);
  const select = useMeridian((s) => s.select);
  const clock = useMeridian((s) => s.clock);
  const world = useWorld();
  const [craftOpen, setCraftOpen] = useState(false);

  useEffect(() => {
    setCraftOpen(false);
  }, [selectedId]);

  const fix = world.allFixes.find((f) => f.leader.id === selectedId);
  if (!fix) return null;
  const { leader } = fix;
  const track = getTrack(leader.id).filter(
    (w) => w.t >= clock - 10 * 86_400_000 && w.t <= clock + 10 * 86_400_000,
  );
  const trip = fix.trip;
  const vesselId = trip?.vesselId ?? leader.vesselId;
  const vessel = vesselId ? VESSELS.find((v) => v.id === vesselId) : undefined;

  // At-sea / vessel trips must prefer vessel craft (Ship + vessel overlay), not aircraft.
  // Airborne keeps the aircraft path. Leaders may have both aircraft and vesselId.
  const preferVessel = fix.mode === "at-sea" || trip?.kind === "vessel";
  const craftKind: "air" | "sea" | null = preferVessel
    ? vessel
      ? "sea"
      : null
    : leader.aircraft
      ? "air"
      : vessel
        ? "sea"
        : null;
  const craftImageUrl = craftKind === "air" ? leader.aircraft?.imageUrl : vessel?.imageUrl;
  const craftCaption =
    craftKind === "air" && leader.aircraft
      ? `${leader.aircraft.callsign} · ${leader.aircraft.tail}`
      : craftKind === "sea" && vessel
        ? `${vessel.name} · ${vessel.flag}`
        : "";
  const craftAria =
    craftKind === "air" && leader.aircraft
      ? `Open craft details for ${leader.aircraft.name}`
      : craftKind === "sea" && vessel
        ? `Open craft details for ${vessel.name}`
        : "Open craft details";
  const fromCity = trip?.depart.place.city;
  const toCity = trip?.arrive.place.city;
  const elapsed = trip ? tripElapsedMinutes(clock, trip.depart.t) : null;
  const remaining = trip ? tripRemainingMinutes(clock, trip.arrive.t) : null;

  const fromAria =
    elapsed !== null && fromCity
      ? `From ${fromCity}, ${elapsed} minutes since departure`
      : undefined;
  const toAria =
    remaining !== null && toCity
      ? `To ${toCity}, ${remaining} minutes until arrival`
      : undefined;

  const CraftIcon = craftKind === "air" ? Plane : Ship;

  return (
    <div className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-xl bg-surface/95 shadow-[var(--shadow-border)] md:w-80">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="font-display text-2xl leading-tight italic">{leader.name}</p>
          <p className="mt-1 text-sm text-muted">
            {leader.title} · {leader.country}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close detail" onClick={() => select(null)}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        <Badge tone={fix.mode === "airborne" ? "live" : "mute"}>{modeLabel(fix.mode)}</Badge>
        <Badge tone="solid">{sourceLabel(fix.source)}</Badge>
        <Badge>{confidenceLabel(fix.confidence)}</Badge>
      </div>
      <Separator />
      <div className="meridian-scroll min-h-0 flex-1 overflow-y-auto p-4">
        {craftKind ? (
          <div className="mb-4">
            <button
              type="button"
              aria-label={craftAria}
              onClick={() => setCraftOpen(true)}
              className="group relative block w-full min-h-11 overflow-hidden rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {craftImageUrl ? (
                <img
                  src={craftImageUrl}
                  alt=""
                  className="aspect-[16/10] w-full object-cover transition-[filter] duration-150 group-hover:brightness-110"
                />
              ) : (
                <div className="grid aspect-[16/10] w-full place-items-center bg-elevated transition-[filter] duration-150 group-hover:brightness-110">
                  <CraftIcon className="size-12 text-muted" strokeWidth={1.25} aria-hidden />
                </div>
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-bg/80 px-2 py-1.5 text-xs text-fg">
                {craftCaption}
              </span>
            </button>
          </div>
        ) : null}

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Position</dt>
          <dd className="font-mono text-xs tabular-nums">{formatCoords(fix.lat, fix.lng)}</dd>
          <dt className="text-muted">Place</dt>
          <dd>{fix.label}</dd>
          <dt className="text-muted">Current Location</dt>
          <dd>{fix.city}</dd>
          <dt className="text-muted">In office</dt>
          <dd className="font-mono text-xs">{leader.since}</dd>
        </dl>

        {trip ? (
          <>
            <h3 className="mt-5 font-mono text-xs tracking-[0.18em] text-muted uppercase">
              Active movement
            </h3>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-baseline gap-x-3" aria-label={fromAria}>
                <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                  <span className="shrink-0 text-muted">From</span>
                  <span className="truncate">{fromCity}</span>
                </div>
                {elapsed !== null ? (
                  <span
                    className="shrink-0 font-mono text-xs tabular-nums text-alert"
                    aria-hidden={fromAria ? true : undefined}
                  >
                    {formatDurationMinutes(elapsed)}
                  </span>
                ) : null}
              </div>
              <div className="flex items-baseline gap-x-3" aria-label={toAria}>
                <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                  <span className="shrink-0 text-muted">To</span>
                  <span className="truncate">{toCity}</span>
                </div>
                {remaining !== null ? (
                  <span
                    className="shrink-0 font-mono text-xs tabular-nums text-live"
                    aria-hidden={toAria ? true : undefined}
                  >
                    {formatDurationMinutes(remaining)}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-sm">{trip.title}</p>
            <p className="mt-1 text-xs text-muted">
              {sourceLabel(trip.source)} · {confidenceLabel(trip.confidence)}
            </p>
          </>
        ) : null}

        <h3 className="mt-5 font-mono text-xs tracking-[0.18em] text-muted uppercase">History</h3>
        <ol className="mt-2 space-y-2">
          {track.map((w) => (
            <li key={`${w.t}-${w.label}`} className="grid grid-cols-[auto_1fr] gap-2">
              <span className="font-mono text-xs text-muted tabular-nums">{formatUtc(w.t)}</span>
              <span>
                <span className="block text-xs">{w.label}</span>
                <span className="block font-mono text-xs text-subtle">
                  {w.city} · {sourceLabel(w.source)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {craftKind ? (
        <CraftOverlay
          open={craftOpen}
          onClose={() => setCraftOpen(false)}
          kind={craftKind}
          aircraft={leader.aircraft}
          vessel={vessel}
          trip={trip}
        />
      ) : null}
    </div>
  );
}
