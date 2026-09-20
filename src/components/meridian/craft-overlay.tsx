import { useEffect, useId, useRef } from "react";
import { Plane, Ship, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confidenceLabel, sourceLabel } from "@/lib/meridian/format";
import type { Aircraft, Trip, Vessel } from "@/lib/meridian/types";

function focusables(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

export type CraftOverlayProps = {
  open: boolean;
  onClose: () => void;
  kind: "air" | "sea";
  aircraft?: Aircraft;
  vessel?: Vessel;
  trip?: Trip;
};

function CraftVisual({
  kind,
  imageUrl,
  label,
}: {
  kind: "air" | "sea";
  imageUrl?: string;
  label: string;
}) {
  const Icon = kind === "air" ? Plane : Ship;
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={label} className="aspect-[16/10] w-full rounded-md object-cover" />
    );
  }
  return (
    <div className="grid aspect-[16/10] w-full place-items-center rounded-md bg-elevated" aria-hidden>
      <Icon className="size-16 text-muted" strokeWidth={1.25} />
    </div>
  );
}

export function CraftOverlay({ open, onClose, kind, aircraft, vessel, trip }: CraftOverlayProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = focusables(panelRef.current);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panelRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    const prev = restoreRef.current;
    if (prev?.isConnected) prev.focus();
    restoreRef.current = null;
  }, [open]);

  if (!open) return null;

  const title = kind === "air" ? (aircraft?.name ?? "Aircraft") : (vessel?.name ?? "Vessel");
  const imageUrl = kind === "air" ? aircraft?.imageUrl : vessel?.imageUrl;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mx-4 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-2xl leading-tight italic">
            {title}
          </h2>
          <Button
            ref={closeRef}
            variant="ghost"
            size="icon-sm"
            aria-label="Close craft details"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-4">
          <CraftVisual kind={kind} imageUrl={imageUrl} label={title} />
        </div>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          {kind === "air" && aircraft ? (
            <>
              <dt className="text-muted">Name</dt>
              <dd>{aircraft.name}</dd>
              <dt className="text-muted">Callsign</dt>
              <dd className="font-mono text-xs">{aircraft.callsign}</dd>
              <dt className="text-muted">Tail</dt>
              <dd className="font-mono text-xs">{aircraft.tail}</dd>
              <dt className="text-muted">ICAO24</dt>
              <dd className="font-mono text-xs">{aircraft.icao24}</dd>
              <dt className="text-muted">Operator</dt>
              <dd>{aircraft.operator}</dd>
              <dt className="text-muted">Home</dt>
              <dd>{aircraft.home.city}</dd>
              {aircraft.note ? (
                <>
                  <dt className="text-muted">Note</dt>
                  <dd className="text-muted">{aircraft.note}</dd>
                </>
              ) : null}
            </>
          ) : null}
          {kind === "sea" && vessel ? (
            <>
              <dt className="text-muted">Name</dt>
              <dd>{vessel.name}</dd>
              <dt className="text-muted">Flag</dt>
              <dd>{vessel.flag}</dd>
              {vessel.mmsi ? (
                <>
                  <dt className="text-muted">MMSI</dt>
                  <dd className="font-mono text-xs">{vessel.mmsi}</dd>
                </>
              ) : null}
              <dt className="text-muted">Operator</dt>
              <dd>{vessel.operator}</dd>
              {vessel.note ? (
                <>
                  <dt className="text-muted">Note</dt>
                  <dd className="text-muted">{vessel.note}</dd>
                </>
              ) : null}
            </>
          ) : null}
        </dl>

        {trip ? (
          <p className="mt-4 text-xs text-muted">
            Active trip · {sourceLabel(trip.source)} · {confidenceLabel(trip.confidence)}
          </p>
        ) : null}
        <p className="mt-3 font-mono text-xs text-subtle">Photo · Wikimedia Commons</p>
      </div>
    </div>
  );
}
