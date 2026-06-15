"""Send a plant-lab photo to Claude Vision and get a structured JSON verdict.

Library:
    from analyze import analyze_photo
    verdict = analyze_photo(Path("foo.jpg"), temp=24.5, humidity=58)

CLI:
    python3 analyze.py path/to/photo.jpg [--temp X --humidity Y]
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from pathlib import Path
from typing import Optional

from anthropic import Anthropic
from dotenv import load_dotenv

MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You are an expert plant care advisor reviewing photos of a small indoor plant lab built by a hobbyist.

The lab contains exactly three plants under a single grow light:
1. **zinnia_a** — a Zinnia elegans seedling, leftmost in the frame
2. **zinnia_b** — a second Zinnia elegans seedling, middle of the frame
3. **tomato** — a Wyches Yellow heirloom indeterminate tomato (Solanum lycopersicum), rightmost. Currently a young seedling in the largest pot. Will eventually be a 6-8 ft vine.

An automated system will use your verdict to decide whether to dispense water on this run. Be decisive but honest about uncertainty.

Pay attention to:
- Leaf color and turgor (wilting, yellowing, browning, curling)
- Visible stem health
- Soil color and texture (lighter / cracked = drier; darker / glistening = wetter)
- Any signs of pests, mold, or fungal disease
- Whether plants are reaching/leaning, suggesting poor light positioning

Return ONLY a JSON object matching this schema. No markdown fences. No preamble. No commentary outside the JSON.

{
  "plants": [
    {
      "plant": "zinnia_a" | "zinnia_b" | "tomato",
      "visible": boolean,
      "health": "green" | "yellow" | "red",
      "observations": [string, ...],
      "soil_moisture_guess": "wet" | "moist" | "dry" | "very_dry" | "unknown",
      "action": "none" | "water" | "inspect",
      "confidence": number
    }
  ],
  "scene_notes": string
}
"""


def encode_image(path: Path) -> tuple[str, str]:
    data = path.read_bytes()
    media_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }.get(path.suffix.lower(), "image/jpeg")
    return base64.standard_b64encode(data).decode("ascii"), media_type


def strip_json_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lstrip().lower().startswith("json"):
            text = text.lstrip()[4:]
    return text.strip()


def analyze_photo(
    photo: Path,
    *,
    temp: Optional[float] = None,
    humidity: Optional[float] = None,
    api_key: Optional[str] = None,
    hint: Optional[str] = None,
) -> dict:
    """Run Claude vision on a photo and return the parsed verdict dict.

    `hint` is an optional operator-supplied paragraph appended verbatim
    to the user message — used for after-the-fact re-analysis when we
    have context the original cron run didn't (e.g. "the system was
    offline for two weeks; what looks like fresh growth may not be
    the intended plants"). Cron callers leave it None.

    Raises:
        FileNotFoundError    if photo doesn't exist
        RuntimeError         if ANTHROPIC_API_KEY is missing
        json.JSONDecodeError if Claude's response wasn't valid JSON
    """
    photo = Path(photo).expanduser().resolve()
    if not photo.exists():
        raise FileNotFoundError(photo)

    api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set (env or .env)")

    image_b64, media_type = encode_image(photo)

    user_text = "Analyze this photo of the plant lab and return your JSON verdict."
    if temp is not None or humidity is not None:
        readings = []
        if temp is not None:
            readings.append(f"air temp = {temp:.1f} °C")
        if humidity is not None:
            readings.append(f"air humidity = {humidity:.0f}%")
        user_text += " Telemetry: " + ", ".join(readings) + "."
    if hint:
        user_text += " " + hint

    client = Anthropic(api_key=api_key)
    msg = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": user_text},
                ],
            }
        ],
    )

    raw = msg.content[0].text
    cleaned = strip_json_fence(raw)
    return json.loads(cleaned)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("photo", help="Path to the JPG to analyze")
    ap.add_argument("--temp", type=float, default=None, help="Air temp °C (DHT11)")
    ap.add_argument("--humidity", type=float, default=None, help="Air humidity %% (DHT11)")
    args = ap.parse_args()

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")

    try:
        verdict = analyze_photo(Path(args.photo), temp=args.temp, humidity=args.humidity)
    except FileNotFoundError as e:
        print(f"ERROR: file not found: {e}", file=sys.stderr)
        return 1
    except RuntimeError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as e:
        print(f"ERROR: Claude did not return valid JSON: {e}", file=sys.stderr)
        return 2

    print(json.dumps(verdict, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
