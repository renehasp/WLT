import { Flag, Globe2, Plane, Route, Ship, Waypoints } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useMeridian, type Layers } from "@/lib/meridian/store";
import { cn } from "@/lib/utils";

const ITEMS: { key: keyof Layers; label: string; icon: typeof Flag }[] = [
  { key: "leaders", label: "Leaders", icon: Flag },
  { key: "aircraft", label: "VIP aircraft", icon: Plane },
  { key: "vessels", label: "Vessels", icon: Ship },
  { key: "tracks", label: "Tracks", icon: Route },
  { key: "graticule", label: "Grid", icon: Globe2 },
  { key: "events", label: "Events", icon: Waypoints },
];

export function LayerControls({ horizontal = false }: { horizontal?: boolean }) {
  const layers = useMeridian((s) => s.layers);
  const setLayer = useMeridian((s) => s.setLayer);

  return (
    <div
      className={cn(
        "pointer-events-auto rounded-xl bg-surface/95 p-1.5 shadow-[var(--shadow-border)]",
        horizontal ? "flex flex-row gap-1" : "flex flex-col gap-1",
      )}
    >
      {ITEMS.map((item) => {
        const on = layers[item.key];
        const Icon = item.icon;
        return (
          <Tooltip key={item.key} content={item.label} side={horizontal ? "top" : "left"}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={item.label}
              onClick={() => setLayer(item.key, !on)}
              className={cn(
                "grid size-9 place-items-center rounded-md text-muted",
                "transition-[background-color,color] duration-150 ease-out",
                on ? "bg-elevated text-fg" : "hover:text-fg",
              )}
            >
              <Icon className="size-4" strokeWidth={1.6} />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
