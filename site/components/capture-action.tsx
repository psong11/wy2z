// Surfaces what physically happened (or didn't) at a given capture moment.
// Reads action_taken / action_payload / action_result from a single
// observation row and renders one of four states:
//
//   watered          — pump fired successfully (action_taken="watered")
//   flagged_only     — Claude said water, pump was unreachable / not yet wired
//   watering_failed  — pump call failed (e.g., esp32_unreachable)
//   no_action        — nothing flagged; system is idle and that's fine
//
// Shapes:
//   - "full"    — a leaf-accent line for the hero
//   - "compact" — a small pill for photo-strip thumbnails
//
// Old observations (pre-2026-05-06) carry action_taken="logged_only" without
// the new water_response payload — those classify as flagged_only.

import type { Observation } from "@/lib/observations";
import { PLANT_LABEL, type PlantId } from "@/lib/verdict";

type Props = {
  observation: Observation;
  variant?: "full" | "compact";
};

type Classification =
  | { kind: "watered"; plants: PlantId[]; durationMs: number | null }
  | { kind: "flagged_only"; plants: PlantId[] }
  | { kind: "watering_failed"; plants: PlantId[]; reason: string }
  | { kind: "no_action" };

function classify(obs: Observation): Classification {
  const action = obs.action_taken ?? "";
  const payload = obs.action_payload ?? {};
  const flagged = (payload["plants_flagged_for_water"] as PlantId[] | undefined) ?? [];
  const result = obs.action_result ?? "";

  if (action === "watered") {
    const waterResp = payload["water_response"] as Record<string, unknown> | undefined;
    const rawDuration = waterResp?.["duration_ms"];
    const durationMs = typeof rawDuration === "number" ? rawDuration : null;
    return { kind: "watered", plants: flagged, durationMs };
  }

  if (action === "logged_only") {
    if (result.startsWith("esp32_unreachable") || result.startsWith("error")) {
      return { kind: "watering_failed", plants: flagged, reason: result };
    }
    return { kind: "flagged_only", plants: flagged };
  }

  return { kind: "no_action" };
}

function plantNames(plants: PlantId[]): string {
  if (plants.length === 0) return "";
  return plants.map((p) => PLANT_LABEL[p]).join(", ");
}

export function CaptureAction({ observation, variant = "full" }: Props) {
  const c = classify(observation);

  if (variant === "compact") {
    if (c.kind === "no_action") return null;
    const styles =
      c.kind === "watered"
        ? "border-[var(--color-leaf)] text-[var(--color-leaf)]"
        : c.kind === "watering_failed"
          ? "border-rose-400 text-rose-300"
          : "border-amber-400 text-amber-300";
    const label =
      c.kind === "watered" ? "watered" : c.kind === "watering_failed" ? "fail" : "flagged";
    return (
      <span
        className={`inline-block rounded-sm border px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.15em] ${styles}`}
      >
        {label}
      </span>
    );
  }

  // full variant
  if (c.kind === "watered") {
    const names = plantNames(c.plants);
    const seconds = c.durationMs != null ? (c.durationMs / 1000).toFixed(1) : null;
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-leaf)]">
        ✓ Pump fired{names ? ` · ${names}` : ""}
        {seconds ? ` · ${seconds}s pulse` : ""}
      </p>
    );
  }
  if (c.kind === "watering_failed") {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rose-300">
        ⚠ Watering failed{c.plants.length ? ` · ${plantNames(c.plants)}` : ""}
      </p>
    );
  }
  if (c.kind === "flagged_only") {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300">
        Flagged for water{c.plants.length ? ` · ${plantNames(c.plants)}` : ""} · pump did not run
      </p>
    );
  }
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
      No action — verdict logged
    </p>
  );
}
