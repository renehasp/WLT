import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VESSELS } from "@/lib/meridian/data";
import { getTrack } from "@/lib/meridian/engine";
import {
  confidenceLabel,
  formatCoords,
  formatUtc,
  modeLabel,
  sourceLabel,
} from "@/lib/meridian/format";
import { useMeridian } from "@/lib/meridian/store";
import { useWorld } from "@/lib/meridian/use-world";

export function DetailPanel() {
  const selectedId = useMeridian((s) => s.selectedId);
  const select = useMeridian((s) => s.select);
  const clock = useMeridian((s) => s.clock);
  const world = useWorld();
  const fix = world.allFixes.find((f) => f.leader.id === selectedId);
  if (!fix) return null;
  const { leader } = fix;
  const track = getTrack(leader.id).filter(
    (w) => w.t >= clock - 10 * 86_400_000 && w.t <= clock + 10 * 86_400_000,
  );
  const vessel = VESSELS.find((v) => v.id === leader.vesselId);

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
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Position</dt>
          <dd className="font-mono text-xs tabular-nums">{formatCoords(fix.lat, fix.lng)}</dd>
          <dt className="text-muted">Place</dt>
          <dd>{fix.label}</dd>
          <dt className="text-muted">City</dt>
          <dd>{fix.city}</dd>
          <dt className="text-muted">In office</dt>
          <dd className="font-mono text-xs">{leader.since}</dd>
        </dl>
        {leader.aircraft ? (
          <>
            <h3 className="mt-5 font-mono text-xs tracking-[0.18em] text-muted uppercase">VIP aircraft</h3>
            <p className="mt-2 text-sm">
              {leader.aircraft.callsign}
              <span className="ml-2 font-mono text-muted">{leader.aircraft.tail}</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {leader.aircraft.name} · {leader.aircraft.operator}
            </p>
            <p className="mt-2 text-xs text-muted">{leader.aircraft.note}</p>
          </>
        ) : null}
        {vessel ? (
          <>
            <h3 className="mt-5 font-mono text-xs tracking-[0.18em] text-muted uppercase">Associated vessel</h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <p className="text-sm">{vessel.name}</p>
              <Badge tone="warn">Modeled</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">{vessel.note}</p>
          </>
        ) : null}
        {fix.trip ? (
          <>
            <h3 className="mt-5 font-mono text-xs tracking-[0.18em] text-muted uppercase">Active movement</h3>
            <p className="mt-2 text-sm">{fix.trip.title}</p>
            <p className="mt-1 font-mono text-xs text-muted">
              {fix.trip.depart.place.city} → {fix.trip.arrive.place.city}
            </p>
            <p className="mt-1 text-xs text-muted">
              {sourceLabel(fix.trip.source)} · {confidenceLabel(fix.trip.confidence)}
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
    </div>
  );
}
