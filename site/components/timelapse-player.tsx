"use client";

// Click-to-play timelapse below the photo strip. Default state shows a
// pinned mid-run capture as a static thumbnail with a ▶ overlay. On click,
// swap in a <video> with the final MP4 (public/plant-photos/timelapse.mp4,
// last built the night the run closed).

import { useState } from "react";

type Props = {
  videoUrl: string;
  posterUrl: string;
  frameCount: number;
};

export function TimelapsePlayer({ videoUrl, posterUrl, frameCount }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="mx-auto max-w-[68ch] px-6 pt-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
        Timelapse
      </p>
      <p className="mt-2 font-serif text-sm text-slate-500">
        {frameCount} captures stitched at 10 fps. The complete run.
      </p>

      <div className="mt-4 overflow-hidden rounded-sm border border-slate-700 bg-slate-900">
        {playing ? (
          <video
            src={videoUrl}
            poster={posterUrl}
            controls
            autoPlay
            playsInline
            className="block h-auto w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="relative block w-full cursor-pointer"
            aria-label="Play timelapse"
          >
            {/* Use a plain <img> instead of next/image so the poster
                renders at the same DOM box the <video> will replace —
                no layout shift on click. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt="Latest capture, click to play timelapse"
              className="block h-auto w-full opacity-90"
            />
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/40 backdrop-blur-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="ml-1 h-7 w-7 fill-white"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
