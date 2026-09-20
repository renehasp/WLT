import { Calendar, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { meetingById, meetingsAround, meetingStatus } from "@/lib/meridian/meetings";
import {
  confidenceLabel,
  formatTime,
  formatUtc,
  sourceLabel,
  visibilityLabel,
} from "@/lib/meridian/format";
import { useMeridian, type WireFilter } from "@/lib/meridian/store";
import type { Meeting, MeetingVisibility } from "@/lib/meridian/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: WireFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "public", label: "Public" },
  { id: "closed", label: "Closed" },
  { id: "unscheduled", label: "Unscheduled" },
];

function visTone(v: MeetingVisibility) {
  if (v === "public") return "live" as const;
  if (v === "unscheduled") return "warn" as const;
  return "mute" as const;
}

function Row({ ev, clock, active }: { ev: Meeting; clock: number; active: boolean }) {
  const status = meetingStatus(ev, clock);
  const openEvent = useMeridian((s) => s.openEvent);

  return (
    <button
      type="button"
      onClick={() => openEvent(ev.id)}
      className={cn(
        "w-full rounded-md px-2.5 py-2 text-left transition-colors duration-150 ease-out",
        active ? "bg-elevated" : "hover:bg-elevated",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={"font-mono text-xs tabular-nums text-muted"}>{formatTime(Date.parse(ev.t))}</span>
        <Badge tone={status === "live" ? "live" : visTone(ev.visibility)}>
          {status === "live" ? "Now" : visibilityLabel(ev.visibility)}
        </Badge>
        <span className="ml-auto font-mono text-xs tracking-wider text-subtle uppercase">
          {sourceLabel(ev.source)}
        </span>
      </div>
      <p className={"mt-1 text-sm leading-snug"}>{ev.title}</p>
      <p className={"mt-0.5 text-xs text-muted"}>{ev.venue}</p>
    </button>
  );
}

function EventCard({ ev, clock }: { ev: Meeting; clock: number }) {
  const status = meetingStatus(ev, clock);
  const openEvent = useMeridian((s) => s.openEvent);
  const selectLeader = useMeridian((s) => s.selectLeader);
  const start = Date.parse(ev.t);
  const end = ev.tEnd ? Date.parse(ev.tEnd) : null;

  return (
    <div className="border-b border-border px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={"font-display text-xl leading-tight italic"}>{ev.title}</p>
          <p className="mt-1 text-sm text-muted">
            {ev.venue} · {ev.place.city}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close event" onClick={() => openEvent(null)}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone={status === "live" ? "live" : visTone(ev.visibility)}>
          {status === "live" ? "Now" : visibilityLabel(ev.visibility)}
        </Badge>
        <Badge tone={"solid"}>{sourceLabel(ev.source)}</Badge>
        <Badge>{confidenceLabel(ev.confidence)}</Badge>
      </div>
      <p className={"mt-2 text-sm leading-relaxed text-muted"}>{ev.detail}</p>
      <p className="mt-2 font-mono text-xs tabular-nums text-subtle">
        {formatUtc(start)}
        {end ? ` – ${formatTime(end)}` : ""}
      </p>
      {ev.principals.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ev.principals.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectLeader(p.id, { keepEvent: true })}
              className="rounded-full bg-elevated px-2.5 py-1 font-mono text-xs tracking-wide uppercase transition-colors duration-150 ease-out hover:text-fg"
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-subtle">No named principal confirmed.</p>
      )}
    </div>
  );
}

export function EventWire() {
  const clock = useMeridian((s) => s.clock);
  const open = useMeridian((s) => s.wireOpen);
  const setOpen = useMeridian((s) => s.setWireOpen);
  const filter = useMeridian((s) => s.wireFilter);
  const setFilter = useMeridian((s) => s.setWireFilter);
  const selectedEventId = useMeridian((s) => s.selectedEventId);
  const all = meetingsAround(clock);
  const rows = filter === "all" ? all : all.filter((e) => e.visibility === filter);
  const liveN = all.filter((e) => meetingStatus(e, clock) === "live").length;
  const next = all.find((e) => meetingStatus(e, clock) !== "ended");
  const selected = meetingById(selectedEventId);

  return (
    <div className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-xl bg-surface/95 shadow-[var(--shadow-border)] sm:w-80">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Calendar className="size-3.5 text-live" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">Events</p>
          <p className="truncate text-sm">
            {selected
              ? selected.title
              : liveN
                ? `${liveN} live`
                : next
                  ? next.title
                  : "No upcoming holds"}
            <span className="text-muted"> · {all.length}</span>
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted transition-transform duration-150 ease-out",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <>
          {selected ? <EventCard ev={selected} clock={clock} /> : null}
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-7 rounded-md font-mono text-xs tracking-wide uppercase",
                  "transition-colors duration-150 ease-out",
                  filter === f.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="meridian-scroll max-h-56 overflow-y-auto border-t border-border px-1 py-1 sm:max-h-72">
            {rows.length ? (
              rows.map((ev) => (
                <Row key={ev.id} ev={ev} clock={clock} active={ev.id === selectedEventId} />
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-muted">Nothing in this window.</p>
            )}
          </div>
          <p className="border-t border-border px-3 py-2 font-mono text-xs text-subtle">
            Tap a pin or a row. Principals open the roster card.
          </p>
        </>
      ) : null}
    </div>
  );
}
