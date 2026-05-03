"""Diagnostic: capture a still at each of N DAC positions across the AF range.

Use this when AF is failing to converge — see which DAC gives a sharp photo
on your scene, then pin that value with `capture_one.py --af-dac <N>`.

Usage:
    python3 sweep_focus.py --out-dir ~/wy2z_captures/sweep --steps 8
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

import cv2

from focuser import Focuser, DAC_MIN, DAC_MAX, tenengrad

CAPTURE_WIDTH = 1920
CAPTURE_HEIGHT = 1080
WARMUP_FRAMES = 20


def gst_pipeline() -> str:
    return (
        f"nvarguscamerasrc ! "
        f"video/x-raw(memory:NVMM),width={CAPTURE_WIDTH},height={CAPTURE_HEIGHT},framerate=30/1 ! "
        f"nvvidconv ! video/x-raw,format=BGRx ! "
        f"videoconvert ! video/x-raw,format=BGR ! appsink"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--steps", type=int, default=8, help="Number of DAC positions to sample")
    args = ap.parse_args()

    out_dir = Path(os.path.expanduser(args.out_dir))
    out_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(gst_pipeline(), cv2.CAP_GSTREAMER)
    if not cap.isOpened():
        print("ERROR: could not open CSI camera", file=sys.stderr)
        return 1

    for _ in range(WARMUP_FRAMES):
        cap.read()

    focuser = Focuser(verbose=False)
    focuser.init()

    dacs = [int(round(i * (DAC_MAX - DAC_MIN) / (args.steps - 1))) for i in range(args.steps)]

    print(f"Sweeping {len(dacs)} DAC positions: {dacs}")
    print(f"{'dac':>6}  {'tenengrad':>10}  filename")

    for dac in dacs:
        focuser.set_position(dac)
        time.sleep(0.4)
        cap.read()  # flush
        ok, frame = cap.read()
        if not ok:
            print(f"  dac={dac}: capture FAILED", file=sys.stderr)
            continue
        score = tenengrad(frame)
        path = out_dir / f"dac_{dac:04d}.jpg"
        cv2.imwrite(str(path), frame, [cv2.IMWRITE_JPEG_QUALITY, 92])
        print(f"  {dac:>5}  {score:>10.2f}  {path.name}")

    focuser.park()
    cap.release()
    print(f"\nDone. Files in {out_dir}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
