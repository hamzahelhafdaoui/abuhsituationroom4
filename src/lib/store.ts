import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALERTS, WATCH_BOXES } from "@/data/catalog";
import { seedChangeLog, sortLog } from "@/lib/changelog";
import type { ControlUpdate } from "@/lib/control";
import { partyToFaction } from "@/lib/control";
import type { OsintReport } from "@/lib/osint";
import type { TheaterId } from "@/lib/theaters";
import { daysAgo } from "@/lib/utils";
import type {
  AuditEntry,
  ChangeEntry,
  Confidence,
  ImagerySource,
  Party,
  ReviewState,
  WatchBox,
} from "@/lib/types";

export type LayerKey =
  | "sites"
  | "firms"
  | "flights"
  | "boxes"
  | "gibs"
  | "thermalRaster"
  | "control"
  | "news"
  | "reports"
  | "ai"
  | "gdelt"
  | "osm"
  | "vessels"
  | "corridors";

export type RightTab = "log" | "queue" | "news" | "brief" | "reports" | "feeds";

export interface FlyTarget {
  lat: number;
  lon: number;
  zoom: number;
  label?: string;
}

interface Review {
  state: ReviewState;
  note: string;
  confidence: Confidence;
  at: string;
}

interface PartyOverride {
  party: Party;
  reason: string;
  at: string;
}

interface AppState {
  selectedSiteId: string | null;
  selectedAlertId: string | null;
  focusedBoxId: string | null;
  yardsZoom: boolean;
  partyFilter: Party | "all";
  kindFilter: string;
  reviewFilter: ReviewState | "all";
  layers: Record<LayerKey, boolean>;
  imagery: ImagerySource;
  date: string;
  compareDate: string;
  swipeOn: boolean;
  query: string;
  reviews: Record<string, Review>;
  partyOverrides: Record<string, PartyOverride>;
  customBoxes: WatchBox[];
  hiddenBoxIds: string[];
  audit: AuditEntry[];
  changeLog: ChangeEntry[];
  lastSweepAt: string | null;
  helpOpen: boolean;
  customReports: OsintReport[];
  selectedReportId: string | null;
  addingReport: boolean;
  rightTab: RightTab;
  hudOn: boolean;
  detectOn: boolean;
  theaterId: TheaterId;
  controlUpdates: ControlUpdate[];
  flyTarget: FlyTarget | null;
  dateLock: boolean;
  setSelectedSite: (id: string | null) => void;
  setSelectedAlert: (id: string | null) => void;
  setFocusedBox: (id: string | null) => void;
  requestYardsZoom: () => void;
  clearYardsZoom: () => void;
  setPartyFilter: (p: Party | "all") => void;
  setKindFilter: (k: string) => void;
  setReviewFilter: (r: ReviewState | "all") => void;
  toggleLayer: (k: LayerKey) => void;
  setImagery: (i: ImagerySource) => void;
  setDate: (d: string) => void;
  setCompareDate: (d: string) => void;
  setSwipeOn: (v: boolean) => void;
  setQuery: (q: string) => void;
  reviewAlert: (id: string, state: ReviewState, note: string, confidence: Confidence) => void;
  overrideParty: (siteId: string, party: Party, reason: string) => void;
  addBox: (box: WatchBox) => void;
  removeBox: (id: string) => void;
  hideDefaultBox: (id: string) => void;
  replaceLog: (rows: ChangeEntry[]) => void;
  setLastSweepAt: (iso: string) => void;
  setHelpOpen: (v: boolean) => void;
  addReport: (r: OsintReport) => void;
  setSelectedReport: (id: string | null) => void;
  setAddingReport: (v: boolean) => void;
  setRightTab: (t: RightTab) => void;
  setHudOn: (v: boolean) => void;
  setDetectOn: (v: boolean) => void;
  setTheater: (id: TheaterId) => void;
  addControlUpdate: (u: ControlUpdate) => void;
  setFlyTarget: (t: FlyTarget | null) => void;
  setDateLock: (v: boolean) => void;
}

