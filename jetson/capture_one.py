"""Capture one still photo from the CSI camera with autofocus.

Run on the Jetson. The Pi triggers this over SSH.

Usage:
    python3 capture_one.py --out ~/wy2z_captures/wy2z_2026-05-03_09-00-00.jpg
    python3 capture_one.py --out /tmp/test.jpg --no-af
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

import cv2

from focuser import Focuser

CAPTURE_WIDTH = 1920
CAPTURE_HEIGHT = 1080
WARMUP_FRAMES = 20  # nvargus needs ~1s to lock AE/AWB


def gst_pipeline() -> str:
    return (
        f"nvarguscamerasrc ! "
        f"video/x-raw(memory:NVMM),width={CAPTURE_WIDTH},height={CAPTURE_HEIGHT},framerate=30/1 ! "
        f"nvvidconv ! video/x-raw,format=BGRx ! "
        f"videoconvert ! video/x-raw,format=BGR ! appsink"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="Output JPEG path")
    ap.add_argument("--no-af", action="store_true", help="Skip autofocus (faster, uses last DAC)")
    ap.add_argument("--af-dac", type=int, default=None,
                    help="Use a fixed DAC value instead of running AF (e.g. 1840)")
    args = ap.parse_args()

    out = Path(os.path.expanduser(args.out))
    out.parent.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(gst_pipeline(), cv2.CAP_GSTREAMER)
    if not cap.isOpened():
        print("ERROR: could not open CSI camera", file=sys.stderr)
        return 1

    # Warm up — let AE / AWB settle before AF measures sharpness
    for _ in range(WARMUP_FRAMES):
        ok, _ = cap.read()
        if not ok:
            print("ERROR: camera read failed during warmup", file=sys.stderr)
            cap.release()
            return 1

    focuser = Focuser(verbose=False)
    focuser.init()

    if args.af_dac is not None:
        focuser.set_position(args.af_dac)
        time.sleep(0.3)
    elif not args.no_af:
        def grab():
            ok, frame = cap.read()
            if not ok:
                raise RuntimeError("camera read failed during AF")
            return frame
        focuser.autofocus(grab)

    # Final still — discard one to flush any stale buffered frame
    cap.read()
    ok, frame = cap.read()
    if not ok:
        print("ERROR: final capture failed", file=sys.stderr)
        cap.release()
        return 1

    cv2.imwrite(str(out), frame, [cv2.IMWRITE_JPEG_QUALITY, 92])

    focuser.park()
    cap.release()

    print(str(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
