import Link from "next/link";
import Narrative from "@/content/narrative.mdx";
import { StatusFooter } from "@/components/status-footer";
import {
  fetchFirstWateredAt,
  fetchObservationCount,
  fetchRecentObservations,
} from "@/lib/observations";


export const metadata = {
  title: "wy2z — the journal",
  description:
    "The build journal for wy2z. A four-device plant lab keeping three plants alive across five unattended weeks, written as it was lived.",
};

export default async function JournalPage() {
  const [observations, totalCount, firstWateredAt] = await Promise.all([
    fetchRecentObservations(1),
    fetchObservationCount(),
    fetchFirstWateredAt(),
  ]);
  const latest = observations[0] ?? null;

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-[68ch] items-center justify-between gap-4 px-6 pt-12 pb-2 sm:pt-16">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-[var(--color-leaf)]"
        >
          ← Live Dashboard
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
          The Build Journal
        </p>
      </div>

      <article className="prose-article mx-auto max-w-[68ch] px-6 pb-24">
        <Narrative />
      </article>

      <StatusFooter
        lastCapturedAt={latest?.captured_at ?? null}
        totalObservations={totalCount}
        firstWateredAt={firstWateredAt}
      />
    </main>
  );
}
