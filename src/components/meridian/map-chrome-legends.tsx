import { Badge } from "@/components/ui/badge";
import { useMeridian } from "@/lib/meridian/store";
import { cn } from "@/lib/utils";

/** Non-button trail color chip — shown when Leaders or Tracks are on. */
export function TrailLegend({ className }: { className?: string }) {
  const layers = useMeridian((s) => s.layers);
  if (!layers.leaders && !layers.tracks) return null;

  return (
    <div
      role="group"
      aria-label="Track colors: flown behind, ahead remaining"
      className={cn(
        "pointer-events-auto flex items-center gap-2.5 rounded-xl bg-surface/95 px-2.5 py-1.5",
        "text-[11px] text-muted shadow-[var(--shadow-border)] sm:text-xs",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: "#c07060" }} aria-hidden />
        Flown
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: "#7d9a8c" }} aria-hidden />
        Ahead
      </span>
    </div>
  );
}

/** ADS-B vs Modeled source key — meaning in text, not color alone. */
export function SourceLegend({ className }: { className?: string }) {
  return (
    <div
      role="group"
      aria-label="Contact source legend"
      className={cn(
        "pointer-events-auto flex items-center gap-1.5 rounded-xl bg-surface/95 px-2 py-1.5",
        "shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <Badge tone="live">ADS-B</Badge>
      <Badge tone="warn">Modeled</Badge>
    </div>
  );
}
