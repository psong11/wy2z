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
