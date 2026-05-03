"""Upload one photo + verdict pair to Supabase as a single observation.

Usage:
    python3 upload.py <photo.jpg> <verdict.json>
    python3 upload.py <photo.jpg> <verdict.json> --temp 24.5 --humidity 58

Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from env (or repo-root .env).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

from lib.db import Db


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("photo")
    ap.add_argument("verdict", help="Path to a JSON file produced by analyze.py")
    ap.add_argument("--temp", type=float, default=None)
    ap.add_argument("--humidity", type=float, default=None)
    ap.add_argument("--notes", default=None)
    args = ap.parse_args()

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")

    photo = Path(args.photo).expanduser().resolve()
    verdict_path = Path(args.verdict).expanduser().resolve()
    if not photo.exists():
        print(f"ERROR: photo not found: {photo}", file=sys.stderr)
        return 1
    if not verdict_path.exists():
        print(f"ERROR: verdict not found: {verdict_path}", file=sys.stderr)
        return 1

    verdict = json.loads(verdict_path.read_text())

    # crude action inference from the verdict — Pi orchestrator will replace this
    action_taken = "none"
    plants_needing_water = [
        p["plant"] for p in verdict.get("plants", [])
        if p.get("action") == "water" and p.get("visible")
    ]
    if plants_needing_water:
        action_taken = "logged_only"  # not actually firing servo yet

    db = Db()
    storage_key, public_url = db.upload_photo(photo)
    print(f"  uploaded: {storage_key}")
    print(f"      url:  {public_url}")

    obs_id = db.insert_observation(
        photo_path=storage_key,
        photo_url=public_url,
        air_temp_c=args.temp,
        air_humidity_pct=args.humidity,
        verdict=verdict,
        action_taken=action_taken,
        action_payload={"plants_flagged_for_water": plants_needing_water} or None,
        action_result="skipped" if plants_needing_water else None,
        notes=args.notes,
    )
    print(f"  observation row: {obs_id}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
