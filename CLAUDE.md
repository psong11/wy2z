# wy2z — Project Rules

## What this is

A 4-device plant life-support system for one heirloom indeterminate tomato (Wyches Yellow) and two zinnias. Designed to run unattended May 11 → mid-June 2026 while Paul is out of town.

**Through-line:** keep specific plants alive, learn the orchestration patterns by building it. This is *not* a generic plant-care product. Sub-optimal choices are explicit and tracked in `docs/what_id_change_next_time.md`.

## Hardware loadout

| Device | Role | Address |
|---|---|---|
| Raspberry Pi 5 | Orchestrator — cron, sensors, cloud calls, light control | `pi5.local` (TBD) |
| Jetson Orin Nano | Single-shot camera capture | `paul@jetson.local` (SSH key auth) |
| ESP32 DevKit | Brita-servo HTTP actuator | `esp32.local` (TBD, Wi-Fi) |
| ArduCam UC-873 (IMX519) | CSI camera on Jetson | `/dev/video0` |
| SG90 9g servo | Pushes Brita lever | ESP32 GPIO |
| DHT11 | Air temp + humidity at canopy | Pi 5 GPIO |
| GME12864-11 v3.22 OLED | Date/time display in frame | Pi 5 I2C (SSD1306, 0x3C) |
| Cync outdoor smart plug | Grow-light power | Scheduled in the Cync app (sunrise/sunset, zip 72712) — Pi does not control |
| Brita 18-cup pitcher + vinyl drip tube | Reservoir + delivery | physical |

## File map

- `README.md` — top-level intro
- `narrative.md` — the build journal in prose (Paul's voice, junior-dev-readable)
- `pi5/` — orchestrator code
  - `morning_capture.py`, `evening_capture.py` — cron entry points
  - `water.py` — dispense one shot
  - `analyze.py` — Claude API call
  - `upload.py` — push to Supabase
  - `lib/` — `jetson_client.py`, `dht.py`, `oled.py`, `cync.py`, `db.py`
- `jetson/` — capture-only code on the Jetson
  - `capture_one.py` — main entry, runs AF + grabs a still. **Production: use `--af-dac 3510`** (calibrated 2026-05-03)
  - `focuser.py` — AK7375 driver (lifted from `jetson-yolo-stream`)
  - `sweep_focus.py` — diagnostic, captures across 8 DAC positions. Re-run when camera is repositioned.
- `esp32/` — water-dispense HTTP server (Arduino or MicroPython)
- `site/` — Next.js dashboard
- `docs/`
  - `architecture.md` — system diagram + data flow
  - `deadline.md` — 5-week unattended plan + risk register
  - `plant_care.md` — biological needs (light, water, nutrition, pollination)
  - `ssh_jetson.md` — **read before any SSH command to the Jetson**
  - `what_id_change_next_time.md` — running list of "with hindsight..." notes

## How Paul works

- Concept-first explanations, not just commands. He's learning the patterns, not just executing.
- Edits locally on Mac, runs remotely on Pi/Jetson/ESP32. Never edit source on the device.
- Confirm before destructive or hard-to-reverse actions (deploys, pushes, reflashes, schema migrations).
- He pushes back when something feels off. Take it seriously.
- Likes commits with substantive messages — em-dashes, body paragraphs, file-by-file notes.
- Sub-optimal v1 is OK if it's noted in `docs/what_id_change_next_time.md`. Don't over-engineer.

## Driving the Jetson over SSH (mandatory)

Before any `ssh paul@jetson.local '<cmd>'` from the Mac's Bash tool, **read `docs/ssh_jetson.md`**. It covers the one-shot pattern, quote-escaping for GStreamer, background-process traps, the narrow `sudo` allowlist (i2c tools only), file transfer, and the list of actions that require Paul's explicit confirmation.

## Predecessor project

The autofocus + CSI capture code was built in `~/Documents/learn/jetson-yolo-stream`. That repo is the *narrative of how we learned to make the camera see clearly*. It's complete as a chapter. Lift code from it, don't rewrite it.

## Deadline

**May 11, 2026** — Paul leaves town for ~5 weeks. The system needs to run unattended from that date until ~mid-June. See `docs/deadline.md` for the unattended-run plan and risk register.
