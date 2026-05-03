"""End-to-end capture orchestrator for the wy2z plant lab.

Per call:
  1. Read DHT11 air temp/humidity
  2. Push date/time + temp/humidity + "capturing..." to OLED — this lands
     in the camera frame as self-attesting metadata
  3. Trigger Jetson capture over SSH (capture_one.py with --af-dac 3510)
  4. SCP the JPEG back to Pi /tmp, then delete the remote copy
  5. Upload to Supabase Storage
  6. Call Claude vision for structured verdict
  7. Insert observation row tagged with mode (morning/evening/test)
  8. Update OLED with a short verdict summary for any human walking past
  9. Clean up local /tmp file

Run directly:
    python3 pi5/capture.py [--mode test|morning|evening]

Cron entry points are pi5/morning_capture.py and pi5/evening_capture.py —
those wrappers just call run_capture(mode) so cron lines stay readable.

Logs land in /tmp/wy2z-capture.log (in addition to stdout) so cron failures
leave a trail.
"""
from __future__ import annotations

import argparse
import logging
import subprocess
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(HERE.parent / ".env")

from analyze import analyze_photo  # noqa: E402
from lib import dht, oled  # noqa: E402
from lib.db import Db  # noqa: E402

JETSON_HOST = "paul@jetson.local"
JETSON_AF_DAC = 2606  # calibrated 2026-05-03 evening (post camera-shift); rerun ~/wy2z/sweep_focus.py if camera moves
JETSON_CAPTURE_SCRIPT = "~/wy2z/capture_one.py"

LOG_PATH = Path("/tmp/wy2z-capture.log")

log = logging.getLogger("wy2z.capture")


def _setup_logging() -> None:
    if log.handlers:
        return
    log.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)
    log.addHandler(sh)
    fh = logging.FileHandler(LOG_PATH)
    fh.setFormatter(fmt)
    log.addHandler(fh)


def _oled_safe(**kwargs) -> None:
    """Push to OLED, swallowing any error — display problems shouldn't fail the run."""
    try:
        oled.show_status(**kwargs)
    except Exception as e:
        log.warning("oled update failed: %s", e)


def _trigger_jetson_capture(remote_out: str) -> None:
    cmd = [
        "ssh", JETSON_HOST,
        f"python3 {JETSON_CAPTURE_SCRIPT} --out {remote_out} --af-dac {JETSON_AF_DAC}",
    ]
    log.info("jetson capture: ssh %s", cmd[-1])
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"jetson capture failed (rc={result.returncode}): {result.stderr.strip()}")
    log.info("jetson capture stdout: %s", result.stdout.strip())


def _fetch_photo(remote_out: str, local_out: Path) -> None:
    scp_cmd = ["scp", f"{JETSON_HOST}:{remote_out}", str(local_out)]
    result = subprocess.run(scp_cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"scp failed (rc={result.returncode}): {result.stderr.strip()}")
    if not local_out.exists():
        raise RuntimeError(f"scp succeeded but local file missing: {local_out}")
    subprocess.run(
        ["ssh", JETSON_HOST, f"rm -f {remote_out}"],
        capture_output=True, text=True, timeout=10,
    )


def _short_verdict_summary(verdict: dict) -> str:
    """Compact one-line summary for the OLED (max ~36 chars across two lines)."""
    plants = verdict.get("plants", [])
    healths = {p.get("health") for p in plants if p.get("visible")}
    needing_water = [
        p["plant"] for p in plants
        if p.get("action") == "water" and p.get("visible")
    ]
    if "red" in healths:
        return "ALERT: red health"
    if needing_water:
        short = ",".join(p.replace("zinnia_", "z").replace("tomato", "t") for p in needing_water)
        return f"water: {short}"
    if "yellow" in healths:
        return "ok / watch"
    return "all good"


def run_capture(mode: str = "test") -> dict:
    """End-to-end capture pass. Returns {observation_id, verdict}.

    Raises on hard failures (Jetson capture, SCP, upload, analyze, DB insert).
    Soft failures (DHT, OLED) are logged and swallowed.
    """
    _setup_logging()
    log.info("=== run_capture mode=%s ===", mode)

    # 1. DHT11 — soft fail
    temp_c: float | None = None
    humidity: float | None = None
    try:
        reading = dht.read()
        temp_c = reading.temperature_c
        humidity = reading.humidity_pct
        log.info("dht11: %.1fC %.0f%%", temp_c, humidity)
    except RuntimeError as e:
        log.warning("dht11 read failed: %s — proceeding without telemetry", e)

    # 2. OLED frame for self-attesting metadata in the photo
    _oled_safe(temperature_c=temp_c, humidity_pct=humidity, verdict="capturing...")

    # 3 + 4. Jetson capture, fetch back
    ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    fname = f"wy2z_{mode}_{ts}.jpg"
    remote_path = f"/tmp/{fname}"
    local_path = Path(f"/tmp/{fname}")

    try:
        _trigger_jetson_capture(remote_path)
        _fetch_photo(remote_path, local_path)
        log.info("photo on pi: %s (%d bytes)", local_path, local_path.stat().st_size)
    except Exception:
        _oled_safe(temperature_c=temp_c, humidity_pct=humidity, verdict="ERR: capture")
        raise

    # 5. Upload
    db = Db()
    try:
        storage_key, public_url = db.upload_photo(local_path)
        log.info("uploaded: %s", public_url)
    except Exception:
        _oled_safe(temperature_c=temp_c, humidity_pct=humidity, verdict="ERR: upload")
        raise

    # 6. Analyze
    try:
        verdict = analyze_photo(local_path, temp=temp_c, humidity=humidity)
        log.info("verdict: %s", verdict)
    except Exception:
        _oled_safe(temperature_c=temp_c, humidity_pct=humidity, verdict="ERR: analyze")
        raise

    # 7. Insert observation row
    needing_water = [
        p["plant"] for p in verdict.get("plants", [])
        if p.get("action") == "water" and p.get("visible")
    ]
    obs_id = db.insert_observation(
        photo_path=storage_key,
        photo_url=public_url,
        air_temp_c=temp_c,
        air_humidity_pct=humidity,
        verdict=verdict,
        action_taken="logged_only" if needing_water else "none",
        action_payload={"plants_flagged_for_water": needing_water} if needing_water else None,
        action_result="skipped" if needing_water else None,
        notes=f"mode={mode}",
    )
    log.info("observation row: %s", obs_id)

    # 8. OLED — verdict for human inspection
    _oled_safe(
        temperature_c=temp_c,
        humidity_pct=humidity,
        verdict=_short_verdict_summary(verdict),
    )

    # 9. Cleanup local /tmp file
    try:
        local_path.unlink()
    except OSError:
        pass

    return {"observation_id": obs_id, "verdict": verdict}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["test", "morning", "evening"], default="test")
    args = ap.parse_args()
    try:
        result = run_capture(args.mode)
        print(f"OK observation_id={result['observation_id']}")
        return 0
    except Exception as e:
        print(f"FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
