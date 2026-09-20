import { useEffect, useState } from "react";
import { MapCanvas } from "./map-canvas";
import { TopBar } from "./top-bar";
import { SideRail } from "./side-rail";
import { Timeline } from "./timeline";
import { DetailPanel } from "./detail";
import { LayerControls } from "./layer-controls";
import { SourceLegend, TrailLegend } from "./map-chrome-legends";
import { EventWire } from "./event-wire";
import { AboutDialog } from "./about";
import { NotesDialog } from "./notes-dialog";
import { useMeridian } from "@/lib/meridian/store";
import { fetchVipSky } from "@/lib/meridian/opensky";
import { applyShareSearch, buildShareSearch } from "@/lib/meridian/share-url";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell() {
  const playing = useMeridian((s) => s.playing);
  const followLive = useMeridian((s) => s.followLive);
  const selectedId = useMeridian((s) => s.selectedId);
  const selectedEventId = useMeridian((s) => s.selectedEventId);
  const clock = useMeridian((s) => s.clock);
  const [shareReady, setShareReady] = useState(false);

  useEffect(() => {
    const hadShare = applyShareSearch(window.location.search);
    if (!hadShare) useMeridian.getState().goLive();
    setShareReady(true);
  }, []);

  useEffect(() => {
    if (!shareReady || playing) return;
    const s = useMeridian.getState();
    const next = buildShareSearch({
      clock: s.clock,
      live: s.followLive,
      id: s.selectedId ?? undefined,
      eventId: s.selectedEventId ?? undefined,
    });
    const url = `${window.location.pathname}${next}${window.location.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [shareReady, playing, followLive, selectedId, selectedEventId, clock]);

  useEffect(() => {
    if (!playing && !followLive) return;
    let raf = 0;
    let last = performance.now();
    let lastPub = 0;
    const loop = (now: number) => {
      const interval = playing ? 80 : 1000;
      if (now - lastPub >= interval) {
        useMeridian.getState().tick(now - last);
        lastPub = now;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, followLive]);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const snap = await fetchVipSky();
        if (!cancelled) useMeridian.getState().setSky(snap);
      } catch {
        /* OpenSky is optional */
      }
    };
    void pull();
    const id = window.setInterval(pull, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useMeridian.getState();
      if (s.notesOpen || s.aboutOpen) {
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          s.setNotesOpen(false);
        }
        return;
      }
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        s.togglePlay();
        return;
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        s.goLive();
        return;
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        s.setNotesOpen(!s.notesOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <TooltipProvider>
      <div className="meridian-shell relative w-full overflow-hidden bg-bg text-fg">
        <MapCanvas />
        <TopBar />
        <div className="pointer-events-none absolute inset-x-0 top-20 bottom-0 z-10 flex p-3 pt-1 md:p-4 md:pt-2">
          <SideRail />
          <div className="flex min-w-0 flex-1 flex-col justify-between pl-0 lg:pl-3">
            <div className="flex max-w-full flex-wrap items-start justify-end gap-3">
              <div className="hidden min-w-0 sm:block">
                <EventWire />
              </div>
              {selectedId ? <DetailPanel /> : null}
              <div className="hidden self-start sm:flex sm:flex-col sm:items-end sm:gap-2">
                <LayerControls />
                <TrailLegend />
                <SourceLegend />
              </div>
            </div>
            <div className="pt-3">
              <div className="mb-2 flex flex-col gap-2 sm:hidden">
                <EventWire />
                <div className="flex flex-col items-end gap-2">
                  <LayerControls horizontal />
                  <TrailLegend />
                  <SourceLegend />
                </div>
              </div>
              <Timeline />
            </div>
          </div>
        </div>
        <AboutDialog />
        <NotesDialog />
      </div>
    </TooltipProvider>
  );
}
