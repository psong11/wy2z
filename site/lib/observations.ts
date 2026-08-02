import observationsData from "@/content/observations.json";
import type { Verdict } from "./verdict";

export type Observation = {
  id: string;
  captured_at: string; // ISO timestamp UTC
  photo_path: string;
  photo_url: string;
  air_temp_c: number | null;
  air_humidity_pct: number | null;
  verdict: Verdict | null;
  action_taken: string | null;
  action_payload: Record<string, unknown> | null;
  action_result: string | null;
  notes: string | null;
};

// The project run is closed (May 3 – June 12, 2026) and the Supabase
// project is decommissioned. Every observation the system ever logged
// lives in content/observations.json (ascending by captured_at), with
// photos served from public/plant-photos/. The functions below keep
// their async signatures so the page code reads the same as it did
// when this was a live database.
const ALL: Observation[] = observationsData as Observation[];

/** Pull the most recent N observations. The dashboard's hero, plant cards,
 *  photo strip, and chart are all derived from this single query. */
export async function fetchRecentObservations(limit = 30): Promise<Observation[]> {
  return [...ALL].reverse().slice(0, limit);
}

/** ISO timestamp of the earliest observation whose pump call actually
 *  fired. Returns null until the first successful watering. Drives the
 *  "First Automated Watering" row in the status footer. */
export async function fetchFirstWateredAt(): Promise<string | null> {
  return ALL.find((o) => o.action_taken === "watered")?.captured_at ?? null;
}

/** Lean read of every observation's temp/humidity over time. Only the
 *  columns the chart actually plots. */
export type Reading = {
  captured_at: string;
  air_temp_c: number | null;
  air_humidity_pct: number | null;
};

export async function fetchAllReadings(): Promise<Reading[]> {
  return ALL.map(({ captured_at, air_temp_c, air_humidity_pct }) => ({
    captured_at,
    air_temp_c,
    air_humidity_pct,
  }));
}

/** Total row count — drives the status footer's "X observations" line. */
export async function fetchObservationCount(): Promise<number> {
  return ALL.length;
}
