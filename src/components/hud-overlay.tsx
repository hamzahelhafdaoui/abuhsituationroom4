import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { LookId } from "@/lib/looks";
import type { SlewDetail, SlewPhase } from "@/lib/spy-cam";

function zulu(now: Date) {
  return now.toISOString().slice(11, 19) + "Z";
}

export function SitroomFx() {
  const hudOn = useAppStore((s) => s.hudOn);
  const [slew, setSlew] = useState<SlewDetail>({ phase: "idle" });
  useEffect(() => {
    const on = (e: Event) => setSlew((e as CustomEvent<SlewDetail>).detail);
    window.addEventListener("ahsr-slew", on);
    return () => window.removeEventListener("ahsr-slew", on);
  }, []);
  if (!hudOn) return null;
  const slewing = slew.phase === "slewing" || slew.phase === "lock";
  return (
    <>
      <div className={cn("sitroom-crosshair", slewing && "is-slew")} aria-hidden="true">
        <span className="ch-h" />
        <span className="ch-v" />
        <span className="ch-box" />
      </div>
      <div className="sitroom-corners" aria-hidden="true">
        <i className="tl" />
        <i className="tr" />
        <i className="bl" />
        <i className="br" />
      </div>
      {slewing ? <SlewOverlay phase={slew.phase} label={slew.label} duration={slew.duration} /> : null}
    </>
  );
}

function SlewOverlay({
  phase,
  label,
  duration,
}: {
  phase: SlewPhase;
  label?: string;
  duration?: number;
}) {
  return (
    <div className="spy-slew" aria-hidden="true">
      <span className="spy-ring r1" />
      <span className="spy-ring r2" />
      <span className="spy-ring r3" />
      <span className="spy-scan" />
      <span className="spy-bracket" />
      <div className="spy-status">
        <span className={phase === "lock" ? "text-accent" : "live-pulse"}>
          {phase === "lock" ? "LOCK" : "SLEWING"}
        </span>
        {label ? <span className="ml-2 text-fg">{label}</span> : null}
        {phase === "slewing" && duration ? (
          <span className="ml-2 text-subtle">{(duration / 1000).toFixed(1)}s</span>
        ) : null}
      </div>
    </div>
  );
}

export function SensorBar({
  docsOpen,
  onDocs,
}: {
  docsOpen?: boolean;
  onDocs?: () => void;
}) {
  const hudOn = useAppStore((s) => s.hudOn);
  const setHudOn = useAppStore((s) => s.setHudOn);
  const detectOn = useAppStore((s) => s.detectOn);
  const setDetectOn = useAppStore((s) => s.setDetectOn);
  const look = useAppStore((s) => s.look);
  const setLook = useAppStore((s) => s.setLook);
  const orbitOn = useAppStore((s) => s.orbitOn);
  const setOrbitOn = useAppStore((s) => s.setOrbitOn);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setHudOn(!useAppStore.getState().hudOn);
      }
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setDetectOn(!useAppStore.getState().detectOn);
      }
      if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        setOrbitOn(!useAppStore.getState().orbitOn);
      }
      if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("sahel-map-nudge", { detail: { bearing: -18 } }));
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("sahel-map-nudge", { detail: { bearing: 18 } }));
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("sahel-map-nudge", { detail: { reset: true } }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setHudOn, setDetectOn, setOrbitOn]);

  return (
    <div className="hud-panel hud-panel-bracket pointer-events-auto flex items-center gap-1 p-1">
      <button
        type="button"
        onClick={() => setHudOn(!hudOn)}
        className={cn(
          "h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider",
          hudOn ? "text-accent" : "text-muted hover:text-fg",
        )}
      >
        HUD
      </button>
      <button
        type="button"
        title="Auto-find: BDA, cargo, air, sea, vehicles, pads, berms, POL, camps, crossings, tracks, FX. Candidates — not IDs."
        onClick={() => setDetectOn(!detectOn)}
        className={cn(
          "h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider",
          detectOn ? "text-accent" : "text-muted hover:text-fg",
        )}
      >
        DET
      </button>
      <button
        type="button"
        title="Slow satellite orbit around the current target (O)"
        onClick={() => setOrbitOn(!orbitOn)}
        className={cn(
          "h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider",
          orbitOn ? "text-accent" : "text-muted hover:text-fg",
        )}
      >
        ORBIT
      </button>
      {(["crt", "nvg", "flir"] as LookId[]).map((id) => (
        <button
          key={id}
          type="button"
          title={`${id.toUpperCase()} sensor look`}
          onClick={() => setLook(look === id ? "none" : id)}
          className={cn(
            "h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider",
            look === id ? "text-accent" : "text-muted hover:text-fg",
          )}
        >
          {id.toUpperCase()}
        </button>
      ))}
      {onDocs ? (
        <button
          type="button"
          title="Open briefs, logs, news, FUAE"
          onClick={onDocs}
          className={cn(
            "h-8 rounded-sm px-2 font-mono text-[10px] tracking-wider",
            docsOpen ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
          )}
        >
          DOCS
        </button>
      ) : null}
    </div>
  );
}

export function ClockChip() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-[11px] tabular-nums tracking-wider text-accent">
      {now ? zulu(now) : "--:--:--Z"}
    </span>
  );
}

export function ClassificationBar() {
  return (
    <div className="pointer-events-none flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.18em] text-subtle">
      <span>UNCLASSIFIED // OPEN SOURCE</span>
      <span className="hidden sm:inline">DOCUMENTATION ONLY · NO TARGETING</span>
    </div>
  );
}
