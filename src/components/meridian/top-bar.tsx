import { Info, Menu, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMeridian } from "@/lib/meridian/store";
import { formatUtc } from "@/lib/meridian/format";
import { useWorld } from "@/lib/meridian/use-world";

export function TopBar() {
  const clock = useMeridian((s) => s.clock);
  const followLive = useMeridian((s) => s.followLive);
  const sky = useMeridian((s) => s.sky);
  const goLive = useMeridian((s) => s.goLive);
  const setAboutOpen = useMeridian((s) => s.setAboutOpen);
  const setMobileRail = useMeridian((s) => s.setMobileRail);
  const world = useWorld();
  const airborne = world.fixes.filter((f) => f.mode === "airborne").length;
  const adsb = world.fleet.filter((f) => f.status === "adsb").length;

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
            <Badge
              tone={
                adsb
                  ? "live"
                  : sky?.status === "unreachable"
                    ? "warn"
                    : sky?.status === "live" || sky?.status === "dark"
                      ? "live"
                      : "mute"
              }
            >
              {adsb
                ? `${adsb} ADS-B`
                : sky?.status === "live"
                  ? "ADS-B dark"
                  : sky?.status === "dark"
                    ? "ADS-B on"
                    : sky?.status === "unreachable"
                      ? "ADS-B retry"
                      : "ADS-B"}
            </Badge>
            <Button
              variant={followLive ? "live" : "outline"}
              size="sm"
              onClick={goLive}
              className="gap-1.5"
            >
              <Radio className="size-3.5" />
              Live
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="About WLT"
              onClick={() => setAboutOpen(true)}
            >
              <Info className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
