import { useHazardState, refreshHazards } from "@/lib/hazard-state";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { THEATER_BY_ID } from "@/lib/theaters";
export function HazardFeedRows() {
  const { feed, error, loading } = useHazardState();
  const fly = useAppStore((s) => s.setFlyTarget);
  const theaterId = useAppStore((s) => s.theaterId);
  const [global, setGlobal] = useState(false);
  const region = THEATER_BY_ID[theaterId];
  const rows = (feed?.events ?? []).filter(
    (e) =>
      global ||
      (e.lon >= region.west &&
        e.lon <= region.east &&
        e.lat >= region.south &&
        e.lat <= region.north),
  );
  return (
    <section className="space-y-3 border-b border-border p-3" aria-label="Natural hazards">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Natural hazards</h3>
        <button
          onClick={() => void refreshHazards()}
          disabled={loading}
          className="text-xs underline"
        >
          {loading ? "Refreshing…" : "Refresh hazards"}
        </button>
      </div>
      <p className="text-xs text-muted">
        OSIRIS feed integration · published event locations, not damage findings. Newest first.
      </p>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={global} onChange={(e) => setGlobal(e.target.checked)} />
        Show worldwide events
      </label>
      <p className="text-xs text-muted">
        {rows.length} events {global ? "worldwide" : `in the ${region.label} map region`}
      </p>
      {error && (
        <p role="alert" className="text-xs">
          {error}. Previous results may be stale.
        </p>
      )}
      {feed?.sources.map((s) => (
        <p key={s.name} className="text-xs text-muted">
          {s.name}: {s.status === "ok" ? `${s.count} events` : s.note}
        </p>
      ))}
      {rows.slice(0, 100).map((e) => (
        <article key={e.id} className="rounded border border-border p-2 text-xs">
          <button
            className="text-left font-medium hover:underline"
            onClick={() => fly({ lon: e.lon, lat: e.lat, zoom: 9, label: e.title })}
          >
            {e.title}
          </button>
          <p className="mt-1 text-muted">
            {e.provider} · {new Date(e.at).toLocaleString()} · {e.severity}
          </p>
          <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline">
            Published source
          </a>
        </article>
      ))}
      {feed && !rows.length && (
        <p className="text-xs">
          No events returned for this region. This does not establish absence of hazards. Check
          provider status above.
        </p>
      )}
    </section>
  );
}
