import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMeridian } from "@/lib/meridian/store";

export function AboutDialog() {
  const open = useMeridian((s) => s.aboutOpen);
  const setAboutOpen = useMeridian((s) => s.setAboutOpen);
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-bg/70 p-4">
      <div
        role="dialog"
        aria-labelledby="about-title"
        className="w-full max-w-lg rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="about-title" className="font-display text-2xl italic">
              WLT
            </h2>
            <p className="mt-1 text-sm text-muted">World Leaders Tracker</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setAboutOpen(false)}>
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
