/**
 * Signal coincidence — adapted from hamzahelhafdaoui/War-Probability-OSINT
 * (8-feature fusion). Observation only: coincidence of public signals,
 * not a war-probability, not a forecast, not targeting.
 */
import type { FlightEvent, GdeltEvent, ThermalEvent } from "@/lib/types";
import type { FuaeRecord } from "@/lib/fuae";

export interface Coincidence {
  score: number;
  level: "quiet" | "stir" | "busy" | "clustered";
  parts: Array<{ id: string; label: string; value: number; note: string }>;
  asOf: string;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function signalCoincidence(args: {
  flights: FlightEvent[];
  firms: ThermalEvent[];
  gdelt: GdeltEvent[];
  news: number;
  fuae: FuaeRecord[];
}): Coincidence {
  const cargo = args.flights.filter((f) => /il-76|a124|c-17|c-130|an-12|an-26|l-100|il76/i.test(`${f.typeCode} ${f.notes} ${f.category}`)).length;
  const airlift = clamp01(cargo / 6);
  const tankerish = args.flights.filter((f) => /kc-|tanker|a330|k35/i.test(`${f.typeCode} ${f.notes}`)).length;
  const tanker = clamp01(tankerish / 3);
  const hot = args.firms.filter((t) => (t.frp ?? 0) >= 15 && t.klass !== "agricultural").length;
  const thermal = clamp01(hot / 18);
  const gdelt = clamp01(args.gdelt.length / 40);
  const news = clamp01(args.news / 50);
  const fuaeAir = args.fuae.filter((r) => r.kind === "air").length;
  const fuaeSea = args.fuae.filter((r) => r.kind === "sea").length;
  const bridge = clamp01((fuaeAir + fuaeSea * 0.15) / 8);
  const live = clamp01(args.flights.filter((f) => f.live).length / 24);

  const parts = [
    { id: "airlift", label: "Cargo-typical ADS-B", value: airlift, note: `${cargo} cargo-typical airframes in the live slice` },
    { id: "tanker", label: "Tanker-typical ADS-B", value: tanker, note: `${tankerish} tanker-typical tracks` },
    { id: "thermal", label: "Hot FIRMS (non-ag)", value: thermal, note: `${hot} points FRP ≥ 15, agricultural excluded` },
    { id: "gdelt", label: "GDELT events", value: gdelt, note: `${args.gdelt.length} forwarded events` },
    { id: "news", label: "Headline volume", value: news, note: `${args.news} headlines this cycle` },
    { id: "fuae", label: "UAE→Africa tracks", value: bridge, note: `${fuaeAir} air / ${fuaeSea} sea in FUAE log` },
    { id: "live", label: "Live ADS-B density", value: live, note: `${args.flights.filter((f) => f.live).length} live contacts` },
  ];
  const score = Math.round(
    100 *
      (0.22 * airlift +
        0.08 * tanker +
        0.18 * thermal +
        0.14 * gdelt +
        0.12 * news +
        0.18 * bridge +
        0.08 * live),
  );
  const level = score >= 62 ? "clustered" : score >= 42 ? "busy" : score >= 22 ? "stir" : "quiet";
  return { score, level, parts, asOf: new Date().toISOString() };
}
