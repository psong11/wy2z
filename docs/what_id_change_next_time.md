# What I'd Change Next Time

A running list of v1 choices that worked-but-aren't-the-best, with the better v2 alternative. Add to this as you go — every time you write a "this is fine for now but..." comment in code, capture it here instead.

## Watering

**v0 attempt, abandoned 2026-05-03:** SG90 servo on ESP32, intended to press the Brita lever to dispense water. Built and bench-tested all the way through angle calibration (REST=10°, swept PRESS up through 45°→80°→140°→160°→nominal-200°) before hitting two showstoppers in sequence:

1. **SG90 stall torque (~1.8 kg-cm) loses to the Brita lever's spring** — even at maximum travel the horn couldn't apply enough force to depress the dispense lever far enough to release water.
2. **The vinyl drip tube is too stiff for the SG90 to pinch closed** — it is genuinely vinyl (not rigid poly), but a tough enough wall that the servo's torque budget can't deform it against an anvil. So a pinch-valve fallback was also off the table. An end-of-tube plug-valve was sketched (10 g of head pressure on the plug, easily within SG90's torque budget) but not built — pivoted to a real pump instead.

The HTTP/Wi-Fi/`POST /water` scaffold from the ESP32 firmware survives the pivot — only the actuator changes.

**v1 choice (in flight, pump arriving 2026-05-05):** small 5V DC water pump driven by an ESP32 GPIO through a transistor or relay. Brita stays as the v1 reservoir. Reuses the same `POST /water` endpoint; `water_pulse()` switches from `PWM duty` to `Pin.value(1) → sleep → Pin.value(0)`.

**Why v1 is still sub-optimal:**
- 4.3 L Brita depleted every 5–7 days → still needs human refills during the 5-week trip
- Run-dry failure mode: if the Brita empties, the pump keeps firing and may burn out
- No reservoir-level monitoring
- Pump clogs/jams silently leave plants thirsty

**v2 fix:** 5-gallon (19 L) bucket reservoir, ultrasonic distance sensor (HC-SR04) for level, optional 12V solenoid valve in series with the pump as a hard mechanical shutoff for power-loss / firmware-hang safety.

**v2 fail-safe:** capillary mat or self-watering pots as a passive backup so plants survive even if smart system dies entirely.

## Soil moisture sensing

**v1 choice:** infer from soil color in the photo (Claude's interpretation).

**Why it's sub-optimal:** color is a proxy, not a measurement. Susceptible to lighting drift, soil-surface vs. root-zone mismatch, mulch/topdress masking the real moisture state.

**v2 fix:** capacitive soil moisture sensor per pot (~$3 each), wired to Pi or ESP32, included as a numeric field in the Claude prompt: "tomato soil = 32% moisture, please interpret in context."

## Camera

**v1 choice:** Jetson Orin Nano + ArduCam IMX519 with autofocus.

**Why it's sub-optimal:** Jetson is doing one job (take a photo, twice a day) that a $25 Pi Camera Module 3 could do. AF is overkill for a fixed scene. We use the Jetson because the AF and CSI code already exist from the predecessor project, not because it's the right tool.

**v2 fix:** Pi Camera Module 3 directly on the Pi 5 — eliminates the SSH hop, the SCP, and one entire device. Or: lock the Jetson AF to a single calibrated DAC value at install time; skip the hill-climb on every shot.

## Notifications

**v1 choice:** none. Paul checks the dashboard manually.

**Why it's sub-optimal:** by the time he checks, a 6-hour servo malfunction has already drained the Brita.

**v2 fix:** email or Pushover alerts on three trip-wires — no photo for 12h, 3 consecutive water failures, Brita level <10%.

## Pi → Cync

**v1 choice:** Cync grow-light is on a sunrise/sunset schedule configured in the Cync app (zip 72712). Pi does not control the light.

**Why we landed here:** explored `pycync` v0.5.0; smart plugs fall to the generic `CyncDevice` class which exposes no on/off methods (only `CyncLight` does). The TCP `command_client.set_power_state` *might* work via a hack, but `pycync` also has a single-connection-per-account constraint — every Pi connection kicks the phone's Cync app off and vice versa, with 10s auto-reconnect cycles. Not worth the production risk for a feature that's only "Pi turns on light → wait 10s → capture" when "schedule on-by-clock" achieves the same thing.

**v2 fix:** swap the Cync outdoor plug for a Kasa or Shelly plug with a real local API (`python-kasa` is rock-solid, fully local LAN, well-documented). Then the Pi can integrate light control into the capture loop, support arbitrary schedules, and react to weather/season changes.

## Cloud storage

**v1 choice:** Supabase Postgres + Storage.

**Why it's good:** unified backend, real-time, public-by-default-when-you-want, Postgres is a real database, MCP integration. This is one of the v1 choices that probably *is* the right call.

**v2 fix:** none anticipated.

## Reservoir refilling

**v1 choice:** ignore — accept that the Brita might drain mid-trip.

**Why it's sub-optimal:** if it drains on day 14, plants get no water for 21 days.

**v2 fix:** pair the bucket-reservoir from above with a float valve fed from the apartment water line (or a dedicated 50L tank refilled from a hose pre-departure). True hands-off.

## OLED date/time stamp in frame

**v1 choice:** Pi drives a small OLED that's positioned in the camera frame, displaying today's date + time. Photo therefore self-attests.

**Why it's good:** zero-trust metadata. The image carries its own timestamp visibly; any future viewer (including Claude) can read the date without trusting the file's mtime.

**v2 fix:** none — this one's a keeper.
