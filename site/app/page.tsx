import { fetchFirstWateredAt, fetchObservationCount, fetchRecentObservations, type Observation } from "@/lib/observations";
import { findPlant, PLANT_ORDER, type PlantId } from "@/lib/verdict";
import { buildHeroOneLiner } from "@/lib/one-liner";
import { HeroHeader } from "@/components/hero-header";
import { HeroPhoto } from "@/components/hero-photo";
import { CaptureAction } from "@/components/capture-action";
import { PlantCard } from "@/components/plant-card";
import { PhotoStrip } from "@/components/photo-strip";
import { TimelapsePlayer } from "@/components/timelapse-player";
import { TempHumidityChart } from "@/components/temp-humidity-chart";
import { HowItWorks } from "@/components/how-it-works";
import { BuildGallery } from "@/components/build-gallery";
import { StatusFooter } from "@/components/status-footer";
import { StaleBanner } from "@/components/stale-banner";

export const revalidate = 1800; // 30 minutes — cron fires every 12h, so 30m
                                // staleness is invisible to a viewer.

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function lastWateredFor(plantId: PlantId, observations: Observation[]): string | null {
  // Three action_taken shapes coexist in the table:
  //   "watered"     — pump actually fired (since 2026-05-06). action_payload
  //                   lists which plants were flagged on that capture.
  //   "water_<id>"  — legacy per-plant variant (not currently produced, kept
  //                   for the schema migration the dashboard was written
  //                   against; cheap to tolerate).
  //   "logged_only" — Claude flagged a plant but pump didn't run (pre-pump
  //                   era, or ESP32 unreachable). Doesn't count as watered.
  // observations are newest-first, so the first match wins.
  for (const obs of observations) {
    const action = obs.action_taken ?? "";
    if (action === "watered") {
      const flagged = (obs.action_payload?.["plants_flagged_for_water"] as string[] | undefined) ?? null;
      if (flagged?.includes(plantId)) return obs.captured_at;
    }
    if (action === `water_${plantId}`) return obs.captured_at;
  }
  return null;
}

export default async function HomePage() {
  const [observations, totalCount, firstWateredAt] = await Promise.all([
    fetchRecentObservations(30),
    fetchObservationCount(),
    fetchFirstWateredAt(),
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

  const stripObservations = recent14
    .filter((o) => (o.notes ?? "").includes("morning") || (o.notes ?? "").includes("evening"))
    .slice(0, 14);
  const stripFallback =
    stripObservations.length === 0 ? observations.slice(0, 14) : stripObservations;

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
        <>
          <HeroPhoto
            photoUrl={latest.photo_url}
            capturedAt={latest.captured_at}
            oneLiner={oneLiner}
          />
          <section className="mx-auto max-w-[68ch] px-6 pt-4">
            <div className="flex items-baseline justify-between gap-4 border-t border-slate-800 pt-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Action Taken
              </p>
              <CaptureAction observation={latest} variant="full" />
            </div>
          </section>
        </>
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

      <PhotoStrip observations={stripFallback} />

      {latest && process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <TimelapsePlayer
          videoUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/plant-photos/timelapse.mp4`}
          posterUrl={latest.photo_url}
          frameCount={totalCount}
        />
      )}

      <HowItWorks />

      <BuildGallery />

      <StatusFooter
        lastCapturedAt={latest?.captured_at ?? null}
        totalObservations={totalCount}
        firstWateredAt={firstWateredAt}
      />
    </main>
  );
}