function stamp(): string {
  return new Date().toISOString();
}

function audit(action: string, target: string, reason: string): AuditEntry {
  return {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: stamp(),
    actor: "local-analyst",
    action,
    target,
    reason,
  };
}

const defaultReviews: Record<string, Review> = {};
for (const a of ALERTS) {
  if (a.review !== "unreviewed") {
    defaultReviews[a.id] = {
      state: a.review,
      note: a.negativeEvidence || "Seeded review from archive.",
      confidence: a.confidence,
      at: a.datetime,
    };
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedSiteId: null,
      selectedAlertId: null,
      focusedBoxId: null,
      yardsZoom: false,
      partyFilter: "all",
      kindFilter: "all",
      reviewFilter: "all",
      layers: {
        sites: true,
        firms: true,
        flights: true,
        boxes: true,
        gibs: true,
        thermalRaster: false,
        control: true,
        news: true,
        reports: true,
        ai: true,
        gdelt: true,
        osm: false,
        vessels: true,
        corridors: true,
      },
      imagery: "s2cloudless",
      date: daysAgo(4),
      compareDate: daysAgo(14),
      swipeOn: false,
      query: "",
      reviews: defaultReviews,
      partyOverrides: {},
      customBoxes: [],
      hiddenBoxIds: [],
      audit: [],
      changeLog: seedChangeLog(),
      lastSweepAt: null,
      helpOpen: true,
      customReports: [],
      selectedReportId: null,
      addingReport: false,
      rightTab: "news",
      hudOn: true,
      detectOn: true,
      theaterId: "sdn",
      controlUpdates: [],
      flyTarget: null,
      dateLock: false,
      setSelectedSite: (id) => set({ selectedSiteId: id, focusedBoxId: null, selectedReportId: null }),
      setSelectedAlert: (id) => set({ selectedAlertId: id }),
      setFocusedBox: (id) => set({ focusedBoxId: id, selectedSiteId: null, selectedAlertId: null }),
      requestYardsZoom: () => set({ yardsZoom: true, imagery: "hires" }),
      clearYardsZoom: () => set({ yardsZoom: false }),
      setPartyFilter: (p) => set({ partyFilter: p }),
      setKindFilter: (k) => set({ kindFilter: k }),
      setReviewFilter: (r) => set({ reviewFilter: r }),
      toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
      setImagery: (i) => set({ imagery: i }),
      setDate: (d) => set({ date: d }),
      setCompareDate: (d) => set({ compareDate: d }),
      setSwipeOn: (v) => set({ swipeOn: v }),
      setQuery: (q) => set({ query: q }),
      reviewAlert: (id, state, note, confidence) =>
        set((s) => {
          const alert = ALERTS.find((a) => a.id === id);
          const nextUpdates = [...s.controlUpdates];
          if (state === "confirmed" && alert && alert.families.includes("corridor")) {
            nextUpdates.unshift({
              id: `cu-${id}`,
              lat: alert.lat,
              lon: alert.lon,
              faction: "contested",
              date: stamp().slice(0, 10),
              label: alert.title,
              source: "analyst-confirmed queue",
            });
          }
          return {
            reviews: {
              ...s.reviews,
              [id]: { state, note, confidence, at: stamp() },
            },
            controlUpdates: nextUpdates.slice(0, 80),
            audit: [
              audit("review-alert", id, `${state} · c${confidence} · ${note || "no note"}`),
              ...s.audit,
            ].slice(0, 200),
          };
        }),
      overrideParty: (siteId, party, reason) =>
        set((s) => ({
          partyOverrides: {
            ...s.partyOverrides,
            [siteId]: { party, reason, at: stamp() },
          },
          audit: [audit("party-label", siteId, `${party} · ${reason}`), ...s.audit].slice(0, 200),
        })),
      addBox: (box) =>
        set((s) => ({
          customBoxes: [...s.customBoxes, box],
          audit: [audit("watchbox-add", box.id, box.name), ...s.audit].slice(0, 200),
        })),
      removeBox: (id) =>
        set((s) => ({
          customBoxes: s.customBoxes.filter((b) => b.id !== id),
          audit: [audit("watchbox-remove", id, "removed custom box"), ...s.audit].slice(0, 200),
        })),
      hideDefaultBox: (id) =>
        set((s) => ({
          hiddenBoxIds: [...s.hiddenBoxIds, id],
          audit: [audit("watchbox-hide", id, "hid default box"), ...s.audit].slice(0, 200),
        })),
      replaceLog: (rows) => set({ changeLog: sortLog(rows) }),
      setLastSweepAt: (iso) => set({ lastSweepAt: iso }),
      setHelpOpen: (v) => set({ helpOpen: v }),
      addReport: (r) =>
        set((s) => {
          const faction = r.category === "control-change" ? partyToFaction(r.party) : null;
          const controlUpdates = faction
            ? [
                {
                  id: `cu-${r.id}`,
                  lat: r.lat,
                  lon: r.lon,
                  faction,
                  date: r.date,
                  label: r.title,
                  source: r.sourceLabel,
                },
                ...s.controlUpdates,
              ].slice(0, 80)
            : s.controlUpdates;
          return {
            customReports: [r, ...s.customReports],
            selectedReportId: r.id,
            addingReport: false,
            rightTab: "reports",
            controlUpdates,
            audit: [audit("report-add", r.id, r.title), ...s.audit].slice(0, 200),
          };
        }),
      setSelectedReport: (id) =>
        set({ selectedReportId: id, selectedSiteId: null, selectedAlertId: null, addingReport: false, rightTab: "reports" }),
      setAddingReport: (v) => set({ addingReport: v, selectedReportId: null, rightTab: "reports" }),
      setRightTab: (t) => set({ rightTab: t, addingReport: false }),
      setHudOn: (hudOn) => set({ hudOn }),
      setDetectOn: (detectOn) => set({ detectOn }),
      setTheater: (theaterId) => set({ theaterId }),
      addControlUpdate: (u) =>
        set((s) => ({ controlUpdates: [u, ...s.controlUpdates].slice(0, 80) })),
      setFlyTarget: (flyTarget) =>
        set(flyTarget ? { flyTarget, selectedSiteId: null } : { flyTarget: null }),
      setDateLock: (dateLock) => set({ dateLock }),
    }),
    {
      name: "ahsr-sudan-v2",
      partialize: (s) => ({
        reviews: s.reviews,
        partyOverrides: s.partyOverrides,
        customBoxes: s.customBoxes,
        hiddenBoxIds: s.hiddenBoxIds,
        audit: s.audit,
        imagery: s.imagery,
        changeLog: s.changeLog,
        lastSweepAt: s.lastSweepAt,
        helpOpen: s.helpOpen,
        customReports: s.customReports,
        hudOn: s.hudOn,
        detectOn: s.detectOn,
        theaterId: s.theaterId,
        controlUpdates: s.controlUpdates,
        dateLock: s.dateLock,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const seeded = seedChangeLog();
        const have = new Map((p.changeLog ?? []).map((e) => [e.id, e]));
        for (const row of seeded) {
          if (!have.has(row.id)) have.set(row.id, row);
        }
        return {
          ...current,
          ...p,
          changeLog: sortLog([...have.values()]),
          layers: {
            ...current.layers,
            ...(p.layers ?? {}),
            control: true,
            flights: true,
            vessels: true,
            osm: p.layers?.osm ?? false,
            gdelt: p.layers?.gdelt ?? true,
            corridors: p.layers?.corridors ?? true,
          },
          controlUpdates: p.controlUpdates ?? [],
        };
      },
    },
  ),
);

export function useVisibleBoxes(): WatchBox[] {
  const custom = useAppStore((s) => s.customBoxes);
  const hidden = useAppStore((s) => s.hiddenBoxIds);
  return [...WATCH_BOXES.filter((b) => !hidden.includes(b.id)), ...custom];
}
