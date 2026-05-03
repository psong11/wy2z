"""Cron entry point — morning capture pass.

Cron line on the Pi:
    15 7 * * * /home/paul/wy2z/.venv/bin/python /home/paul/wy2z/pi5/morning_capture.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from capture import run_capture

try:
    run_capture("morning")
    sys.exit(0)
except Exception as e:
    print(f"FAIL: {e}", file=sys.stderr)
    sys.exit(1)
