"""DHT11 air temperature + humidity reader for the Pi 5.

Wired on GPIO 17 (header pin 11). Uses adafruit-circuitpython-dht through
adafruit-blinka, which on Pi 5 backends to lgpio.

DHT11 single reads fail ~10-30% of the time under Linux scheduling jitter
(the protocol is timing-sensitive bit-banging). read() retries a few times
before giving up.
"""

from __future__ import annotations

import time
from typing import NamedTuple

import adafruit_dht
import board

DEFAULT_PIN = board.D17
RETRY_COUNT = 5
RETRY_DELAY_S = 2.0


class Reading(NamedTuple):
    temperature_c: float
    humidity_pct: float
    timestamp: float

    @property
    def temperature_f(self) -> float:
        return self.temperature_c * 9.0 / 5.0 + 32.0


_sensor = None


def _get_sensor(pin=DEFAULT_PIN):
    global _sensor
    if _sensor is None:
        _sensor = adafruit_dht.DHT11(pin)
    return _sensor


def read(pin=DEFAULT_PIN, retries: int = RETRY_COUNT) -> Reading:
    """Read temp + humidity, retrying on transient failures.

    Raises RuntimeError if all retries fail.
    """
    sensor = _get_sensor(pin)
    last_err = None
    for attempt in range(retries):
        try:
            t = sensor.temperature
            h = sensor.humidity
            if t is None or h is None:
                raise RuntimeError("DHT11 returned None")
            return Reading(temperature_c=float(t), humidity_pct=float(h), timestamp=time.time())
        except RuntimeError as e:
            last_err = e
            if attempt < retries - 1:
                time.sleep(RETRY_DELAY_S)
    raise RuntimeError(f"DHT11 read failed after {retries} attempts: {last_err}")


if __name__ == "__main__":
    print(f"Reading DHT11 on {DEFAULT_PIN} ...")
    r = read()
    print(f"  temperature: {r.temperature_c:.1f} °C  ({r.temperature_f:.1f} °F)")
    print(f"  humidity:    {r.humidity_pct:.0f} %")
