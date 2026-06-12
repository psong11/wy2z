import { supabase } from "./supabase";
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

/** Pull the most recent N observations. The dashboard's hero, plant cards,
 *  photo strip, and chart are all derived from this single query. */
export async function fetchRecentObservations(limit = 30): Promise<Observation[]> {
  const { data, error } = await supabase
    .from("observations")
    .select(
      "id, captured_at, photo_path, photo_url, air_temp_c, air_humidity_pct, verdict, action_taken, action_payload, action_result, notes",
    )
    .order("captured_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[wy2z] fetchRecentObservations failed", error);
    return [];
  }
  return (data ?? []) as Observation[];
}

/** ISO timestamp of the earliest observation whose pump call actually
 *  fired. Returns null until the first successful watering. Drives the
 *  "First Automated Watering" row in the status footer. */
export async function fetchFirstWateredAt(): Promise<string | null> {
  const { data, error } = await supabase
    .from("observations")
    .select("captured_at")
    .eq("action_taken", "watered")
    .order("captured_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("[wy2z] fetchFirstWateredAt failed", error);
    return null;
  }
  return data?.[0]?.captured_at ?? null;
}

/** Lean read of every observation's temp/humidity over time. Only fetches
 *  the columns the chart actually plots — keeps payload small enough to
 *  pull the whole history (years of 4×/day captures fit in the limit). */
export type Reading = {
  captured_at: string;
  air_temp_c: number | null;
  air_humidity_pct: number | null;
};

export async function fetchAllReadings(): Promise<Reading[]> {
  const { data, error } = await supabase
    .from("observations")
    .select("captured_at, air_temp_c, air_humidity_pct")
    .order("captured_at", { ascending: true })
    .limit(5000); // ~3 years at 4×/day; plenty of headroom

  if (error) {
    console.error("[wy2z] fetchAllReadings failed", error);
    return [];
  }
  return (data ?? []) as Reading[];
}

/** Total row count — drives the status footer's "X observations" line. */
export async function fetchObservationCount(): Promise<number> {
  const { count, error } = await supabase
    .from("observations")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[wy2z] fetchObservationCount failed", error);
    return 0;
  }
  return count ?? 0;
}
