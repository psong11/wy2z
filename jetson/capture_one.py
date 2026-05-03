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


def gst_pipeline(exposure_ns: int | None = None,
                 gain: float | None = None,
                 lock_wb: bool = False) -> str:
    """Build the nvarguscamerasrc pipeline. With no args, AE/AWB run free.

    Pass ``exposure_ns`` / ``gain`` to pin them — useful when a bright source
    in frame (the grow-light bulb) drags AE around between captures, which
    bleaches highlight halos and tanks edge contrast on the rest of the scene.
    """
    src_args = ["nvarguscamerasrc"]
    if exposure_ns is not None:
        src_args.append(f'exposuretimerange="{exposure_ns} {exposure_ns}"')
    if gain is not None:
        src_args.append(f'gainrange="{gain} {gain}"')
        src_args.append('ispdigitalgainrange="1 1"')
    if lock_wb:
        src_args.append("awblock=true")
    return (
        f"{' '.join(src_args)} ! "
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
    ap.add_argument("--exposure-ns", type=int, default=None,
                    help="Pin exposure time in nanoseconds (e.g. 16666666 for 1/60s). "
                         "Argus sensor mode supports 13000..683709000.")
    ap.add_argument("--gain", type=float, default=None,
                    help="Pin analog gain (1.0..16.0). Pinning also forces digital gain to 1.")
    ap.add_argument("--lock-wb", action="store_true",
                    help="Lock white balance at stream start (awblock=true).")
    args = ap.parse_args()

    out = Path(os.path.expanduser(args.out))
    out.parent.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(
        gst_pipeline(exposure_ns=args.exposure_ns, gain=args.gain, lock_wb=args.lock_wb),
        cv2.CAP_GSTREAMER,
    )
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
        # Ramp through intermediate stops to land cleanly at the target.
        # A single large set_position() jump produces a softer image even
        # after long settle time — likely VCM overshoot/oscillation that
        # only damps out across multiple settle+flush cycles. Mirroring
        # sweep_focus's per-step (set, sleep, flush) loop fixes it.
        for stop in (args.af_dac // 4, args.af_dac // 2,
                     3 * args.af_dac // 4, args.af_dac):
            focuser.set_position(stop)
            time.sleep(0.3)
            cap.read()
        time.sleep(0.4)
    elif not args.no_af:
        def grab():
            ok, frame = cap.read()
            if not ok:
                raise RuntimeError("camera read failed during AF")
            return frame
        focuser.autofocus(grab)
        time.sleep(0.4)

    cap.read()  # flush one more stale buffered frame
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
