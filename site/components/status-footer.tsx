import Link from "next/link";
import { formatAbsolute, formatRelative } from "@/lib/time";

const REPO_URL = "https://github.com/psong11/wy2z";

type Props = {
  lastCapturedAt: string | null; // ISO UTC
  totalObservations: number;
};

export function StatusFooter({ lastCapturedAt, totalObservations }: Props) {
  const rows: ReadonlyArray<readonly [string, React.ReactNode]> = [
    [
      "Last Capture",
      lastCapturedAt
        ? `${formatAbsolute(lastCapturedAt)} CT · ${formatRelative(lastCapturedAt)}`
        : "—",
    ],
    [
      "Captures Logged",
      totalObservations.toLocaleString("en-US"),
    ],
    [
      "Cadence",
      "07:30 · 19:30 CT — twice daily",
    ],
    [
      "Journal",
      <Link
        key="journal"
        href="/journal"
        className="underline decoration-slate-600 underline-offset-4 hover:decoration-[var(--color-leaf)]"
      >
        the build journal
      </Link>,
    ],
    [
      "Repo",
      <a
        key="repo"
        href={REPO_URL}
        className="underline decoration-slate-600 underline-offset-4 hover:decoration-[var(--color-leaf)]"
      >
        github.com/psong11/wy2z
      </a>,
    ],
  ];

  return (
    <footer className="mt-16 border-t border-slate-700 bg-slate-950/40">
      <dl className="mx-auto max-w-[68ch] divide-y divide-slate-800 px-6">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[7rem_1fr] items-baseline gap-4 py-4 sm:grid-cols-[8rem_1fr]"
          >
            <dt className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
              {label}
            </dt>
            <dd className="font-serif text-base leading-snug text-slate-200">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-[68ch] px-6 py-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
            Paul Song · May 2026
          </p>
          <p className="mt-2 font-serif text-sm text-slate-400">
            Cron is the moment the system stops needing me.
          </p>
        </div>
      </div>
    </footer>
  );
}
