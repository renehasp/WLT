import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMeridian } from "@/lib/meridian/store";

function focusables(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

export function AboutDialog() {
  const open = useMeridian((s) => s.aboutOpen);
  const setAboutOpen = useMeridian((s) => s.setAboutOpen);
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
        setAboutOpen(false);
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
  }, [open, setAboutOpen]);

  useEffect(() => {
    if (open) return;
    const prev = restoreRef.current;
    if (prev?.isConnected) prev.focus();
    restoreRef.current = null;
  }, [open]);

  if (!open) return null;

  const close = () => setAboutOpen(false);

  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-bg/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="font-display text-2xl italic">
              WLT
            </h2>
            <p className="mt-1 text-sm text-muted">World Leaders Tracker</p>
          </div>
          <Button
            ref={closeRef}
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={close}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Positions are fused from public official calendars, open ADS-B (adsb.lol, with OpenSky
            as fallback), AIS-style vessel reports, and modeled great-circle tracks when transponders
            are dark. The basemap is OpenStreetMap — no tile key. Moving principals show a red flown
            track and a green remaining track.
          </p>
          <p>
            Heads of state often fly without a public squawk. When a live contact matches a known
            VIP airframe, the badge reads ADS-B. “ADS-B on” means the feed is up but those tails are
            silent. Event pins open the wire: public conferences, closed bilaterals, and unscheduled
            holds drawn from diaries and OSINT — not classified sources.
          </p>
          <p>
            This is not GPS, not classified tracking, and not an official source. Scrub the timeline to
            replay UNGA week — 6 Sep to 28 Sep 2026 — and watch the Pacific and Atlantic corridors fill.
          </p>
        </div>
      </div>
    </div>
  );
}
