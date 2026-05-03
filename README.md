# wy2z — Wyches Yellow + 2 Zinnias

A four-device plant life-support system for one heirloom tomato vine and two zinnias, designed to run unattended for 5+ weeks while I'm out of town (May 11 – mid-June 2026).

**The pitch in one sentence:** a Pi 5 orchestrates a Jetson Orin Nano camera + ESP32 watering servo + DHT11 + OLED, sends a daily photo to Claude for a health verdict, dispenses water on Claude's say-so, and logs everything to Supabase for a public Vercel dashboard.

**Status:** scaffolding (May 3, 2026). Departure: May 11. 8 days to v1.

## Architecture at a glance

```
Pi 5 (orchestrator)
  ├── Cync smart plug ─── grow light (Wi-Fi)
  ├── DHT11 ──────────── air temp + humidity (GPIO)
  ├── Jetson Orin ────── photo capture (SSH + SCP)
  ├── ESP32 ──────────── Brita servo (Wi-Fi HTTP)
  └── Supabase ──────── photos + telemetry + verdicts (cloud)
                            │
                            └─── Next.js dashboard on Vercel
```

See [`docs/architecture.md`](docs/architecture.md) for the wiring + data flow.

## Where things live

- `pi5/` — orchestrator scripts (cron-driven, Python 3)
- `jetson/` — single-shot camera capture (GStreamer + AK7375 AF)
- `esp32/` — water-dispense HTTP server (Arduino or MicroPython)
- `site/` — Next.js + Tailwind + Supabase dashboard (Vercel-hosted)
- `docs/` — architecture, plant care, deadline plan, SSH playbook
- `narrative.md` — the build journal in prose

## The honest framing

This is a **rig to keep specific plants alive for 5 weeks**, not an "open plant-care tool" yet. Some choices are sub-optimal on purpose because they're educationally interesting (Brita-as-reservoir, soil-color-instead-of-moisture-sensor, servo-as-actuator). The tradeoffs are tracked in [`docs/what_id_change_next_time.md`](docs/what_id_change_next_time.md).
