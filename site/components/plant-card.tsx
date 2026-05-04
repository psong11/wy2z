import { PLANT_LABEL, type PlantId, type PlantVerdict } from "@/lib/verdict";
import { formatRelative } from "@/lib/time";

type Props = {
  plantId: PlantId;
  verdict: PlantVerdict | null;
  lastWateredAt: string | null; // ISO UTC of most recent water_<plantId> action_taken
};

const HEALTH_DOT_CLASS: Record<"green" | "yellow" | "red", string> = {
  green: "bg-[var(--color-leaf)]",
  yellow: "bg-amber-400",
  red: "bg-rose-500",
};

const HEALTH_LABEL: Record<"green" | "yellow" | "red", string> = {
  green: "Healthy",
  yellow: "Watch",
  red: "Alert",
};

const MOISTURE_LABEL: Record<string, string> = {
  wet: "Wet soil",
  moist: "Moist soil",
  dry: "Dry soil",
  very_dry: "Very dry soil",
  unknown: "Soil unclear",
};

export function PlantCard({ plantId, verdict, lastWateredAt }: Props) {
  const name = PLANT_LABEL[plantId];

  if (!verdict || !verdict.visible) {
    return (
      <div className="border-t border-slate-700 py-5">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-slate-600" aria-hidden />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
            {name}
          </p>
        </div>
        <p className="mt-2 font-serif text-base text-slate-500 italic">
          Not visible in latest frame.
        </p>
      </div>
    );
  }

  const firstObservation = verdict.observations[0] ?? "";
  const truncated =
    firstObservation.length > 110
      ? firstObservation.slice(0, 107).replace(/[ ,.;:]+$/, "") + "…"
      : firstObservation;

  return (
    <div className="border-t border-slate-700 py-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 rounded-full ${HEALTH_DOT_CLASS[verdict.health]}`}
            aria-hidden
          />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-300">
            {name}
          </p>
        </div>
        <p className="font-mono text-xs text-slate-500">
          {HEALTH_LABEL[verdict.health]} · {Math.round(verdict.confidence * 100)}%
        </p>
      </div>

      <p className="mt-3 font-serif text-base leading-relaxed text-slate-100">
        {truncated}
      </p>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-slate-500">
        <span>{MOISTURE_LABEL[verdict.soil_moisture_guess] ?? "Soil unclear"}</span>
        {verdict.action !== "none" && (
          <span className="text-slate-300">Action: {verdict.action}</span>
        )}
        {lastWateredAt && (
          <span>Watered {formatRelative(lastWateredAt)}</span>
        )}
      </div>
    </div>
  );
}
