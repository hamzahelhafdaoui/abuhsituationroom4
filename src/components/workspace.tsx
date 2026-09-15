import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CircleHelp, ClipboardList, FileText, Layers, Minus, Newspaper, PanelRight, Plane, Plus, RefreshCw, Ruler, Search, Shield } from "lucide-react";
import { ALERTS, FLIGHTS, OBSERVATIONS, SITES } from "@/data/catalog";
import { VESSEL_SEED } from "@/data/regional-sites";
import { ingestLive } from "@/lib/changelog";
import { getLiveBundle, getTraffic } from "@/lib/live";
import { getNewsFeed } from "@/lib/news";
import { generateAiBrief } from "@/lib/ai-brief";
import { compileSitrep, type Sitrep } from "@/lib/sitrep";
import { composeBriefing } from "@/lib/briefing";
import { fuseDetect, runDetect, type DetectReport } from "@/lib/imagery-detect";
import { allVessels, mergeFlights } from "@/lib/traffic";
import { scanFuae, seedFuae, type FuaeRecord } from "@/lib/fuae";
import { SEED_REPORTS } from "@/lib/osint";
import { GDELT_ARCHIVE, OSM_SEED, FEED_SEED } from "@/lib/warroom-data";
import { THEATER_BY_ID, THEATERS } from "@/lib/theaters";
import { IMAGERY, siteInKindGroup, type AiBrief, type FlightEvent, type LiveBundle, type ReviewState, type ThermalEvent } from "@/lib/types";
import { useAppStore, useVisibleBoxes } from "@/lib/store";
import { cn, daysAgo, mapCommand, mapFit, mapMeasure } from "@/lib/utils";
import { MapCanvas } from "@/components/map-canvas";
import { LeftRail, RightRail, type MobileTab } from "@/components/rails";
import { ControlLegend, DetectPanel } from "@/components/monitor-panels";
import { ClassificationBar, ClockChip, SensorBar, SitroomFx } from "@/components/hud-overlay";
import { BasemapPicker, LayerStack } from "@/components/map-chrome";

const JUMP = [
  { id: "hsss", label: "Khartoum" },
  { id: "wad-madani", label: "Wad Madani" },
  { id: "hsfs", label: "El Fasher" },
  { id: "hspn", label: "Port Sudan" },
  { id: "hsnn", label: "Nyala" },
  { id: "hsgn", label: "Geneina" },
  { id: "haso", label: "Asosa" },
  { id: "omam", label: "Al Dhafra" },
  { id: "jebel-ali", label: "Jebel Ali" },
  { id: "kufra", label: "Kufra" },
  { id: "adre", label: "Adré" },
  { id: "amdjarass", label: "Amdjarass" },
  { id: "hhas", label: "Assab" },
] as const;

function DateStrip({
  date,
  setDate,
  compareDate,
  setCompareDate,
  dated,
  swipeOn,
  setSwipeOn,
  onPickDate,
}: {
  date: string;
  setDate: (d: string) => void;
  compareDate: string;
  setCompareDate: (d: string) => void;
  dated: boolean;
  swipeOn: boolean;
  setSwipeOn: (v: boolean) => void;
  onPickDate: (d: string) => void;
}) {
  const days = useMemo(() => Array.from({ length: 16 }, (_, i) => daysAgo(15 - i)), []);
  return (
    <div className="hud-panel flex w-full items-center gap-3 px-3 py-2">
      <input
        type="date"
        value={date}
        onChange={(e) => onPickDate(e.target.value)}
        className="h-9 w-[9.5rem] rounded-lg border border-border bg-raised px-2 font-mono text-xs tabular-nums"
        aria-label="Browse date"
      />
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onPickDate(d)}
            className={cn(
              "h-8 shrink-0 rounded-md px-2 font-mono text-[11px] tabular-nums",
              date === d ? "bg-accent text-accent-fg" : "text-muted hover:bg-raised hover:text-fg",
            )}
          >
            {d.slice(5)}
          </button>
        ))}
      </div>
      <label className="hidden shrink-0 items-center gap-2 text-xs text-muted sm:flex">
        <input type="checkbox" checked={swipeOn} onChange={(e) => setSwipeOn(e.target.checked)} />
        Compare
      </label>
      {swipeOn ? (
        <input
          type="date"
          value={compareDate}
          onChange={(e) => setCompareDate(e.target.value)}
          className="hidden h-9 w-[9.5rem] rounded-lg border border-border bg-raised px-2 font-mono text-xs tabular-nums sm:block"
          aria-label="Compare date"
        />
      ) : null}
      {!dated ? (
        <p className="hidden max-w-[14rem] shrink-0 text-[11px] leading-snug text-subtle lg:block">
          Picking a date switches to Sentinel-2 so the day actually means something.
        </p>
      ) : null}
    </div>
  );
}

