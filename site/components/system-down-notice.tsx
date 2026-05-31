import { hoursSince, formatRelative } from "@/lib/time";

// Shown at the top of the dashboard when the Pi has been silent long enough
// that this is almost certainly a real outage, not a delayed cron run. The
// thin <StaleBanner> above already covers the soft (18-36h) window; this
// card is for the "ok yeah it's actually broken" tier. Hides itself once a
// fresh observation lands, so post-recovery there's nothing to clean up.

const THRESHOLD_HOURS = 36;

type Props = {
  lastCapturedAt: string | null;
};

export function SystemDownNotice({ lastCapturedAt }: Props) {
  if (!lastCapturedAt) return null;
  const hours = hoursSince(lastCapturedAt);
  if (hours < THRESHOLD_HOURS) return null;

  return (
    <section className="mx-auto mt-6 max-w-[68ch] px-6">
      <div className="rounded-sm border border-rose-900/70 bg-rose-950/40 px-5 py-5 sm:px-6 sm:py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rose-300/80">
          System Status · last seen {formatRelative(lastCapturedAt)}
        </p>
        <h2 className="mt-2 font-serif text-xl text-rose-100">
          uhhhh, so yeah, looks like the system is down.
        </h2>

        <p className="mt-4 font-serif text-sm text-rose-100/90">
          here are some potential reasons why:
        </p>
        <ul className="mt-2 space-y-1.5 font-serif text-sm text-rose-100/80">
          <li>
            <span className="text-rose-200">SD card corruption.</span>{" "}
            The Pi has been writing to the same flash cells 4×/day for weeks.
            One bad sector flips the root filesystem read-only and the next
            cron run can&apos;t do anything.
          </li>
          <li>
            <span className="text-rose-200">Marginal USB-C power.</span>{" "}
            A non-PD brick + a fridge compressor kicking on = brown-out = Pi
            hard-resets. Sometimes survives, sometimes not.
          </li>
          <li>
            <span className="text-rose-200">Apartment power or ISP outage.</span>{" "}
            Late-May thunderstorms in NW Arkansas. A 5-minute power blip looks
            exactly like this to the dashboard.
          </li>
          <li>
            <span className="text-rose-200">Wi-Fi driver wedged.</span>{" "}
            Pi 5&apos;s onboard radio occasionally locks up after long uptime —
            kernel doesn&apos;t notice, NetworkManager doesn&apos;t recover.
          </li>
        </ul>

        <p className="mt-5 font-serif text-sm italic text-rose-200/80">
          i think im going to come back to two dead zinnias and the tomato
          plant in a grass field lol
        </p>
      </div>
    </section>
  );
}
