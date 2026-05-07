"""
Standalone pump-switch test. No Wi-Fi, no HTTP, no servo — just drive
GPIO 4 (D4) HIGH for 1 second, then LOW. Use this to confirm the BJT +
pump wiring before bolting watering into main.py.

Run on the ESP32 with:
    mpremote run pump_test.py

Or, from the MicroPython REPL on the device:
    import pump_test
"""

from machine import Pin
import time

PUMP_PIN = 4  # D4 on most ESP32 DevKits = GPIO 4

pump = Pin(PUMP_PIN, Pin.OUT, value=0)

print("[pump_test] HIGH")
pump.value(1)
time.sleep(1)
pump.value(0)
print("[pump_test] LOW")
