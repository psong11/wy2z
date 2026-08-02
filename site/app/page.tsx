import { fetchAllReadings, fetchFirstWateredAt, fetchObservationCount, fetchRecentObservations, type Observation } from "@/lib/observations";
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
import { ProjectClosedNotice } from "@/components/project-closed-notice";

// Fully static — the run is closed and every observation ships with the
// build (content/observations.json). No database, no revalidation.

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
  const [observations, totalCount, firstWateredAt, readings] = await Promise.all([
    fetchRecentObservations(120),
    fetchObservationCount(),
    fetchFirstWateredAt(),
    fetchAllReadings(),
  ]);

  const latest = observations[0] ?? null;
  const oneLiner = latest
    ? buildHeroOneLiner({
        verdict: latest.verdict,
        airTempC: latest.air_temp_c,
        airHumidityPct: latest.air_humidity_pct,
      })
    : "Awaiting first capture.";

  // Photo strip: show every recent capture (newest first), no notes
  // filter and no time cutoff. The horizontal scroll handles volume.
  // Chart shows full history from the lean readings query.
  const stripObservations = observations;

  const chartReadings = readings.map((r) => ({
    capturedAtMs: new Date(r.captured_at).getTime(),
    airTempC: r.air_temp_c,
    airHumidityPct: r.air_humidity_pct,
  }));

  return (
    <main className="min-h-screen">
      <HeroHeader />

      <ProjectClosedNotice />

      {/* Results first: the whole run compressed into a video and the full
          capture gallery. The frozen dashboard view follows the divider. */}
      <section className="mx-auto max-w-[68ch] px-6 pt-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
          The Results · {totalCount} captures over 40 days
        </p>
      </section>

      <TimelapsePlayer
        videoUrl="/plant-photos/timelapse.mp4"
        // Poster is a hand-picked mid-run frame (May 22 midday) where the
        // plants have visibly filled in — reads better as a thumbnail than
        // the latest capture, which was a bare seedling shot early on / a
        // wind-down shot late. Pinned since the project run is closed.
        posterUrl="/plant-photos/2026/05/22/wy2z_midday_2026-05-22_11-30-03.jpg"
        frameCount={totalCount}
      />

      <PhotoStrip observations={stripObservations} />

      {/* The split: results above, the project's dashboard below. */}
      <section className="mx-auto max-w-[68ch] px-6 pt-16">
        <div className="border-t border-slate-700" />
        <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
          The Project · A Live* Glimpse
        </p>
        <p className="mt-2 font-serif text-sm italic text-slate-500">
          *live as of the final capture — June 12, 2026. Below is the
          dashboard exactly as it ran.
        </p>
      </section>

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
