import Image from "next/image";
import { formatAbsolute, formatRelative } from "@/lib/time";

type Props = {
  photoUrl: string;
  capturedAt: string; // ISO UTC
  oneLiner: string;
};

export function HeroPhoto({ photoUrl, capturedAt, oneLiner }: Props) {
  return (
    <section className="mx-auto max-w-[68ch] px-6 pt-2">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
        Most Recent Capture · {formatAbsolute(capturedAt)} CT · {formatRelative(capturedAt)}
      </p>
      <Image
        src={photoUrl}
        alt={`Plant lab — captured ${formatAbsolute(capturedAt)}`}
        width={1920}
        height={1080}
        priority
        className="h-auto w-full rounded-sm border border-slate-700"
        sizes="(max-width: 768px) 100vw, 68ch"
      />
      <figcaption className="mt-4 border-l-2 border-[var(--color-leaf)] pl-4">
        <p className="font-serif text-lg leading-snug text-slate-100 sm:text-xl">
          {oneLiner}
        </p>
      </figcaption>
    </section>
  );
}
