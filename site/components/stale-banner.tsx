import { hoursSince } from "@/lib/time";

type Props = {
  lastCapturedAt: string | null; // ISO UTC
};

export function StaleBanner({ lastCapturedAt }: Props) {
  if (!lastCapturedAt) {
    return (
      <div className="bg-slate-800 px-6 py-2 text-center font-mono text-xs uppercase tracking-[0.2em] text-slate-300">
        No observations yet — system is still warming up.
      </div>
    );
  }

  const hours = hoursSince(lastCapturedAt);
  if (hours < 18) return null;

  const tone =
    hours >= 36
      ? "bg-rose-950/70 text-rose-200"
      : "bg-amber-950/70 text-amber-200";

  const label =
    hours >= 36
      ? `No capture in ${Math.round(hours)}h — system may be down.`
      : `Last captured ${Math.round(hours)}h ago.`;

  return (
    <div
      className={`px-6 py-2 text-center font-mono text-xs uppercase tracking-[0.2em] ${tone}`}
      role="status"
    >
      {label}
    </div>
  );
}
