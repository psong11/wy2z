"""Cron entry point — afternoon capture pass.

Cron line on the Pi:
    30 16 * * * /home/paul/wy2z/.venv/bin/python /home/paul/wy2z/pi5/afternoon_capture.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from capture import run_capture

try:
    run_capture("afternoon")
    sys.exit(0)
except Exception as e:
    print(f"FAIL: {e}", file=sys.stderr)
    sys.exit(1)
