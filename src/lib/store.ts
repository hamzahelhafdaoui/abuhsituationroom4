import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALERTS, WATCH_BOXES } from "@/data/catalog";
import { seedChangeLog, sortLog } from "@/lib/changelog";
import type { ControlUpdate } from "@/lib/control";
import { partyToFaction } from "@/lib/control";
import type { OsintReport } from "@/lib/osint";
import type { FuaeRecord } from "@/lib/fuae";
import { DEFAULT_WEIGHTS, trainChip, type ChipFeatures, type ModelKlass } from "@/lib/chip-model";
import type { ListOrder } from "@/lib/flags";
import type { TheaterId } from "@/lib/theaters";
import type { LookId } from "@/lib/looks";
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
  | "corridors"
  | "rsfWatch";

export type RightTab = "log" | "queue" | "news" | "brief" | "reports" | "feeds" | "fuae" | "rsf";

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
  helpSeen: boolean;
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
  fuaeLog: FuaeRecord[];
  listOrder: ListOrder;
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
  ingestFuae: (rows: FuaeRecord[]) => void;
  setListOrder: (o: ListOrder) => void;
  modelWeights: typeof DEFAULT_WEIGHTS;
  trainModel: (features: ChipFeatures, klass: ModelKlass, confirmed: boolean) => void;
  look: LookId;
  setLook: (l: LookId) => void;
  orbitOn: boolean;
  setOrbitOn: (v: boolean) => void;
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
        rsfWatch: true,
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
      helpOpen: false,
      helpSeen: false,
      customReports: [],
      selectedReportId: null,
      addingReport: false,
      rightTab: "queue",
      hudOn: true,
      detectOn: true,
      look: "none",
      orbitOn: false,
      theaterId: "sdn",
      controlUpdates: [],
      flyTarget: null,
      dateLock: false,
      fuaeLog: [],
      listOrder: "newest",
      modelWeights: DEFAULT_WEIGHTS,
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
      setHelpOpen: (v) => set(v ? { helpOpen: true } : { helpOpen: false, helpSeen: true }),
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
      setLook: (look) => set((s) => ({ look, hudOn: look === "none" ? s.hudOn : true })),
      setOrbitOn: (orbitOn) => set({ orbitOn }),
      setTheater: (theaterId) => set({ theaterId }),
      addControlUpdate: (u) =>
        set((s) => ({ controlUpdates: [u, ...s.controlUpdates].slice(0, 80) })),
      setFlyTarget: (flyTarget) =>
        set(flyTarget ? { flyTarget, selectedSiteId: null } : { flyTarget: null }),
      setDateLock: (dateLock) => set({ dateLock }),
      ingestFuae: (rows) =>
        set((s) => {
          if (!rows.length && s.fuaeLog.length) return s;
          const map = new Map(s.fuaeLog.map((r) => [r.id, r]));
          for (const row of rows) {
            const prev = map.get(row.id);
            map.set(row.id, prev ? { ...prev, ...row, firstSeen: prev.firstSeen, lastSeen: row.lastSeen } : row);
          }
          return {
            fuaeLog: [...map.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, 200),
          };
        }),
      setListOrder: (listOrder) => set({ listOrder }),
      trainModel: (features, klass, confirmed) =>
        set((s) => ({
          modelWeights: trainChip(s.modelWeights, features, klass, confirmed),
          audit: [audit("chip-train", klass, confirmed ? "confirm" : "reject"), ...s.audit].slice(0, 200),
        })),
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
        helpSeen: s.helpSeen,
        customReports: s.customReports,
        hudOn: s.hudOn,
        detectOn: s.detectOn,
        theaterId: s.theaterId,
        controlUpdates: s.controlUpdates,
        dateLock: s.dateLock,
        fuaeLog: s.fuaeLog,
        listOrder: s.listOrder,
        modelWeights: s.modelWeights,
        look: s.look,
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
            rsfWatch: p.layers?.rsfWatch ?? true,
          },
          controlUpdates: p.controlUpdates ?? [],
          fuaeLog: p.fuaeLog ?? [],
          listOrder: p.listOrder === "oldest" ? "oldest" : "newest",
          modelWeights: p.modelWeights ?? DEFAULT_WEIGHTS,
          look: p.look === "crt" || p.look === "nvg" || p.look === "flir" || p.look === "noir" || p.look === "snow" ? p.look : "none",
          helpOpen: false,
          helpSeen: Boolean(p.helpSeen) || p.helpOpen === false,
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
