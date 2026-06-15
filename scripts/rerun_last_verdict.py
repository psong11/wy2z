"""Re-run Claude vision on the most recent observation's photo with
an operator-supplied context hint, then UPDATE the same row's verdict
in place. The row id, captured_at, photo, and telemetry stay exactly
as they were — only the JSON verdict is rewritten.

Why this exists: the final capture of the run (2026-06-12 00:36 CT)
was taken right after the system came back online from a 15-day
network outage. Claude had no way to know about the outage and so
read the visible green growth as a healthy tomato. The grass that
came up in the substrate during the gap looks plausibly tomato-like
in a wide-frame photo. This script gives Claude that missing context
and asks for a re-evaluation so the dashboard reflects reality
without us hand-writing words and putting them in Claude's mouth.

Run from the repo root with the project venv active, or invoke the
venv python directly:

    .venv/bin/python scripts/rerun_last_verdict.py
"""
from __future__ import annotations

import json
import sys
import tempfile
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / "pi5"))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / ".env")

from analyze import analyze_photo  # noqa: E402
from lib.db import Db  # noqa: E402

HINT = (
    "Operator note added after this capture was taken: from 2026-05-27 "
    "to 2026-06-11 the lab's automated watering pipeline was silently "
    "broken — a stale SSH override meant the Pi could not reach the "
    "Jetson, so no captures and no waterings happened for about 15 "
    "days. During that gap the soil dried out completely. By the time "
    "the system came back online (this is the very next capture after "
    "the fix) the original Wyches Yellow tomato and both zinnia "
    "seedlings had likely died of drought. Any vigorous green growth "
    "visible in this frame is probably contamination grass that came "
    "up in the substrate during the unattended period, not the "
    "intended plants. Re-evaluate with this context — describe what "
    "you actually see, and where possible distinguish surviving "
    "original plant tissue from new grass growth."
)


def main() -> int:
    db = Db()
    client = db._client  # tap the underlying supabase-py client directly

    result = (
        client.table("observations")
        .select(
            "id, photo_path, photo_url, air_temp_c, air_humidity_pct, captured_at, verdict"
        )
        .order("captured_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        print("ERROR: no observations found", file=sys.stderr)
        return 1
    obs = result.data[0]
    print(f"Latest observation:")
    print(f"  id          {obs['id']}")
    print(f"  captured_at {obs['captured_at']}")
    print(f"  photo_url   {obs['photo_url']}")

    print("\nDownloading photo...")
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        urllib.request.urlretrieve(obs["photo_url"], tmp.name)
        photo_path = Path(tmp.name)
    print(f"  {photo_path.stat().st_size} bytes -> {photo_path}")

    print("\nCalling Claude with operator hint...")
    new_verdict = analyze_photo(
        photo_path,
        temp=obs.get("air_temp_c"),
        humidity=obs.get("air_humidity_pct"),
        hint=HINT,
    )
    print("\nNew verdict:")
    print(json.dumps(new_verdict, indent=2))

    print("\nUpdating observation row...")
    upd = (
        client.table("observations")
        .update({"verdict": new_verdict})
        .eq("id", obs["id"])
        .execute()
    )
    print(f"  rows updated: {len(upd.data or [])}")

    photo_path.unlink(missing_ok=True)
    print("\nDone. Next: POST /api/revalidate to flush the dashboard cache.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
