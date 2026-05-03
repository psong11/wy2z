import network
import time
import socket
import gc
from machine import Pin, PWM

import secrets  # esp32/secrets.py — gitignored, holds WIFI_SSID + WIFI_PASSWORD

# --- Servo config ---
# SG90 on GPIO 13. PWM frequency must be 50Hz (20ms period) for hobby servos.
# duty_u16 is the 16-bit duty cycle (0-65535 = 0-100% of the 20ms period).
#   1.0ms pulse  →  5.0% →  3277  (≈   0°)
#   1.5ms pulse  →  7.5% →  4915  (≈  90°)
#   2.0ms pulse  → 10.0% →  6553  (≈ 180°)
SERVO_PIN = 13
PWM_FREQ = 50

REST_DUTY = 3460       # ≈  10° — servo arm clear of the lever
PRESS_DUTY = 6917      # nominal "200°" — SG90 actual rotation falls short of math, tuned empirically
PRESS_HOLD_MS = 5000   # v1: 5 seconds per dose

HOSTNAME = "wy2z-water"

# --- Servo: initialize at REST as the very first thing ---
servo = PWM(Pin(SERVO_PIN), freq=PWM_FREQ, duty_u16=REST_DUTY)
print("[boot] servo init at REST_DUTY =", REST_DUTY)


def water_pulse():
    print("[water] PRESS")
    servo.duty_u16(PRESS_DUTY)
    time.sleep_ms(PRESS_HOLD_MS)
    servo.duty_u16(REST_DUTY)
    print("[water] REST")


def wifi_connect(timeout_s=30):
    try:
        network.hostname(HOSTNAME)
    except Exception as e:
        print("[wifi] hostname() not supported:", e)
    sta = network.WLAN(network.STA_IF)
    sta.active(True)
    if not sta.isconnected():
        print("[wifi] connecting to", secrets.WIFI_SSID)
        sta.connect(secrets.WIFI_SSID, secrets.WIFI_PASSWORD)
        for _ in range(timeout_s):
            if sta.isconnected():
                break
            time.sleep(1)
    if sta.isconnected():
        ip = sta.ifconfig()[0]
        print("[wifi] connected. IP:", ip, "hostname:", HOSTNAME)
    else:
        print("[wifi] FAILED to connect")
    return sta


def http_response(status, body):
    return (
        "HTTP/1.1 " + status + "\r\n"
        "Content-Type: application/json\r\n"
        "Content-Length: " + str(len(body)) + "\r\n"
        "Connection: close\r\n"
        "\r\n" + body
    )


def parse_request_line(req_bytes):
    try:
        line = req_bytes.split(b"\r\n", 1)[0].decode()
        parts = line.split(" ")
        return parts[0], parts[1]
    except Exception:
        return None, None


def serve():
    addr = socket.getaddrinfo("0.0.0.0", 80)[0][-1]
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(addr)
    s.listen(2)
    print("[http] listening on :80")
    while True:
        cl = None
        try:
            cl, raddr = s.accept()
            req = cl.recv(1024)
            method, path = parse_request_line(req)
            print("[http]", method, path, "from", raddr[0])
            if method == "POST" and path == "/water":
                water_pulse()
                cl.send(http_response(
                    "200 OK",
                    '{"status":"ok","duration_ms":' + str(PRESS_HOLD_MS) + "}",
                ))
            elif method == "GET" and path == "/":
                cl.send(http_response(
                    "200 OK",
                    '{"status":"ok","device":"' + HOSTNAME + '"}',
                ))
            else:
                cl.send(http_response("404 Not Found", '{"error":"not_found"}'))
        except Exception as e:
            print("[http] error:", e)
        finally:
            if cl is not None:
                try:
                    cl.close()
                except Exception:
                    pass


wifi_connect()
gc.collect()
serve()
