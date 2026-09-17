import { useEffect, useState } from "react";
import {
  ChevronDown,
  Flame,
  Layers,
  Newspaper,
  Plane,
  Radio,
  Shield,
  Ship,
  Sparkles,
} from "lucide-react";
import { IMAGERY, type ImagerySource, type LiveMeta } from "@/lib/types";
import { RSF_WATCH } from "@/data/rsf-watch";
import { useAppStore, type LayerKey } from "@/lib/store";
import { cn } from "@/lib/utils";

const PICKER: ImagerySource[] = ["hires", "gmaps", "s2cloudless", "viirs", "dark", "s2"];

export function BasemapPicker() {
  const imagery = useAppStore((s) => s.imagery);
  const setImagery = useAppStore((s) => s.setImagery);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-basemap-picker]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div data-basemap-picker className="pointer-events-auto relative w-[17.5rem] max-w-[78vw]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hud-panel flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-muted">
            <Layers className="size-3" />
            Satellite imagery
          </span>
          <span className="mt-0.5 block truncate text-sm text-fg">{IMAGERY[imagery].label}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted", open && "rotate-180")} />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="hud-panel absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden py-1"
        >
          {PICKER.map((id) => {
            const meta = IMAGERY[id];
            const live = id === "viirs";
            return (
              <li key={id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={imagery === id}
                  onClick={() => {
                    setImagery(id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-raised",
                    imagery === id && "bg-raised",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm">
                    {meta.label}
                    {live ? (
                      <span className="rounded-sm bg-damage px-1 font-mono text-[9px] tracking-wider text-fg">
                        LIVE
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[11px] leading-snug text-subtle">{meta.pickerNote}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function LayerStack({
  counts,
}: {
  counts: {
    ai: number;
    reports: number;
    news: number;
    fires: number;
    feeds: number;
    flights: number;
    vessels: number;
  };
}) {
  const layers = useAppStore((s) => s.layers);
  const toggle = useAppStore((s) => s.toggleLayer);
  const rows: { key: LayerKey; label: string; count?: number; icon: typeof Flame }[] = [
    { key: "ai", label: "AI events", count: counts.ai, icon: Sparkles },
    { key: "rsfWatch", label: "RSF watch", count: RSF_WATCH.length, icon: Shield },
    { key: "reports", label: "Reports", count: counts.reports, icon: Radio },
    { key: "news", label: "News", count: counts.news, icon: Newspaper },
    { key: "firms", label: "Fire hotspots", count: counts.fires, icon: Flame },
    { key: "gdelt", label: "Forwarded intel", count: counts.feeds, icon: Radio },
    { key: "flights", label: "Flights", count: counts.flights, icon: Plane },
    { key: "vessels", label: "Vessels", count: counts.vessels, icon: Ship },
  ];
  return (
    <div className="hud-panel pointer-events-auto hidden w-[13.5rem] overflow-hidden md:block">
      {rows.map((r) => {
        const Icon = r.icon;
        const on = layers[r.key];
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => toggle(r.key)}
            className={cn(
              "flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-xs last:border-b-0",
              on ? "text-fg" : "text-muted",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{r.label}</span>
            {typeof r.count === "number" ? (
              <span className="font-mono tabular-nums text-subtle">{r.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ago(iso: string | null | undefined): string {
  if (!iso) return "—";
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (!Number.isFinite(mins) || mins < 0) return "—";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export function LiveStrip({
  headlines,
  fires,
  flights,
  vessels,
  meta,
  nextSec,
  onRefresh,
  sweeping,
}: {
  headlines: number;
  fires: number;
  flights: number;
  vessels: number;
  meta: LiveMeta | null;
  nextSec: number;
  onRefresh: () => void;
  sweeping: boolean;
}) {
  return (
    <div className="hud-panel pointer-events-auto flex w-full items-center gap-3 px-3 py-1.5">
      <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-accent">
        <span className="size-1.5 animate-pulse rounded-full bg-accent" />
        LIVE
      </span>
      <span className="min-w-0 truncate font-mono text-[11px] tabular-nums text-muted">
        {headlines} live headlines · {fires} fires · {flights} flights · {vessels} vessels · updated {ago(meta?.fetchedAt)}
      </span>
      <span className="ml-auto hidden shrink-0 font-mono text-[11px] tabular-nums text-subtle sm:inline">
        next {Math.max(0, nextSec)}s
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={sweeping}
        className="shrink-0 font-mono text-[11px] text-muted hover:text-fg"
        aria-label="Refresh live feeds"
      >
        {sweeping ? "…" : "↻"}
      </button>
    </div>
  );
}
