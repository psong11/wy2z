"""Cron entry point — evening capture pass.

Cron line on the Pi:
    0 19 * * * /home/paul/wy2z/.venv/bin/python /home/paul/wy2z/pi5/evening_capture.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from capture import run_capture

try:
    run_capture("evening")
    sys.exit(0)
except Exception as e:
    print(f"FAIL: {e}", file=sys.stderr)
    sys.exit(1)
