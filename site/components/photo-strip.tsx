import Image from "next/image";
import { formatDateOnly, formatTimeOnly } from "@/lib/time";
import type { Observation } from "@/lib/observations";
import { CaptureAction } from "./capture-action";

type Props = {
  observations: Observation[];
};

function modeOf(obs: Observation): string | null {
  return (obs.notes ?? "").match(/mode=(\w+)/)?.[1] ?? null;
}

export function PhotoStrip({ observations }: Props) {
  if (observations.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="mx-auto max-w-[68ch] px-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
          Every Capture
        </p>
      </div>
      {/* The scroll viewport itself sits inside the 68ch column — the strip
          scrolls within the same margins as the prose, never edge-to-edge. */}
      <div className="mx-auto mt-4 max-w-[68ch] px-6">
        <div
          className="overflow-x-auto pb-2 [scrollbar-width:thin]"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <ul className="flex gap-4">
          {observations.map((obs) => {
            const mode = modeOf(obs);
            return (
              <li
                key={obs.id}
                className="shrink-0 basis-[40%] sm:basis-[28%]"
                style={{ scrollSnapAlign: "start" }}
              >
                <a
                  href={obs.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image
                    src={obs.photo_url}
                    alt={`Capture from ${formatDateOnly(obs.captured_at)} at ${formatTimeOnly(obs.captured_at)}`}
                    width={1920}
                    height={1080}
                    sizes="(max-width: 640px) 40vw, 200px"
                    className="h-auto w-full rounded-sm border border-slate-700"
                  />
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-500">
                    {formatDateOnly(obs.captured_at)} · {formatTimeOnly(obs.captured_at)}
                    {mode && mode !== "test" ? ` · ${mode}` : ""}
                  </p>
                  <div className="mt-1 min-h-[14px]">
                    <CaptureAction observation={obs} variant="compact" />
                  </div>
                </a>
              </li>
            );
          })}
          </ul>
        </div>
      </div>
    </section>
  );
}
