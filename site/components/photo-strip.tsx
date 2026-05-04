import Image from "next/image";
import { formatDateOnly, formatTimeOnly } from "@/lib/time";

type StripPhoto = {
  url: string;
  capturedAt: string; // ISO UTC
  mode: "morning" | "evening" | "test" | string | null;
};

type Props = {
  photos: StripPhoto[];
};

export function PhotoStrip({ photos }: Props) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-slate-700">
      <div className="mx-auto max-w-[68ch] px-6 pt-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
          Recent Captures
        </p>
      </div>
      <div
        className="mt-4 overflow-x-auto px-6 pb-2 [scrollbar-width:thin]"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <ul className="mx-auto flex max-w-[68ch] gap-4">
          {photos.map((photo) => (
            <li
              key={photo.capturedAt + photo.url}
              className="shrink-0 basis-[40%] sm:basis-[28%]"
              style={{ scrollSnapAlign: "start" }}
            >
              <a
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Image
                  src={photo.url}
                  alt={`Capture from ${formatDateOnly(photo.capturedAt)} at ${formatTimeOnly(photo.capturedAt)}`}
                  width={1920}
                  height={1080}
                  sizes="(max-width: 640px) 40vw, 200px"
                  className="h-auto w-full rounded-sm border border-slate-700"
                />
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-500">
                  {formatDateOnly(photo.capturedAt)} · {formatTimeOnly(photo.capturedAt)}
                  {photo.mode && photo.mode !== "test" ? ` · ${photo.mode}` : ""}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
