import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "mute",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "mute" | "live" | "warn" | "alert" | "solid";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs tracking-wider uppercase",
        tone === "mute" && "bg-elevated text-muted",
        tone === "live" && "bg-live/15 text-live",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "alert" && "bg-alert/15 text-alert",
        tone === "solid" && "bg-primary/15 text-primary",
        className,
      )}
      {...props}
    />
  );
}
