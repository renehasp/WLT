import { useRef, type PointerEvent } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RANGE_END, RANGE_START } from "@/lib/meridian/types";
import { formatDay, formatUtc } from "@/lib/meridian/format";
import { timelineMarks } from "@/lib/meridian/engine";
import { useMeridian } from "@/lib/meridian/store";
import { cn } from "@/lib/utils";

const MARKS = timelineMarks();
const SPAN = RANGE_END - RANGE_START;
const SPEEDS = [
  { label: "1h", value: 3600_000 },
  { label: "3h", value: 3 * 3600_000 },
  { label: "12h", value: 12 * 3600_000 },
];

const DAY_TICKS: number[] = [];
for (let t = RANGE_START; t <= RANGE_END; t += 86_400_000) DAY_TICKS.push(t);

function ratio(t: number) {
  return (t - RANGE_START) / SPAN;
}

export function Timeline() {
  const clock = useMeridian((s) => s.clock);
  const playing = useMeridian((s) => s.playing);
  const speed = useMeridian((s) => s.speed);
  const followLive = useMeridian((s) => s.followLive);
  const setClock = useMeridian((s) => s.setClock);
  const togglePlay = useMeridian((s) => s.togglePlay);
  const setSpeed = useMeridian((s) => s.setSpeed);
  const goLive = useMeridian((s) => s.goLive);
  const trackRef = useRef<HTMLDivElement>(null);

  const seek = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const u = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setClock(RANGE_START + u * SPAN);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    seek(e.clientX);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    seek(e.clientX);
  };

  const jump = (delta: number) => setClock(clock + delta);

  return (
    <div className="pointer-events-auto w-full rounded-xl bg-surface/95 px-3 py-2.5 shadow-[var(--shadow-border)] md:px-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Back six hours" onClick={() => jump(-6 * 3600_000)}>
            <SkipBack className="size-3.5" />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
            {playing ? <Pause className="size-3.5" /> : <Play className="ml-px size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Forward six hours" onClick={() => jump(6 * 3600_000)}>
            <SkipForward className="size-3.5" />
          </Button>
        </div>
        <p className="font-mono text-xs text-fg tabular-nums">{formatUtc(clock)}</p>
        <div className="ml-auto flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setSpeed(s.value)}
              className={cn(
                "h-7 rounded-full px-2 font-mono text-xs tracking-wide",
                "transition-[background-color,color] duration-150 ease-out",
                speed === s.value ? "bg-elevated text-fg" : "text-muted hover:text-fg",
              )}
            >
              {s.label}/s
            </button>
          ))}
          <button
            type="button"
            onClick={goLive}
            className={cn(
              "h-7 rounded-full px-2.5 font-mono text-xs tracking-wide uppercase",
              followLive ? "bg-live/15 text-live" : "text-muted hover:text-fg",
            )}
          >
            Now
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Timeline"
        aria-valuemin={RANGE_START}
        aria-valuemax={RANGE_END}
        aria-valuenow={clock}
        aria-valuetext={formatUtc(clock)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") jump(-(e.shiftKey ? 6 : 1) * 3600_000);
          if (e.key === "ArrowRight") jump((e.shiftKey ? 6 : 1) * 3600_000);
        }}
        className="relative h-10 cursor-ew-resize touch-none select-none"
      >
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        {DAY_TICKS.map((t) => (
          <span
            key={t}
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-border"
            style={{ left: `${ratio(t) * 100}%` }}
          />
        ))}
        {MARKS.filter((m) => m.kind === "summit").map((m) => (
          <span
            key={m.t}
            className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: `${ratio(m.t) * 100}%` }}
            title={m.label}
          />
        ))}
        {MARKS.filter((m) => m.kind === "depart").map((m) => (
          <span
            key={`${m.t}-${m.label}`}
            className="absolute top-[calc(50%+6px)] h-1.5 w-px bg-live/70"
            style={{ left: `${ratio(m.t) * 100}%` }}
          />
        ))}
        <span
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(197,205,214,0.16)]"
          style={{ left: `${ratio(clock) * 100}%` }}
        />
        <span className="pointer-events-none absolute bottom-0 left-0 font-mono text-xs text-subtle">
          {formatDay(RANGE_START)}
        </span>
        <span className="pointer-events-none absolute right-0 bottom-0 font-mono text-xs text-subtle">
          {formatDay(RANGE_END)}
        </span>
      </div>
    </div>
  );
}
