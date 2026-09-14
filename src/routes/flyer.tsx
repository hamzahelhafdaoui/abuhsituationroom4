import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/flyer")({ component: FlyerPage });

export const FEATURES = [
  {
    n: "01",
    kicker: "SATELLITE WORKBENCH",
    line: "Sentinel-2 · VIIRS · high-res. Date it. Compare it. Zoom to yards.",
    icon: "SATELLITE",
  },
  {
    n: "02",
    kicker: "FOUR-YEAR ARCHIVE",
    line: "Bases, yards, airfields, crossings. 2022–now. First-seen first.",
    icon: "ARCHIVE",
  },
  {
    n: "03",
    kicker: "LIVE SWEEP",
    line: "Heat, flights, news, GDELT, OSM. Every six hours. Public data only.",
    icon: "SWEEP",
  },
  {
    n: "04",
    kicker: "CONTROL PICTURE",
    line: "Open-source shading. Confirm a change — the map moves.",
    icon: "CONTROL",
  },
  {
    n: "05",
    kicker: "SITROOM HUD",
    line: "Theater chips Sudan to UAE to Libya. Documentation, not targeting.",
    icon: "HUD",
  },
] as const;

type Layout = "poster" | "wide" | "badge";

function FlyerPage() {
  const [layout, setLayout] = useState<Layout>("poster");
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="print:hidden flex items-center gap-2 border-b border-border px-3 py-2">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" /> Sitroom
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {(["poster", "wide", "badge"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setLayout(id)}
              className={cn(
                "h-8 rounded-md px-3 font-mono text-[10px] tracking-wider uppercase",
                layout === id ? "bg-accent text-accent-fg" : "text-muted hover:bg-raised",
              )}
            >
              {id}
            </button>
          ))}
          <Button size="sm" className="ml-2" onClick={() => window.print()}>
            <Printer className="size-3.5" /> Print
          </Button>
        </div>
      </header>
      <div className="flex justify-center p-4 print:p-0">
        {layout === "poster" ? <Poster /> : layout === "wide" ? <Wide /> : <Badge />}
      </div>
    </div>
  );
}

function Mark() {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.42em] text-accent">ABU HUREIRAH</p>
      <h1 className="mt-1 font-display text-4xl font-medium leading-[0.95] tracking-tight sm:text-5xl">
        SITUATION
        <br />
        ROOM
      </h1>
      <p className="mt-2 font-mono text-xs tracking-[0.28em] text-muted">SUDAN WING</p>
    </div>
  );
}

function Corners({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative border border-accent/35 bg-bg", className)}>
      <i className="pointer-events-none absolute left-0 top-0 size-5 border-l border-t border-accent" />
      <i className="pointer-events-none absolute right-0 top-0 size-5 border-r border-t border-accent" />
      <i className="pointer-events-none absolute bottom-0 left-0 size-5 border-b border-l border-accent" />
      <i className="pointer-events-none absolute bottom-0 right-0 size-5 border-b border-r border-accent" />
      {children}
    </div>
  );
}

function Poster() {
  return (
    <Corners className="w-full max-w-[42rem] px-8 py-10 sm:px-12 sm:py-14">
      <p className="font-mono text-[10px] tracking-[0.35em] text-subtle">UNCLASSIFIED // OPEN SOURCE</p>
      <div className="mt-8">
        <Mark />
      </div>
      <div className="mt-10 h-px bg-accent/40" />
      <ol className="mt-8 space-y-6">
        {FEATURES.map((f) => (
          <li key={f.n} className="grid grid-cols-[3rem_1fr] gap-3">
            <span className="font-mono text-sm tabular-nums text-accent">{f.n}</span>
            <span>
              <span className="block font-mono text-sm tracking-[0.14em] text-fg">{f.kicker}</span>
              <span className="mt-1 block text-sm leading-snug text-muted">{f.line}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-12 font-mono text-[10px] tracking-[0.22em] text-subtle">
        CIVILIAN OSINT · NO TARGETING · DOCS ONLY
      </p>
    </Corners>
  );
}

function Wide() {
  return (
    <Corners className="w-full max-w-5xl p-8 sm:p-10">
      <p className="font-mono text-[10px] tracking-[0.35em] text-subtle">UNCLASSIFIED // OPEN SOURCE</p>
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(12rem,0.38fr)_1fr] md:items-start">
        <Mark />
        <ol className="space-y-4">
          {FEATURES.map((f) => (
            <li key={f.n} className="flex gap-3 border-b border-border/80 pb-3 last:border-0">
              <span className="w-8 shrink-0 font-mono text-sm tabular-nums text-accent">{f.n}</span>
              <span>
                <span className="block font-mono text-xs tracking-[0.16em] text-fg">{f.kicker}</span>
                <span className="mt-0.5 block text-sm text-muted">{f.line}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-8 font-mono text-[10px] tracking-[0.22em] text-subtle">
        CIVILIAN OSINT · NO TARGETING · DOCS ONLY
      </p>
    </Corners>
  );
}

function Badge() {
  return (
    <Corners className="aspect-square w-full max-w-[22rem] p-8 text-center">
      <p className="font-mono text-[10px] tracking-[0.42em] text-accent">ABU HUREIRAH</p>
      <p className="mt-3 font-display text-6xl font-medium tracking-tight">AHSR</p>
      <p className="mt-1 font-mono text-xs tracking-[0.32em] text-muted">SUDAN WING</p>
      <div className="mx-auto mt-6 h-px w-16 bg-accent/50" />
      <ol className="mt-6 space-y-1.5 font-mono text-xs tracking-[0.28em] text-fg">
        {FEATURES.map((f) => (
          <li key={f.n}>
            <span className="text-accent">{f.n}</span> {f.icon}
          </li>
        ))}
      </ol>
      <p className="mt-8 font-mono text-[9px] tracking-[0.28em] text-subtle">OPEN SOURCE · DOCS ONLY</p>
    </Corners>
  );
}
