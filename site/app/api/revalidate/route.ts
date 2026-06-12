// Invalidate cached pages on demand. The Pi POSTs here right after writing
// a new observation row, so the dashboard refreshes within seconds instead
// of waiting on the ISR `revalidate = 1800` schedule.
//
// Lesson behind this route, in case you forget why it exists: the
// time-based revalidate was the same shape of bug as the SSH config
// override and the trip-aware prompt — a cached assumption about a moving
// world. On-demand revalidation removes the guess and lets the source of
// truth (the Pi) tell the dashboard when its world changed.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PATHS = ["/", "/journal", "/lessons"];

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  for (const path of PATHS) {
    revalidatePath(path);
  }

  return NextResponse.json({ ok: true, revalidated: PATHS, at: new Date().toISOString() });
}
