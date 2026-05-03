"""SSD1306 OLED display driver for the wy2z status panel.

128x64 monochrome OLED on I2C-1 at 0x3C. Wired:
  VCC → Pi 3V3 (pin 17)
  GND → Pi GND  (pin 25 or any GND)
  SCL → Pi GPIO 3 (pin 5, I2C1 SCL)
  SDA → Pi GPIO 2 (pin 3, I2C1 SDA)

Layout (4 rows of 16-pixel-tall text):
  row 0:  YYYY-MM-DD HH:MM
  row 1:  T: 22°C   H: 56%
  row 2:  verdict line 1
  row 3:  verdict line 2 (wrapped)
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

import adafruit_ssd1306
import board
from PIL import Image, ImageDraw, ImageFont

WIDTH = 128
HEIGHT = 64
I2C_ADDR = 0x3C

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_SIZE = 12
LINE_HEIGHT = 16
MAX_CHARS_PER_LINE = 18  # empirically fits 128px at FONT_SIZE 12

_display = None
_font: Optional[ImageFont.FreeTypeFont] = None


def _get_display() -> "adafruit_ssd1306.SSD1306_I2C":
    global _display
    if _display is None:
        i2c = board.I2C()
        _display = adafruit_ssd1306.SSD1306_I2C(WIDTH, HEIGHT, i2c, addr=I2C_ADDR)
        _display.fill(0)
        _display.show()
    return _display


def _get_font() -> ImageFont.FreeTypeFont:
    global _font
    if _font is None:
        _font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    return _font


def show_status(
    *,
    temperature_c: Optional[float] = None,
    humidity_pct: Optional[float] = None,
    verdict: Optional[str] = None,
    when: Optional[datetime] = None,
) -> None:
    """Render one status frame and push it to the OLED.

    Leaves the frame on screen until cleared or overwritten.
    """
    display = _get_display()
    font = _get_font()

    image = Image.new("1", (WIDTH, HEIGHT), 0)
    draw = ImageDraw.Draw(image)

    now = (when or datetime.now()).strftime("%Y-%m-%d %H:%M")
    draw.text((0, 0 * LINE_HEIGHT), now, font=font, fill=1)

    if temperature_c is not None and humidity_pct is not None:
        line2 = f"T:{temperature_c:.0f}C  H:{humidity_pct:.0f}%"
    else:
        line2 = "T:--  H:--"
    draw.text((0, 1 * LINE_HEIGHT), line2, font=font, fill=1)

    if verdict:
        line3 = verdict[:MAX_CHARS_PER_LINE]
        line4 = verdict[MAX_CHARS_PER_LINE:MAX_CHARS_PER_LINE * 2]
        draw.text((0, 2 * LINE_HEIGHT), line3, font=font, fill=1)
        if line4:
            draw.text((0, 3 * LINE_HEIGHT), line4, font=font, fill=1)

    display.image(image)
    display.show()


def clear() -> None:
    display = _get_display()
    display.fill(0)
    display.show()


if __name__ == "__main__":
    print("Rendering test frame to OLED at 0x3C...")
    show_status(
        temperature_c=22.6,
        humidity_pct=56,
        verdict="all systems nominal",
    )
    print("Done — frame should be visible. Run with --clear to blank it.")
    import sys
    if "--clear" in sys.argv:
        clear()
        print("Cleared.")
