import { useState } from "react";
import { Info, Link2, Menu, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useMeridian } from "@/lib/meridian/store";
import { formatUtc } from "@/lib/meridian/format";
import { useWorld } from "@/lib/meridian/use-world";
import { currentShareUrl } from "@/lib/meridian/share-url";
import { APP_VERSION } from "@/lib/meridian/version";

const ADSB_TOOLTIP =
  "Open ADS-B feed status: live VIP contacts when matched; quiet when the feed is up but those tails are silent.";

function adsbBadge(adsb: number, status: string | undefined) {
  if (adsb > 0) {
    return { tone: "live" as const, label: `${adsb} ADS-B` };
  }
  if (status === "unreachable") {
    return { tone: "warn" as const, label: "ADS-B retry" };
  }
  if (status === "dark" || status === "live") {
    return { tone: "live" as const, label: "ADS-B on · quiet" };
  }
  return { tone: "mute" as const, label: "ADS-B" };
}

export function TopBar() {
  const clock = useMeridian((s) => s.clock);
  const followLive = useMeridian((s) => s.followLive);
  const sky = useMeridian((s) => s.sky);
  const goLive = useMeridian((s) => s.goLive);
  const setAboutOpen = useMeridian((s) => s.setAboutOpen);
  const setNotesOpen = useMeridian((s) => s.setNotesOpen);
  const setMobileRail = useMeridian((s) => s.setMobileRail);
  const world = useWorld();
  const airborne = world.fixes.filter((f) => f.mode === "airborne").length;
  const adsb = world.fleet.filter((f) => f.status === "adsb").length;
  const badge = adsbBadge(adsb, sky?.status);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = currentShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy link", url);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 md:p-4">
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-surface/95 px-3 py-2 shadow-[var(--shadow-border)] md:px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Open roster"
            onClick={() => setMobileRail(true)}
          >
            <Menu className="size-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl italic leading-none tracking-tight md:text-2xl">
                WLT
              </span>
              <Tooltip content="Release notes">
                <button
                  type="button"
                  className="inline-flex h-7 items-center rounded-md px-1.5 font-mono text-sm tabular-nums text-live transition-colors duration-150 ease-out hover:bg-elevated"
                  aria-label={`WLT version ${APP_VERSION}, open release notes`}
                  onClick={() => setNotesOpen(true)}
                >
                  {APP_VERSION}
                </button>
              </Tooltip>
              <span className="hidden font-mono text-xs tracking-[0.22em] text-muted uppercase sm:inline">
                World Leaders Tracker
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-muted tabular-nums">{formatUtc(clock)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge tone="mute" className="hidden sm:inline-flex">
              {airborne} airborne
            </Badge>
            <Tooltip content={ADSB_TOOLTIP}>
              <span className="inline-flex" title={ADSB_TOOLTIP}>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </span>
            </Tooltip>
            <Button variant={followLive ? "live" : "outline"} size="sm" onClick={goLive} className="gap-1.5">
              <Radio className="size-3.5" />
              Live
            </Button>
            <Tooltip content={copied ? "Copied" : "Copy share link"}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={copied ? "Link copied" : "Copy share link"}
                onClick={() => void copyLink()}
              >
                <Link2 className="size-4" />
              </Button>
            </Tooltip>
            <Button variant="ghost" size="icon-sm" aria-label="About WLT" onClick={() => setAboutOpen(true)}>
              <Info className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
