// Pinned card just below the hero. The project ran May → June 2026 and
// is now done — this replaces the SystemDownNotice + StaleBanner pair
// that monitored a live system. Unconditional render: the lab isn't
// coming back, so there's no recovery state to flip to.

export function ProjectClosedNotice() {
  return (
    <section className="mx-auto max-w-[68ch] px-6">
      <div className="rounded-sm border border-slate-700 bg-slate-900/40 px-5 py-5 sm:px-6 sm:py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Archived · 2026-06-12
        </p>
        <h2 className="mt-2 font-serif text-xl text-slate-100">
          The lab has been decommissioned.
        </h2>
        <p className="mt-4 font-serif text-sm leading-relaxed text-slate-300">
          Five weeks unattended, three plants, and a stack of lessons. The
          results are right below — the full timelapse and every capture —{" "}
          <strong className="font-semibold text-slate-100">
            then the dashboard frozen at its final state, the journal, and
            what I learned.
          </strong>
        </p>
      </div>
    </section>
  );
}
