import network
import time
import socket
import gc
from machine import Pin

import secrets  # esp32/secrets.py — gitignored, holds WIFI_SSID + WIFI_PASSWORD

# --- Pump config ---
# 5V DC pump driven via NPN BJT (2N2222A) low-side switch on GPIO 4.
# HIGH → base conducts → BJT saturates → pump runs. LOW → off.
# 1kΩ base resistor; 1N4001 flyback diode across pump (cathode on +5V).
PUMP_PIN = 4
PUMP_PULSE_MS = 5000   # v1: 5 seconds per dose — tune after measuring mL/sec

HOSTNAME = "wy2z-water"

# --- Pump: initialize OFF as the very first thing ---
pump = Pin(PUMP_PIN, Pin.OUT, value=0)
print("[boot] pump init OFF on GPIO", PUMP_PIN)


def water_pulse():
    print("[water] ON")
    pump.value(1)
    time.sleep_ms(PUMP_PULSE_MS)
    pump.value(0)
    print("[water] OFF")


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
                    '{"status":"ok","duration_ms":' + str(PUMP_PULSE_MS) + "}",
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
