# Architecture

## The 4-device system

```
                     ┌─────────────────────────────────────┐
                     │          Raspberry Pi 5             │
                     │  (orchestrator — cron + Python)     │
                     └─────────────────────────────────────┘
                       │             │              │
                       │             │              │
        ┌──────────────┤             │              └──────────────┐
        │              │             │                             │
        │              │             │                             │
   Wi-Fi: HTTP    GPIO: I2C    GPIO: 1-wire                  SSH + SCP
        │              │             │                             │
        ▼              ▼             ▼                             ▼
   ┌─────────┐   ┌────────────┐  ┌────────┐                 ┌─────────────┐
   │  ESP32  │   │ OLED 0.96" │  │ DHT11  │                 │   Jetson    │
   │ DevKit  │   │  SSD1306   │  │  T+RH  │                 │ Orin Nano   │
   └─────────┘   └────────────┘  └────────┘                 └─────────────┘
        │                                                          │
        │ PWM                                                      │ CSI
        ▼                                                          ▼
   ┌─────────┐                                              ┌─────────────┐
   │  SG90   │                                              │  ArduCam    │
   │  servo  │ ── presses Brita lever ──> drip tube         │  IMX519     │
   └─────────┘                                              └─────────────┘


   ┌──────────────────────────────────────────────┐
   │  Cync outdoor smart plug + grow light        │
   │  Scheduled in the Cync app (sunrise/sunset,  │
   │  zip 72712). Independent of the Pi.          │
   └──────────────────────────────────────────────┘


                     ┌─────────────────────────────────────┐
                     │             Wi-Fi LAN               │
                     └─────────────────────────────────────┘
                                       │
                                       │ Wi-Fi: cloud API
                                       ▼
                ┌──────────────────────────────────────────────┐
                │                                              │
                ┌────────────────┐    ┌────────────────────┐
                │   Anthropic    │    │     Supabase       │
                │  Claude API    │    │  Postgres + Storage│
                │  (VLM verdict) │    │  + Realtime        │
                └────────────────┘    └────────────────────┘
                                                │
                                                │ HTTPS
                                                ▼
                                    ┌────────────────────┐
                                    │  Vercel dashboard  │
                                    │  (Next.js public)  │
                                    └────────────────────┘
```

## Capture loop (twice daily — morning + evening)

The grow light is on from sunrise to sunset on a Cync-app schedule. The Pi does not control the light. Captures land inside the lit window so the scene is well-illuminated regardless.

1. **Pi 5 cron** fires `morning_capture.py` (~8 AM) or `evening_capture.py` (~7 PM)
2. Pi reads **DHT11** — air temp + humidity
3. Pi tells **OLED** to display today's date + time (will be visible in the photo)
4. Pi **SSHes to Jetson** and runs `capture_one.py --af-dac 3510 --out wy2z_<timestamp>.jpg`
   - Jetson opens GStreamer pipeline (`nvarguscamerasrc`)
   - Sets focus to calibrated DAC=3510 (skip the hill-climb, ~0.3s)
   - Saves still to `~/wy2z_captures/`
5. Pi **SCPs the photo back** to local disk
6. Pi calls **Claude API** with the photo + DHT reading + structured prompt
7. Claude returns JSON: `{plants: [...], scene_notes: ...}`
8. Pi uploads photo to **Supabase Storage** + inserts an `observations` row in **Supabase Postgres**
9. If Claude said `water`, Pi POSTs to **ESP32** which presses the servo for the calibrated duration; result is logged back to the same observation row

## Why this split

- **Pi 5 is the brain.** Cron is reliable, Python is easy, GPIO is native, Wi-Fi works, ssh-ing out is trivial. It's the right home for orchestration.
- **Jetson is the eye, nothing else.** It has the camera and the AF code from the previous project. Using it for a static photo is overkill, but the autofocus is real and the code is built. (See `what_id_change_next_time.md` — Pi-camera-module would suffice for v2.)
- **ESP32 is the hand.** Wi-Fi-reachable HTTP server with one endpoint is the cleanest way to actuate from across the room. ESP32 is overkill for this too — could be wired straight to the Pi — but the wireless decoupling means the watering rig isn't tethered to the Pi's location.
- **Cync schedules itself.** The grow-light power is on a sunrise/sunset schedule set in the Cync app. Pi does not control it; this avoids the brittle reverse-engineered cloud API and removes a dependency from the capture loop. v2 will swap the Cync plug for a Kasa/Shelly plug with a real local API and bring light control into the Pi.
- **Supabase is the memory.** Postgres for structured telemetry, Storage for photos, Realtime so the dashboard updates without polling.
- **Vercel is the face.** Public dashboard, no auth. Anyone with the URL sees the plants.

## Network assumptions

- Single home Wi-Fi LAN, all devices on the same SSID
- mDNS works (`pi5.local`, `jetson.local`, `esp32.local`) — fall back to IP if it flakes
- Outbound internet for Cync cloud, Anthropic API, Supabase

## What this architecture deliberately does not have

- No local caching layer beyond a small SQLite queue on the Pi (for surviving brief Wi-Fi outages)
- No user-controllable knobs while Paul is gone — schedule is fixed, watering policy is fixed
- No notifications — failures show up only on the dashboard
- No video, no streaming, no live preview — twice-daily stills only
- No fine-tuned plant model — generalist VLM (Claude) is the brain
- No soil moisture sensors — soil color in the photo is the moisture signal

Each of these absences is a deliberate v1 choice. See `what_id_change_next_time.md` for what v2 should add.
