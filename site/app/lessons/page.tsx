import Link from "next/link";
import {
  fetchFirstWateredAt,
  fetchObservationCount,
  fetchRecentObservations,
} from "@/lib/observations";
import { StatusFooter } from "@/components/status-footer";


export const metadata = {
  title: "wy2z — lessons",
  description:
    "Hard-won lessons from building wy2z. Mostly the systems-thinking kind, written so I don't make the same mistake twice.",
};

type Lesson = {
  title: string;
  body: React.ReactNode;
  jargon?: string;
};

const META: Lesson = {
  title: "most outages aren't broken code. they're broken assumptions.",
  body: (
    <>
      <p>
        When wy2z went silent for fifteen days in late May 2026, I assumed the
        Pi had crashed. It hadn&apos;t. It had been up for 36 days straight,
        cron firing every 4 hours, sensors reading fine, disk healthy at 7%.
        The Jetson was up for 39 days. Neither device had a single hardware
        problem.
      </p>
      <p className="mt-3">
        What actually broke was a single line in a config file that said
        &ldquo;the Jetson lives at 192.168.0.224.&rdquo; That was true the day
        the line was written. A month later, during a thunderstorm, the router
        rebooted and the Jetson came back at <code>.225</code>. Nothing in the
        system changed. The system&apos;s <em>picture of the world</em> changed.
      </p>
      <p className="mt-3 text-slate-300">
        Hardware reliability is the easy problem — you can measure it. Assumption
        reliability is the hard problem, and it&apos;s where most real outages
        hide.
      </p>
    </>
  ),
  jargon: "stale state · latent bugs · implicit contracts",
};

const LESSONS: Lesson[] = [
  {
    title: "self-healing > deterministic",
    body: (
      <>
        A hardcoded IP says <em>&ldquo;the answer is X, forever.&rdquo;</em>
        {" "}Name-based addressing (mDNS, DNS) asks <em>&ldquo;what&apos;s the
        answer right now?&rdquo;</em> every call. The first is faster by
        milliseconds. The second is faster by weeks-of-outage.
      </>
    ),
    jargon: "mDNS · service discovery · idempotency",
  },
  {
    title: "band-aids become load-bearing",
    body: (
      <>
        The IP override was added during unrelated troubleshooting back in May
        as &ldquo;extra insurance.&rdquo; The real fix landed elsewhere, but
        the band-aid stuck around. A month later it was the only thing the
        pipeline silently depended on. Every temporary fix is forever unless
        you delete it deliberately.
      </>
    ),
    jargon: "technical debt · workaround rot",
  },
  {
    title: "hidden state is invisible failure",
    body: (
      <>
        The wrong IP lived in one config file on one device, never logged,
        never surfaced anywhere a human or dashboard could see it. It could
        have been wrong from the moment it was written and nobody would have
        known. State you can&apos;t see is state that can rot.
      </>
    ),
    jargon: "observability · single source of truth",
  },
  {
    title: "silent failure is the worst failure",
    body: (
      <>
        When the SSH step broke, the pipeline aborted and wrote zero
        observation rows. From the dashboard, that looked identical to
        &ldquo;the entire Pi is dead.&rdquo; If the system had written a row
        that just said <code>error: jetson_unreachable</code>, I&apos;d have
        diagnosed it from anywhere in 5 minutes. Make your system tell you
        what broke.
      </>
    ),
    jargon: "structured errors · graceful degradation",
  },
  {
    title: "pin things at the source of truth",
    body: (
      <>
        If the Jetson genuinely needs a stable IP, the <em>router</em> is the
        right place to bind it (a DHCP reservation tied to its MAC address) —
        not a config file on the client. One source of truth, observable from
        anywhere on the network, no copies that can drift.
      </>
    ),
    jargon: "DHCP reservation · single source of truth",
  },
  {
    title: "check the things you actually care about",
    body: (
      <>
        <em>&ldquo;Is the Pi alive?&rdquo;</em> is the easy question — and was
        trivially yes the entire time. <em>&ldquo;Can the Pi still reach the
        Jetson?&rdquo;</em> was the question that mattered, and was never
        checked anywhere. Health checks should verify the
        <em> relationships</em> between parts, not just the parts.
      </>
    ),
    jargon: "liveness vs. readiness · end-to-end probes",
  },
];

const ARCH_NOTE: Lesson = {
  title: "orchestrator + worker — why one computer bosses another around",
  body: (
    <>
      <p>
        The Pi tells the Jetson when to take a photo via SSH. It sounds wild —
        one computer remote-controlling another every 4 hours — but it&apos;s a
        standard distributed-systems pattern. Each device does the one thing
        it&apos;s best at: Pi handles cron + sensors + cloud uploads + watering
        triggers, Jetson handles the camera + autofocus.
      </p>
      <p className="mt-3 text-slate-300">
        The cost of the split: the network hop between the two devices is now a
        failure surface neither machine alone can cause. That hop is exactly
        what bit me on May 27. <em>Whatever your architecture splits across
        machines becomes a new boundary that can break.</em>
      </p>
    </>
  ),
  jargon: "orchestrator · worker · separation of concerns",
};

function LessonCard({ lesson, accent }: { lesson: Lesson; accent?: boolean }) {
  return (
    <article
      className={`rounded-sm border px-5 py-6 sm:px-7 sm:py-7 ${
        accent
          ? "border-[var(--color-leaf)]/40 bg-slate-900/60"
          : "border-slate-800 bg-slate-950/40"
      }`}
    >
      <h2 className="font-serif text-lg leading-snug text-slate-100 sm:text-xl">
        {lesson.title}
      </h2>
      <div className="mt-3 font-serif text-sm leading-relaxed text-slate-300 sm:text-base">
        {lesson.body}
      </div>
      {lesson.jargon && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
          {lesson.jargon}
        </p>
      )}
    </article>
  );
}

export default async function LessonsPage() {
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
          Lessons
        </p>
      </div>

      <section className="mx-auto max-w-[68ch] px-6 pt-8 pb-4">
        <h1 className="font-serif text-3xl leading-tight text-slate-100 sm:text-4xl">
          what wy2z has taught me
        </h1>
        <p className="mt-4 font-serif text-base leading-relaxed text-slate-300">
          A running list of the hard-won kind — mostly about systems thinking,
          since that&apos;s where the surprises keep coming from. Each entry is
          a real moment that bit me, written so I don&apos;t forget the shape of
          the bite.
        </p>
      </section>

      <section className="mx-auto max-w-[68ch] px-6 pt-4 pb-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
          The frame everything hangs on
        </p>
        <div className="mt-3">
          <LessonCard lesson={META} accent />
        </div>
      </section>

      <section className="mx-auto max-w-[68ch] px-6 pt-8 pb-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
          Tactical lessons
        </p>
        <div className="mt-3 flex flex-col gap-4">
          {LESSONS.map((l) => (
            <LessonCard key={l.title} lesson={l} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[68ch] px-6 pt-10 pb-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
          Architecture note (not a lesson, a pattern)
        </p>
        <div className="mt-3">
          <LessonCard lesson={ARCH_NOTE} />
        </div>
      </section>

      <StatusFooter
        lastCapturedAt={latest?.captured_at ?? null}
        totalObservations={totalCount}
        firstWateredAt={firstWateredAt}
      />
    </main>
  );
}