export function Workspace() {
  const [tab, setTab] = useState<MobileTab>("news");
  const [live, setLive] = useState<LiveBundle | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [boxOpen, setBoxOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [sweepNote, setSweepNote] = useState<string | null>(null);
  const [brief, setBrief] = useState<AiBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [sitrep, setSitrep] = useState<Sitrep | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [deskOpen, setDeskOpen] = useState(false);
  const [detectReport, setDetectReport] = useState<DetectReport | null>(null);
  const [detecting, setDetecting] = useState(false);
  const customReports = useAppStore((s) => s.customReports);
  const searchRef = useRef<HTMLInputElement>(null);
  const [boxForm, setBoxForm] = useState({
    name: "",
    west: "32.2",
    south: "15.3",
    east: "32.8",
    north: "15.9",
  });

  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const selectedAlertId = useAppStore((s) => s.selectedAlertId);
  const setSelectedSite = useAppStore((s) => s.setSelectedSite);
  const setSelectedAlert = useAppStore((s) => s.setSelectedAlert);
  const partyFilter = useAppStore((s) => s.partyFilter);
  const setPartyFilter = useAppStore((s) => s.setPartyFilter);
  const kindFilter = useAppStore((s) => s.kindFilter);
  const setKindFilter = useAppStore((s) => s.setKindFilter);
  const reviewFilter = useAppStore((s) => s.reviewFilter);
  const setReviewFilter = useAppStore((s) => s.setReviewFilter);
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const imagery = useAppStore((s) => s.imagery);
  const setImagery = useAppStore((s) => s.setImagery);
  const date = useAppStore((s) => s.date);
  const setDate = useAppStore((s) => s.setDate);
  const compareDate = useAppStore((s) => s.compareDate);
  const setCompareDate = useAppStore((s) => s.setCompareDate);
  const swipeOn = useAppStore((s) => s.swipeOn);
  const setSwipeOn = useAppStore((s) => s.setSwipeOn);
  const query = useAppStore((s) => s.query);
  const setQuery = useAppStore((s) => s.setQuery);
  const reviews = useAppStore((s) => s.reviews);
  const reviewAlert = useAppStore((s) => s.reviewAlert);
  const partyOverrides = useAppStore((s) => s.partyOverrides);
  const overrideParty = useAppStore((s) => s.overrideParty);
  const addBox = useAppStore((s) => s.addBox);
  const removeBox = useAppStore((s) => s.removeBox);
  const hideDefaultBox = useAppStore((s) => s.hideDefaultBox);
  const audit = useAppStore((s) => s.audit);
  const replaceLog = useAppStore((s) => s.replaceLog);
  const changeLog = useAppStore((s) => s.changeLog);
  const setLastSweepAt = useAppStore((s) => s.setLastSweepAt);
  const helpOpen = useAppStore((s) => s.helpOpen);
  const setHelpOpen = useAppStore((s) => s.setHelpOpen);
  const theaterId = useAppStore((s) => s.theaterId);
  const setTheater = useAppStore((s) => s.setTheater);
  const rightTab = useAppStore((s) => s.rightTab);
  const setRightTab = useAppStore((s) => s.setRightTab);
  const setFlyTarget = useAppStore((s) => s.setFlyTarget);
  const detectOn = useAppStore((s) => s.detectOn);
  const ingestFuae = useAppStore((s) => s.ingestFuae);
  const fuaeLog = useAppStore((s) => s.fuaeLog);
  const boxes = useVisibleBoxes();

  function applyLive(b: LiveBundle, announce: boolean) {
    setLive((prev) => {
      const keepNews = b.news.length === 0 && (prev?.news.length ?? 0) > 0;
      return keepNews
        ? { ...b, news: prev!.news, newsPoints: prev!.newsPoints, newsMeta: prev!.newsMeta, ticker: prev!.ticker }
        : b;
    });
    setLiveError(null);
    const { next, added } = ingestLive(b, useAppStore.getState().changeLog);
    replaceLog(next);
    ingestFuae(scanFuae(mergeFlights(b.flights), b.vessels?.length ? b.vessels : allVessels()));
    setLastSweepAt(new Date().toISOString());
    setSitrep(
      compileSitrep({
        log: next,
        live: b,
        lastSweepAt: new Date().toISOString(),
      }),
    );
    if (announce) {
      setSweepNote(added ? `${added} new log rows` : "Sweep finished · no new rows");
      window.setTimeout(() => setSweepNote(null), 4000);
    }
  }

  useEffect(() => {
    setSitrep(
      compileSitrep({
        log: changeLog,
        live,
        lastSweepAt: useAppStore.getState().lastSweepAt,
      }),
    );
  }, [live, changeLog]);

  useEffect(() => {
    let cancelled = false;
    const load = (announce: boolean) => {
      setSweeping(true);
      getLiveBundle()
        .then((b) => {
          if (!cancelled) applyLive(b, announce);
        })
        .catch((err: unknown) => {
          if (!cancelled) setLiveError(err instanceof Error ? err.message : "Live ingest failed");
        })
        .finally(() => {
          if (!cancelled) setSweeping(false);
        });
    };
    const last = useAppStore.getState().lastSweepAt;
    const stale = !last || Date.now() - Date.parse(last) > 6 * 60 * 60 * 1000;
    load(stale);
    const id = window.setInterval(() => load(true), 6 * 60 * 60 * 1000);
    const applyNews = (n: Awaited<ReturnType<typeof getNewsFeed>>) => {
      if (cancelled) return;
      setLive((prev) => {
        if (!prev) {
          return {
            firms: [],
            firmsMeta: n.meta,
            flights: [],
            flightsMeta: n.meta,
            reports: [],
            reportsMeta: n.meta,
            news: n.items,
            newsPoints: n.points,
            newsMeta: n.meta,
            gdelt: GDELT_ARCHIVE,
            gdeltMeta: n.meta,
            osm: OSM_SEED,
            osmMeta: n.meta,
            feeds: [],
            feedsMeta: n.meta,
            ticker: n.items.map((i) => ({ source: i.source, title: i.title, url: i.url })),
            vessels: VESSEL_SEED,
            vesselsMeta: n.meta,
          };
        }
        const nextLive = {
          ...prev,
          news: n.items,
          newsPoints: n.points,
          newsMeta: n.meta,
          ticker: n.items.map((i) => ({ source: i.source, title: i.title, url: i.url })),
        };
        const { next } = ingestLive(nextLive, useAppStore.getState().changeLog);
        replaceLog(next);
        return nextLive;
      });
    };
    const refreshNews = () => {
      setNewsLoading(true);
      getNewsFeed()
        .then(applyNews)
        .finally(() => {
          if (!cancelled) setNewsLoading(false);
        });
    };
    refreshNews();
    const newsId = window.setInterval(refreshNews, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearInterval(newsId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      getTraffic()
        .then((t) => {
          if (cancelled) return;
          setLive((prev) => {
            if (!prev) {
              return {
                firms: [],
                firmsMeta: t.flightsMeta,
                flights: mergeFlights(t.flights),
                flightsMeta: t.flightsMeta,
                reports: [],
                reportsMeta: t.flightsMeta,
                news: [],
                newsPoints: [],
                newsMeta: t.flightsMeta,
                gdelt: GDELT_ARCHIVE,
                gdeltMeta: t.flightsMeta,
                osm: OSM_SEED,
                osmMeta: t.flightsMeta,
                feeds: [],
                feedsMeta: t.flightsMeta,
                ticker: [],
                vessels: t.vessels,
                vesselsMeta: t.vesselsMeta,
              };
            }
            return {
              ...prev,
              flights: mergeFlights(t.flights),
              flightsMeta: t.flightsMeta,
              vessels: t.vessels,
              vesselsMeta: t.vesselsMeta,
            };
          });
          ingestFuae(scanFuae(mergeFlights(t.flights), t.vessels.length ? t.vessels : allVessels()));
        })
        .catch(() => {
          /* coverage gap is the default, not an error toast */
        });
    };
    poll();
    const id = window.setInterval(poll, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ingestFuae]);

  useEffect(() => {
    const show = () => {
      if (!useAppStore.getState().helpSeen) useAppStore.getState().setHelpOpen(true);
    };
    const persist = useAppStore.persist;
    if (persist?.hasHydrated?.()) show();
    return persist?.onFinishHydration?.(show);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (useAppStore.getState().helpOpen) {
          e.preventDefault();
          setHelpOpen(false);
          return;
        }
        setSelectedAlert(null);
        setSelectedSite(null);
        setSearchOpen(false);
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSelectedAlert, setSelectedSite]);

  const firms: ThermalEvent[] = live?.firms ?? [];
  const flights: FlightEvent[] = mergeFlights(live?.flights ?? [], FLIGHTS);
  const vessels = allVessels();
  const gdelt = live?.gdelt?.length ? live.gdelt : GDELT_ARCHIVE;
  const osm = live?.osm?.length ? live.osm : OSM_SEED;
  const feeds = live?.feeds?.length ? live.feeds : FEED_SEED;

  useEffect(() => {
    if (selectedSiteId || selectedAlertId) setDeskOpen(true);
  }, [selectedSiteId, selectedAlertId]);

  useEffect(() => {
    ingestFuae(seedFuae());
  }, [ingestFuae]);

  const sites = useMemo(() => {
    return SITES.filter((s) => {
      const party = partyOverrides[s.id]?.party ?? s.party;
      if (partyFilter !== "all" && party !== partyFilter) return false;
      if (!siteInKindGroup(s.kind, kindFilter)) return false;
      return true;
    });
  }, [partyFilter, partyOverrides, kindFilter]);

  const alerts = useMemo(() => {
    return ALERTS.filter((a) => {
      const state = reviews[a.id]?.state ?? a.review;
      if (reviewFilter !== "all" && state !== reviewFilter) return false;
      if (partyFilter !== "all") {
        const hit = a.siteIds.some((id) => {
          const site = SITES.find((s) => s.id === id);
          return (partyOverrides[id]?.party ?? site?.party) === partyFilter;
        });
        if (!hit) return false;
      }
      return true;
    });
  }, [reviewFilter, partyFilter, partyOverrides, reviews]);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { siteHits: [] as typeof SITES, alertHits: [] as typeof ALERTS };
    const siteHits = SITES.filter(
      (s) => s.name.toLowerCase().includes(q) || s.admin1.toLowerCase().includes(q) || s.kind.includes(q),
    ).slice(0, 6);
    const alertHits = ALERTS.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 4);
    return { siteHits, alertHits };
  }, [query]);

  const selectedSite = SITES.find((s) => s.id === selectedSiteId) ?? null;
  const selectedAlert = ALERTS.find((a) => a.id === selectedAlertId) ?? null;
  const siteObs = selectedSite ? OBSERVATIONS.filter((o) => o.siteId === selectedSite.id) : [];
  const siteParty = selectedSite ? (partyOverrides[selectedSite.id]?.party ?? selectedSite.party) : "unknown";
  const panelOpen = deskOpen;

  function applyReview(state: ReviewState) {
    if (!selectedAlert) return;
    reviewAlert(selectedAlert.id, state, note, selectedAlert.confidence);
    setNote("");
  }

  function pickDate(d: string) {
    if (!IMAGERY[imagery].dated) setImagery("s2");
    setDate(d);
  }

  function sweepNow() {
    setSweeping(true);
    getLiveBundle()
      .then((b) => applyLive(b, true))
      .catch((err: unknown) => setLiveError(err instanceof Error ? err.message : "Live ingest failed"))
      .finally(() => setSweeping(false));
  }

  function runBrief() {
    setBriefLoading(true);
    generateAiBrief()
      .then((b) => setBrief(b))
      .catch((err: unknown) =>
        setBrief({
          ok: false,
          model: "grok-4.5",
          generatedAt: Date.now(),
          items: [],
          citations: [],
          error: err instanceof Error ? err.message : "Brief failed",
        }),
      )
      .finally(() => setBriefLoading(false));
  }

  const allReports = [...customReports, ...SEED_REPORTS];
  const newsFeed = live
    ? { items: live.news, points: live.newsPoints, meta: live.newsMeta }
    : null;
  const aiEvents = brief?.items.filter((i) => i.lat != null && i.lon != null) ?? [];

  const briefingDoc = useMemo(() => {
    if (!sitrep) return null;
    return composeBriefing({ sitrep, live, log: changeLog });
  }, [sitrep, live, changeLog]);

  const briefingOn = tab === "brief" || rightTab === "brief";

  const newsPoints = live?.newsPoints ?? [];
  const firmCount = firms.length;
  const flightCount = flights.length;
  const newsCount = newsPoints.length;

  useEffect(() => {
    if (!detectOn) {
      setDetectReport(null);
      setDetecting(false);
      return;
    }
    const args = {
      boxes,
      firms,
      flights,
      osm,
      news: newsPoints,
      date,
      compareDate,
      vessels,
      gdelt,
    };
    const fused = fuseDetect(args);
    setDetectReport({
      hits: fused,
      ranAt: new Date().toISOString(),
      opticalTried: 0,
      opticalOk: 0,
      note: "Fusion (FIRMS × ADS-B × AIS × OSM × news × catalog). HLS chips scoring…",
    });
    setDetecting(true);
    let cancelled = false;
    const t = window.setTimeout(() => {
      runDetect({ ...args, optical: true }).then((r) => {
        if (!cancelled) {
          setDetectReport(r);
          setDetecting(false);
        }
      });
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectOn, date, compareDate, firmCount, flightCount, newsCount, boxes.length, vessels.length, gdelt.length]);

  function openDesk(tabId: typeof rightTab = rightTab) {
    setDeskOpen(true);
    setRightTab(tabId);
  }

  function openAnno(id: string) {
    const a = briefingDoc?.annotations.find((x) => x.id === id);
    if (!a) return;
    setFlyTarget({ lat: a.lat, lon: a.lon, zoom: 8.2, label: a.title });
  }

  function openDetect(hit: { lat: number; lon: number; siteId?: string; title: string }) {
    setFlyTarget({ lat: hit.lat, lon: hit.lon, zoom: 11.2, label: hit.title });
    if (hit.siteId) setSelectedSite(hit.siteId);
  }

  function pickMobile(id: MobileTab) {
    setTab(id);
    if (id === "brief") {
      setRightTab("brief");
      setSelectedAlert(null);
      setSelectedSite(null);
    } else if (id === "news") {
      setRightTab("news");
    } else if (id === "alerts") {
      setRightTab("queue");
    } else if (id === "fuae") {
      setRightTab("fuae");
    } else if (rightTab === "brief") {
      setRightTab("news");
    }
  }

  const railProps = {
    date, compareDate, setDate, setCompareDate, swipeOn, setSwipeOn,
    layers, toggleLayer, imagery, setImagery, partyFilter, setPartyFilter, query, setQuery,
    boxes, boxOpen, setBoxOpen, boxForm, setBoxForm, addBox, removeBox, hideDefaultBox,
    flights, firms,
  };

  const rightProps = {
    alerts, sites, selectedAlert, selectedSite, siteParty, siteObs, reviews,
    note, setNote, applyReview, setSelectedAlert, setSelectedSite,
    reviewFilter, setReviewFilter, overrideParty, flights, live, liveError, audit,
    news: newsFeed,
    newsLoading,
    brief,
    briefLoading,
    onRunBrief: runBrief,
    sitrep,
    briefingDoc,
    onOpenAnno: openAnno,
    feeds,
    feedsMeta: live?.feedsMeta ?? null,
    fuae: fuaeLog,
    onOpenFuae: (r: FuaeRecord) => {
      setFlyTarget({ lat: r.lat, lon: r.lon, zoom: 7.4, label: r.title });
      setDeskOpen(true);
      setRightTab("fuae");
    },
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg">
      <MapCanvas
        boxes={boxes}
        firms={firms}
        flights={flights}
        panelOpen={panelOpen}
        reports={allReports}
        newsPoints={live?.newsPoints ?? []}
        aiEvents={aiEvents}
        gdelt={gdelt}
        osm={osm}
        vessels={vessels}
        briefingOn={briefingOn}
        annotations={briefingOn ? (briefingDoc?.annotations ?? []) : []}
        detections={detectOn ? (detectReport?.hits ?? []) : []}
        fuae={fuaeLog}
      />

      <SitroomFx />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3">
        <ClassificationBar />
        <div className="mt-2 flex items-start gap-2">
          <Link
            to="/"
            className="hud-panel hud-panel-bracket pointer-events-auto flex items-center gap-2.5 px-3 py-2"
          >
            <span className="flex size-8 items-center justify-center border border-accent/50 text-accent">
              <Shield className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-[10px] tracking-[0.22em] text-accent">ABU HUREIRAH</span>
              <span className="block font-mono text-sm font-medium leading-tight tracking-tight">
                <span className="sm:hidden">AHSR · SDN</span>
                <span className="hidden sm:inline">SITUATION ROOM</span>
              </span>
              <span className="hidden font-mono text-[10px] tracking-[0.14em] text-muted sm:block">SUDAN WING</span>
            </span>
          </Link>

          <div className="pointer-events-auto relative min-w-0 flex-1">
            <label className="hud-panel relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Jump to a site or alert  ·  /"
                className="h-11 w-full bg-transparent pl-10 pr-3 text-sm text-fg placeholder:text-subtle"
              />
            </label>
            {searchOpen && query.trim().length >= 2 && (searchHits.siteHits.length + searchHits.alertHits.length) > 0 ? (
              <div className="hud-panel absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden py-1">
                {searchHits.siteHits.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-raised"
                    onClick={() => {
                      setSelectedSite(s.id);
                      setSelectedAlert(null);
                      setQuery("");
                      setSearchOpen(false);
                    }}
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-subtle">{s.kind} · {s.admin1}</span>
                  </button>
                ))}
                {searchHits.alertHits.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-raised"
                    onClick={() => {
                      setSelectedAlert(a.id);
                      const first = a.siteIds[0];
                      if (first) setSelectedSite(first);
                      setQuery("");
                      setSearchOpen(false);
                    }}
                  >
                    <span>{a.title}</span>
                    <span className="text-xs text-subtle">alert</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <nav className="pointer-events-auto hidden items-center gap-2 sm:flex">
            <SensorBar />
            <div className="hud-panel flex items-center gap-2 px-3 py-1.5">
              <ClockChip />
            </div>
            <div className="hud-panel hidden items-center gap-1 p-1 lg:flex">
              <button
                type="button"
                onClick={() => setDeskOpen((v) => !v)}
                className={cn(
                  "rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider hover:bg-raised",
                  deskOpen ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                DOCS
              </button>
              <button
                type="button"
                onClick={() => {
                  openDesk("fuae");
                }}
                className="rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg"
              >
                FUAE{fuaeLog.length ? ` ${fuaeLog.length}` : ""}
              </button>
              <Link to="/methods" className="rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg">METHODS</Link>
              <Link to="/ethics" className="rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg">ETHICS</Link>
              <Link to="/sop" className="rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg">SOP</Link>
              <Link to="/flyer" className="rounded-sm px-2.5 py-2 font-mono text-[10px] tracking-wider text-muted hover:bg-raised hover:text-fg">FLYER</Link>
            </div>
          </nav>
        </div>

        <div className="mt-2 flex items-start gap-2">
          <BasemapPicker />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="pointer-events-auto hidden flex-wrap gap-1 md:flex">
            {THEATERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheater(t.id);
                  mapFit(t);
                }}
                className={cn(
                  "h-8 border border-border bg-bg/70 px-2.5 font-mono text-[10px] tracking-wider text-muted backdrop-blur-sm hover:text-fg",
                  theaterId === t.id && "border-accent bg-accent text-accent-fg",
                )}
              >
                {t.short}
              </button>
            ))}
          </div>
          <div className="pointer-events-auto hidden flex-wrap gap-1 lg:flex">
            {(THEATER_BY_ID[theaterId]?.jumps.length ? THEATER_BY_ID[theaterId].jumps : JUMP).map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => {
                  setSelectedAlert(null);
                  setSelectedSite(j.id);
                }}
                className={cn(
                  "h-8 border border-border bg-bg/70 px-3 text-xs text-muted backdrop-blur-sm hover:text-fg",
                  selectedSiteId === j.id && "border-accent bg-accent text-accent-fg",
                )}
              >
                {j.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn("pointer-events-none absolute right-3 top-[11.5rem] z-20 md:top-[13.5rem]", deskOpen && "lg:right-[26.2rem]")}>
        <LayerStack
          counts={{
            ai: aiEvents.length,
            reports: allReports.length,
            news: live?.news.length ?? 0,
            fires: firms.length,
            feeds: feeds.length,
            flights: flights.length,
            vessels: vessels.length,
          }}
        />
      </div>

      <div className="pointer-events-none absolute bottom-24 left-3 top-[14rem] z-20 hidden w-60 md:block">
        <div className="pointer-events-auto mb-2 flex flex-wrap items-center gap-1">
          <button
            type="button"
            className="h-8 rounded-full border border-border bg-bg/80 px-3 text-xs text-muted hover:text-fg"
            onClick={() => setLeftOpen((v) => !v)}
          >
            {leftOpen ? "Hide layers" : "Layers"}
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            className="flex size-8 items-center justify-center rounded-full border border-border bg-bg/80 text-muted hover:text-fg"
            onClick={() => mapCommand("in")}
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            className="flex size-8 items-center justify-center rounded-full border border-border bg-bg/80 text-muted hover:text-fg"
            onClick={() => mapCommand("out")}
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-bg/80 px-3 text-xs text-muted hover:text-fg"
            onClick={sweepNow}
            disabled={sweeping}
          >
            <RefreshCw className={cn("size-3.5", sweeping && "animate-spin")} />
            {sweeping ? "Sweeping" : "Sweep now"}
          </button>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-bg/80 px-3 text-xs text-muted hover:text-fg"
            onClick={() => mapMeasure()}
          >
            <Ruler className="size-3.5" />
            Measure
          </button>
        </div>
        {sweepNote ? (
          <p className="pointer-events-none mb-2 rounded-full border border-border bg-bg/80 px-3 py-1 text-[11px] text-fg">
            {sweepNote}
          </p>
        ) : liveError ? (
          <p className="pointer-events-none mb-2 rounded-full border border-damage/40 bg-bg/80 px-3 py-1 text-[11px] text-damage">
            {liveError}
          </p>
        ) : null}
        {leftOpen ? (
          <div className="hud-panel pointer-events-auto h-[min(100%,calc(100dvh-16rem))] overflow-hidden">
            <LeftRail overlay {...railProps} />
          </div>
        ) : null}
        <div className="pointer-events-auto mt-auto">
          {imagery === "dark" ? (
            <ControlLegend open={legendOpen} onToggle={() => setLegendOpen((v) => !v)} />
          ) : null}
          {detectOn ? (
            <DetectPanel report={detectReport} loading={detecting} onOpen={openDetect} />
          ) : null}
        </div>
      </div>

      {deskOpen ? (
        <div className="pointer-events-none absolute bottom-24 right-3 top-[14rem] z-20 hidden w-[24.5rem] lg:block">
          <div className="hud-panel pointer-events-auto flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
              <span className="font-mono text-[10px] tracking-wider text-muted">DOCS</span>
              <button
                type="button"
                className="text-xs text-muted hover:text-fg"
                onClick={() => setDeskOpen(false)}
              >
                Close
              </button>
            </div>
            <RightRail {...rightProps} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="pointer-events-auto absolute bottom-28 right-3 z-20 hidden h-11 items-center gap-2 rounded-full border border-border bg-bg/85 px-4 text-xs text-fg lg:flex"
          onClick={() => openDesk("news")}
        >
          <PanelRight className="size-3.5" />
          Open docs
        </button>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden p-3 md:block">
        <div className="pointer-events-auto mx-auto max-w-5xl">
          <DateStrip
            date={date}
            setDate={setDate}
            compareDate={compareDate}
            setCompareDate={setCompareDate}
            dated={IMAGERY[imagery].dated}
            swipeOn={swipeOn}
            setSwipeOn={setSwipeOn}
            onPickDate={pickDate}
          />
        </div>
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex h-[42vh] flex-col md:hidden">
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border bg-bg/95">
          {tab === "layers" ? <LeftRail {...railProps} /> : <RightRail {...rightProps} force={tab} />}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 border-t border-border bg-bg px-1 py-1.5">
          {([
            ["news", "News", Newspaper],
            ["fuae", "FUAE", Plane],
            ["log", "Log", FileText],
            ["alerts", "Queue", AlertTriangle],
            ["brief", "Brief", ClipboardList],
            ["layers", "Layers", Layers],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => pickMobile(id)}
              className={cn(
                "flex h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-lg text-[10px]",
                tab === id ? "bg-raised text-fg" : "text-muted",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {helpOpen ? (
        <div
          className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-bg/80 p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
          onClick={() => setHelpOpen(false)}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setHelpOpen(false);
          }}
        >
          <div
            className="hud-panel flex max-h-[min(90dvh,36rem)] w-full max-w-lg flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 px-5 pt-5">
              <p className="text-xs uppercase tracking-widest text-subtle">How this works</p>
              <h2 id="help-title" className="mt-1 font-mono text-xl font-medium tracking-tight">
                Abu Hureirah Situation Room
              </h2>
              <p className="mt-1 font-mono text-[11px] tracking-widest text-accent">SUDAN WING</p>
            </div>
            <ol className="min-h-0 flex-1 list-decimal space-y-3 overflow-y-auto px-5 py-4 pl-10 text-sm leading-relaxed text-muted">
              <li>
                <span className="text-fg">Theater chips</span> jump Sudan, Egypt, Ethiopia, Somalia, Chad, Libya, UAE, Eritrea, and the Red Sea corridor. Pins are public sites — bases, yards, ports, crossings — not occupancy.
              </li>
              <li>
                <span className="text-fg">H</span> toggles the HUD overlay. <span className="text-fg">D</span> / <span className="text-fg">DET</span> runs the GEOINT hunt: BDA, cargo, air, sea, vehicles, pads, berms, POL, camps, crossings, tracks, foreign-linked nodes. Boxes are candidates for review — not identifications. Use the basemap picker for real satellite looks.
              </li>
              <li>
                <span className="text-fg">Contacts</span> are live ADS-B plus maritime lane markers that crawl along documented Red Sea / Aden / Suez corridors. Cargo-typical airframes paint amber. Lane markers are NOT live AIS — they move so the maritime picture is not frozen.
              </li>
              <li>
                <span className="text-fg">DOCS</span> opens the news / FUAE / log / brief drawer. It is closed by default so the satellite is not covered. <span className="text-fg">FUAE</span> logs UAE-linked ADS-B and documented UAE–Horn / Red Sea contacts — route observation, not a cargo claim.
              </li>
              <li>
                <span className="text-fg">Basemap picker</span> sits top-left: High-res Esri, Sentinel-2 10 m, VIIRS daily, Dark context, dated HLS. Control shading (SAF cyan / RSF rust / Kordofan gold) is only on the dark map, not on satellite.
              </li>
              <li>
                Documentation archive only. No targeting, fire control, or kill-chain language. Public data.
              </li>
            </ol>
            <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border p-4">
              <button
                type="button"
                className="h-12 rounded-xl bg-accent text-sm font-medium text-accent-fg"
                onClick={() => setHelpOpen(false)}
                onPointerUp={(e) => {
                  e.preventDefault();
                  setHelpOpen(false);
                }}
              >
                Got it — open the map
              </button>
              <Link
                to="/flyer"
                className="flex h-12 items-center justify-center rounded-xl border border-border text-sm text-muted hover:text-fg"
              >
                Flyer / icon copy
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            "pointer-events-auto absolute bottom-40 z-20 hidden size-10 items-center justify-center rounded-full border border-border bg-bg/80 text-muted hover:text-fg lg:flex",
            deskOpen ? "right-[26.2rem]" : "right-3",
          )}
          aria-label="How this works"
          onClick={() => setHelpOpen(true)}
        >
          <CircleHelp className="size-4" />
        </button>
      )}
    </div>
  );
}
