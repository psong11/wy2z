import { fetchObservationCount, fetchRecentObservations, type Observation } from "@/lib/observations";
import { findPlant, PLANT_ORDER, type PlantId } from "@/lib/verdict";
import { buildHeroOneLiner } from "@/lib/one-liner";
import { HeroHeader } from "@/components/hero-header";
import { HeroPhoto } from "@/components/hero-photo";
import { PlantCard } from "@/components/plant-card";
import { PhotoStrip } from "@/components/photo-strip";
import { TempHumidityChart } from "@/components/temp-humidity-chart";
import { HowItWorks } from "@/components/how-it-works";
import { StatusFooter } from "@/components/status-footer";
import { StaleBanner } from "@/components/stale-banner";

export const revalidate = 1800; // 30 minutes — cron fires every 12h, so 30m
                                // staleness is invisible to a viewer.

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function lastWateredFor(plantId: PlantId, observations: Observation[]): string | null {
  // action_taken is e.g. "water_tomato" or "logged_only" or "none". Pi-side
  // capture.py currently writes "logged_only" with action_payload listing the
  // flagged plants; once the pump's wired (2026-05-05) it will write actual
  // per-plant water actions. Tolerate both shapes.
  for (const obs of observations) {
    const action = obs.action_taken ?? "";
    if (action === `water_${plantId}`) return obs.captured_at;
    const flagged = (obs.action_payload?.["plants_flagged_for_water"] as string[] | undefined) ?? null;
    if (action === "logged_only" && flagged?.includes(plantId)) {
      // logged_only means we'd have watered if pump existed — count it as
      // "intent" but not "watered". Skip.
      continue;
    }
  }
  return null;
}

export default async function HomePage() {
  const [observations, totalCount] = await Promise.all([
    fetchRecentObservations(30),
    fetchObservationCount(),
  ]);

  const latest = observations[0] ?? null;
  const oneLiner = latest
    ? buildHeroOneLiner({
        verdict: latest.verdict,
        airTempC: latest.air_temp_c,
        airHumidityPct: latest.air_humidity_pct,
      })
    : "Awaiting first capture.";

  const cutoff = Date.now() - FOURTEEN_DAYS_MS;
  const recent14 = observations.filter(
    (o) => new Date(o.captured_at).getTime() >= cutoff,
  );

  const stripPhotos = recent14
    .filter((o) => (o.notes ?? "").includes("morning") || (o.notes ?? "").includes("evening"))
    .slice(0, 14)
    .map((o) => ({
      url: o.photo_url,
      capturedAt: o.captured_at,
      mode: ((o.notes ?? "").match(/mode=(\w+)/)?.[1] ?? null),
    }));

  const stripFallback = stripPhotos.length === 0
    ? observations.slice(0, 14).map((o) => ({
        url: o.photo_url,
        capturedAt: o.captured_at,
        mode: ((o.notes ?? "").match(/mode=(\w+)/)?.[1] ?? null),
      }))
    : stripPhotos;

  const chartReadings = [...recent14]
    .reverse() // oldest → newest for left-to-right time axis
    .map((o) => ({
      capturedAtMs: new Date(o.captured_at).getTime(),
      airTempC: o.air_temp_c,
      airHumidityPct: o.air_humidity_pct,
    }));

  return (
    <main className="min-h-screen">
      <StaleBanner lastCapturedAt={latest?.captured_at ?? null} />

      <HeroHeader />

      {latest ? (
        <HeroPhoto
          photoUrl={latest.photo_url}
          capturedAt={latest.captured_at}
          oneLiner={oneLiner}
        />
      ) : (
        <section className="mx-auto max-w-[68ch] px-6 pt-4 pb-12">
          <p className="font-serif text-base text-slate-400">
            No observations yet. The Pi will fire its first capture at the
            next cron interval.
          </p>
        </section>
      )}

      {latest?.verdict && (
        <section className="mx-auto max-w-[68ch] px-6 pt-12 pb-2">
          {PLANT_ORDER.map((id) => (
            <PlantCard
              key={id}
              plantId={id}
              verdict={findPlant(latest.verdict, id)}
              lastWateredAt={lastWateredFor(id, observations)}
            />
          ))}
          {/* trailing border for visual symmetry */}
          <div className="border-t border-slate-700" />
        </section>
      )}

      {latest?.verdict?.scene_notes && (
        <section className="mx-auto max-w-[68ch] px-6 pt-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
            Scene Notes
          </p>
          <p className="mt-3 font-serif text-base leading-relaxed text-slate-300">
            {latest.verdict.scene_notes}
          </p>
        </section>
      )}

      <TempHumidityChart readings={chartReadings} />

      <PhotoStrip photos={stripFallback} />

      <HowItWorks />

      <StatusFooter
        lastCapturedAt={latest?.captured_at ?? null}
        totalObservations={totalCount}
      />
    </main>
  );
}
