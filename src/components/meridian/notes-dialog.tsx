import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHANGE_KIND_LABEL, RELEASES, type ChangeKind } from "@/lib/meridian/changelog";
import { APP_VERSION, versionLabel } from "@/lib/meridian/version";
import { useMeridian } from "@/lib/meridian/store";

function focusables(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

function kindTone(kind: ChangeKind) {
  if (kind === "added") return "live" as const;
  if (kind === "fixed") return "warn" as const;
  return "mute" as const;
}

export function NotesDialog() {
  const open = useMeridian((s) => s.notesOpen);
  const setNotesOpen = useMeridian((s) => s.setNotesOpen);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setNotesOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = focusables(panelRef.current);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panelRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setNotesOpen]);

  useEffect(() => {
    if (open) return;
    const prev = restoreRef.current;
    if (prev?.isConnected) prev.focus();
    restoreRef.current = null;
  }, [open]);

  if (!open) return null;

  const close = () => setNotesOpen(false);

  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-bg/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-[min(36rem,85dvh)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 id={titleId} className="font-display text-2xl italic">
              Release notes
            </h2>
            <p className="mt-1 font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {versionLabel()} · running {APP_VERSION}
            </p>
          </div>
          <Button ref={closeRef} variant="ghost" size="icon-sm" aria-label="Close release notes" onClick={close}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="meridian-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border px-5 py-4">
          <ol className="space-y-6">
            {RELEASES.map((rel) => (
              <li key={rel.version}>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono text-xs tracking-[0.18em] text-fg uppercase">V {rel.version}</p>
                  <p className="font-mono text-xs text-subtle tabular-nums">{rel.date}</p>
                </div>
                <p className="mt-1 text-sm">{rel.title}</p>
                {rel.changes.map((group) => (
                  <div key={group.kind} className="mt-3">
                    <Badge tone={kindTone(group.kind)}>{CHANGE_KIND_LABEL[group.kind]}</Badge>
                    <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </li>
            ))}
          </ol>
        </div>
        <p className="border-t border-border px-5 py-3 font-mono text-xs text-subtle">
          Space play · L live · N notes
        </p>
      </div>
    </div>
  );
}
