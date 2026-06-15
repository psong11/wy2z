// The page-level title block. Distinct from the photo + caption, so the
// project framing reads first and the live state reads as live state.

export function HeroHeader() {
  return (
    <section className="mx-auto max-w-[68ch] px-6 pt-16 pb-4 sm:pt-24">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
        A Live Plant Lab · May 2026
      </p>
      <h1 className="font-serif text-[3rem] font-medium leading-[1] tracking-tight text-slate-50 sm:text-[4rem]">
        wy2z
      </h1>
      <p className="mt-5 font-serif text-xl leading-relaxed text-slate-400 sm:text-2xl">
        A four-device plant lab built to keep a Wyches Yellow tomato and two
        zinnias alive while I was out of town.
      </p>
    </section>
  );
}
