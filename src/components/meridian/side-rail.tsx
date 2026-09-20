import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { REGIONS } from "@/lib/meridian/data";
import { formatTime, modeLabel, sourceLabel } from "@/lib/meridian/format";
import { useMeridian, type RailTab } from "@/lib/meridian/store";
import { useWorld } from "@/lib/meridian/use-world";
import { cn } from "@/lib/utils";
import type { LeaderFix } from "@/lib/meridian/types";

const TABS: { id: RailTab; label: string }[] = [
  { id: "roster", label: "Roster" },
  { id: "board", label: "Board" },
  { id: "fleet", label: "Fleet" },
];

function statusTone(mode: LeaderFix["mode"]) {
  if (mode === "airborne") return "live" as const;
  if (mode === "at-sea") return "solid" as const;
  if (mode === "ground") return "warn" as const;
  return "mute" as const;
}

export function SideRail() {
  const railTab = useMeridian((s) => s.railTab);
  const setRailTab = useMeridian((s) => s.setRailTab);
  const query = useMeridian((s) => s.query);
  const setQuery = useMeridian((s) => s.setQuery);
  const region = useMeridian((s) => s.region);
  const setRegion = useMeridian((s) => s.setRegion);
  const selectedId = useMeridian((s) => s.selectedId);
  const select = useMeridian((s) => s.select);
  const mobileRail = useMeridian((s) => s.mobileRail);
  const setMobileRail = useMeridian((s) => s.setMobileRail);
  const world = useWorld();
  const clock = useMeridian((s) => s.clock);

  const body = (
    <aside className="flex h-full min-h-0 w-full flex-col rounded-xl bg-surface/95 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between px-3 pt-3">
        <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">Intelligence</p>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-sm text-muted lg:hidden"
          aria-label="Close"
          onClick={() => setMobileRail(false)}
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1 p-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRailTab(tab.id)}
            className={cn(
              "h-8 rounded-md font-mono text-xs tracking-wide uppercase",
              "transition-[background-color,color] duration-150 ease-out",
              railTab === tab.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {railTab === "roster" ? (
        <>
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-subtle" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search leaders"
                className="h-9 pl-9"
                aria-label="Search leaders"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegion(r.id)}
                  className={cn(
                    "h-7 rounded-full px-2.5 font-mono text-xs tracking-wide uppercase",
                    "transition-[background-color,color] duration-150 ease-out",
                    region === r.id ? "bg-primary text-primary-fg" : "bg-elevated text-muted hover:text-fg",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <ul className="meridian-scroll min-h-0 flex-1 overflow-y-auto p-2">
            {world.fixes.map((fix) => (
              <li key={fix.leader.id}>
                <button
                  type="button"
                  onClick={() => {
                    select(fix.leader.id);
                    setMobileRail(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left",
                    "transition-[background-color] duration-150 ease-out",
                    selectedId === fix.leader.id ? "bg-elevated" : "hover:bg-elevated/60",
                  )}
                >
                  <img
                    src={`https://flagcdn.com/w40/${fix.leader.iso}.png`}
                    alt=""
                    className="mt-0.5 size-5 rounded-xs object-cover"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{fix.leader.shortName}</span>
                      <Badge tone={statusTone(fix.mode)}>{modeLabel(fix.mode)}</Badge>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {fix.leader.title} · {fix.city}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {railTab === "board" ? (
        <div className="meridian-scroll min-h-0 flex-1 overflow-y-auto p-3">
          <p className="mb-2 font-mono text-xs tracking-[0.18em] text-muted uppercase">
            Movement board · {formatTime(clock)}
          </p>
          {world.board.length === 0 ? (
            <p className="text-sm text-muted">No active movements in this window.</p>
          ) : (
            <ul className="space-y-1">
              {world.board.map((row) => (
                <li
                  key={row.id}
                  className="grid grid-cols-[72px_1fr_auto] items-baseline gap-2 rounded-md bg-elevated/70 px-2 py-2"
                >
                  <span
                    className={cn(
                      "font-mono text-xs tracking-wider",
                      row.status === "ADS-B" || row.status === "MODELED" ? "text-live" : "text-muted",
                    )}
                  >
                    {row.status}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{row.principal}</span>
                    <span className="block truncate font-mono text-xs text-muted">
                      {row.ident} · {row.route}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-muted tabular-nums">{row.eta}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      {railTab === "fleet" ? (
        <div className="meridian-scroll min-h-0 flex-1 overflow-y-auto p-3">
          <p className="mb-2 font-mono text-xs tracking-[0.18em] text-muted uppercase">Known VIP airframes</p>
          <ul className="space-y-1">
            {world.fleet.map((row) => (
              <li key={row.aircraft.id}>
                <button
                  type="button"
                  onClick={() => row.leaderId && select(row.leaderId)}
                  className="flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-left hover:bg-elevated/60"
                >
                  <span>
                    <span className="block text-sm">
                      {row.aircraft.callsign}
                      <span className="ml-2 font-mono text-xs text-muted">{row.aircraft.tail}</span>
                    </span>
                    <span className="block text-xs text-muted">
                      {row.leaderName} · {row.aircraft.name}
                    </span>
                  </span>
                  <Badge
                    tone={row.status === "adsb" ? "live" : row.status === "modeled" ? "warn" : "mute"}
                  >
                    {row.label}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Separator />
      <div className="meridian-scroll max-h-40 overflow-y-auto p-3">
        <p className="mb-2 font-mono text-xs tracking-[0.18em] text-muted uppercase">Feed</p>
        <ul className="space-y-2">
          {world.feed.slice(0, 6).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => item.leaderId && select(item.leaderId)}
              >
                <p className="text-xs text-fg">{item.title}</p>
                <p className="font-mono text-xs text-muted">
                  {formatTime(item.t)} · {sourceLabel(item.source)} · {item.detail}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );

  return (
    <>
      <div className="pointer-events-auto hidden h-full min-h-0 w-80 lg:block">{body}</div>
      {mobileRail ? (
        <div className="pointer-events-auto absolute inset-0 z-30 bg-bg/70 p-3 lg:hidden">
          <div className="h-full">{body}</div>
        </div>
      ) : null}
    </>
  );
}
