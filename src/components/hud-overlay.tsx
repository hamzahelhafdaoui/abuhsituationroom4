import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function zulu(now: Date) {
  return now.toISOString().slice(11, 19) + "Z";
}

export function SitroomFx() {
  const hudOn = useAppStore((s) => s.hudOn);
  if (!hudOn) return null;
  return (
    <>
      <div className="sitroom-vignette" />
      <div className="sitroom-scanlines" />
      <div className="sitroom-crosshair" aria-hidden="true">
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
    </>
  );
}

export function SensorBar() {
  const hudOn = useAppStore((s) => s.hudOn);
  const setHudOn = useAppStore((s) => s.setHudOn);
  const detectOn = useAppStore((s) => s.detectOn);
  const setDetectOn = useAppStore((s) => s.setDetectOn);

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setHudOn, setDetectOn]);

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
