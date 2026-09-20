import { useMemo } from "react";
import { LEADERS } from "./data";
import {
  allHeadingArcs,
  allTrackCollection,
  allVessels,
  boardRows,
  eventsAt,
  feedItems,
  fleetAt,
  worldFixes,
} from "./engine";
import { clusterMeetings, meetingsAround } from "./meetings";
import { useMeridian } from "./store";

const TRACKS = allTrackCollection();

export function useWorld() {
  const clock = useMeridian((s) => s.clock);
  const sky = useMeridian((s) => s.sky);
  const query = useMeridian((s) => s.query);
  const region = useMeridian((s) => s.region);
  const selectedId = useMeridian((s) => s.selectedId);

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = new Set(
      LEADERS.filter((l) => {
        if (region !== "all" && l.region !== region) return false;
        if (!q) return true;
        return (
          l.name.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q) ||
          l.shortName.toLowerCase().includes(q) ||
          l.title.toLowerCase().includes(q)
        );
      }).map((l) => l.id),
    );
    const allFixes = worldFixes(clock, sky);
    const fixes = allFixes.filter((f) => visible.has(f.leader.id));
    const meetings = meetingsAround(clock);
    const arcs = allHeadingArcs(fixes, selectedId);
    return {
      fixes,
      allFixes,
      fleet: fleetAt(clock, sky),
      vessels: allVessels(clock),
      board: boardRows(clock, sky),
      feed: feedItems(clock),
      events: eventsAt(clock),
      meetings,
      clusters: clusterMeetings(meetings),
      tracks: TRACKS,
      trails: arcs,
      visible,
    };
  }, [clock, sky, query, region, selectedId]);
}
