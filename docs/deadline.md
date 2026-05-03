# Deadline & 5-Week Unattended Plan

## The hard constraint

**May 11, 2026** — Paul leaves town. Returns ~mid-June. **~35 days unattended.**

The system has to keep three plants alive across that window with zero human intervention. The plants are: one Wyches Yellow indeterminate tomato (high water demand, will outgrow its support, may try to flower), two zinnias (annuals, lower demand, mostly need sun + water).

## 8-day build schedule (May 3 → May 10)

| Day | Date | Goal |
|---|---|---|
| 1 | May 3 | Repo scaffolded, Jetson capture migrated, Pi → Jetson photo round-trip works, Claude verdict on a real photo, Supabase schema deployed, Cync prototype |
| 2 | May 4 | ESP32 watering loop — pump or servo press, HTTP `/water` endpoint, calibrate "press 1.5s = 200 mL" empirically |
| 3 | May 5 | DHT11 + OLED on Pi, telemetry to local SQLite, one full data row generated |
| 4 | May 6 | Supabase Storage upload working, photos land in bucket, public URLs in observations rows |
| 5 | May 7 | Dashboard scaffold on Vercel — daily-strip view + observations table, real data from Supabase |
| 6 | May 8 | **Full integration run** — cron schedule active, run for 12+ hours unattended at home, watch for issues |
| 7 | May 9 | **Failure injection** — kill Wi-Fi, power-cycle Pi mid-water, drain Brita, confirm no plant-killing failure modes |
| 8 | May 10 | Buffer — fix whatever broke, final pre-flight checks, close laptop, leave |

## Risk register

Ordered by *probability of killing a plant*, not by interestingness.

| Risk | Mitigation |
|---|---|
| **Brita runs dry, plants don't get watered** | Drip via micro-holes in tube to extend per-fill duration to ~5-7 days. **No automated refill** — accept that someone (or no one) refills it. If no refills, plants will be water-stressed by week 2 but should survive on whatever soil moisture remains. *(Considered, not adopted: passive capillary mat as fail-safe. Tracked in `what_id_change_next_time.md`.)* |
| **Servo hangs in "pressed" state, drains pitcher onto floor** | ESP32 firmware: hard timeout on servo press (max 10s), explicit return-to-rest after every actuation, watchdog reboots the ESP32 if it freezes |
| **Tomato vine collapses without support** | Tomato cage installed before May 11. Manual prune to single leader before leaving. |
| **No pollination → no fruit** | Clip-on fan running 24/7 at low speed for airflow + flower vibration. Same fan handles humidity stagnation + mold prevention. |
| **Wi-Fi drops, Pi can't talk to anything** | Pi runs cron locally regardless of internet. Photos buffer in local SQLite. ESP32 watering only fires on schedule (independent of Wi-Fi state) — *to be designed: should ESP32 have its own backup watering schedule that runs even if it never hears from the Pi?* |
| **Cync cloud goes down, grow light stuck off** | Cync schedule (sunrise/sunset for zip 72712) is the production path — set in the Cync app, no Pi dependency. If the Cync cloud is fully down for the entire trip, light is stuck in whatever state it last had. Risk accepted for v1 since plants survive a few days of dim ambient indoor light, and Cync infrastructure has not had a multi-day outage in living memory. |
| **Anthropic API down or rate-limited** | Pi continues to capture and store; `analyze.py` retries with exponential backoff; if Claude is unreachable for >24h, Pi defaults to "water on schedule regardless" |
| **Power outage** | Outside our control. Plants will be unwatered + unlit until power returns. Smart-plug + Pi auto-reboot on power restore. |
| **DHT11 fails or returns garbage** | Treat DHT readings as advisory only; watering decision is Claude+vision-driven, not telemetry-gated |
| **Jetson crashes, no photos** | Pi `morning_capture.py` SSHes with timeout; if Jetson is unreachable, log the failure and keep watering on a fallback timer-only schedule |
| **Photo too dark / blurry / overexposed** | Capture happens *after* Pi turns Cync grow light on + 10s settle. AF runs every shot. Jetson camera is fixed in position so framing is consistent. |

## What "success" looks like at June return

Plants alive, ideally with growth visible. Bonus: tomato has flowered or fruited. Dashboard shows ~70 photos (2/day × 35 days). Logs show watering events triggered as expected. Honest evaluation in `narrative.md` of what worked and what didn't.

## What "failure" looks like

- All plants dead → write the post-mortem honestly
- One plant dead → write the post-mortem, identify which subsystem failed
- Watering loop fired but plants visibly stressed → calibration error, document
- System silent for >48h → Pi died, Wi-Fi died, or both. Doesn't matter which until I'm back.

The point of the project is the *building*. The plants surviving is a strong signal but not the only signal.
