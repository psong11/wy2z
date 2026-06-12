# Lessons Learned

Running log of hard-won lessons from building wy2z. Two readers:

- **Future Paul** replicating or extending this project (or any system with
  multiple devices talking over a network).
- **Future Claude** — auto-loads `CLAUDE.md` on session start; should read
  this file *before touching infrastructure or networking code* in this
  repo or any successor.

---

## Meta-lesson — the frame the rest hangs on

**Most outages aren't broken code. They're broken assumptions.**

A system in production isn't just hardware + code. It's hardware + code +
config + environment + a thousand tiny assumptions about the world. Any
of those layers can rot without any of the others changing. The hardest
failures to debug are the ones where *nothing in the system changed* —
but the world around the system did, and a frozen assumption silently
went out of sync with reality.

Symptoms of broken-assumption failures:

- 100% hardware uptime, 0% code errors, but the system is producing
  wrong (or no) output.
- The bug was *born* in one moment (when the assumption was written) but
  didn't *trigger* until much later (when the world drifted past it).
- Logs show every step succeeding except the one that depended on the
  stale assumption.

The tactical lessons below are all variants of one prescription: **assume
the world will move; make the system either move with it, or yell loudly
when it can't.**

---

## Incident: 2026-05-27 → 06-11 — the Jetson IP override (15-day silent outage)

**What happened.** On 2026-05-27 ~15:30 CT, the wy2z capture pipeline
stopped producing observations. Dashboard went silent for ~15 days while
Paul was out of town. Diagnosed remotely on 2026-05-30 by reading the
last successful row in Supabase and the cron log on the Pi: every cron
run was succeeding up to the Jetson-SSH step, then failing with `ssh:
connect to host 192.168.0.224 port 22: No route to host`. The Pi and
Jetson were both fully up (Pi: 36 days uptime when diagnosed; Jetson: 39
days when Paul got home), filesystem healthy, no hardware faults
anywhere in the stack.

**Root cause.** A four-line block in `~/.ssh/config` on the Pi:

```
Host jetson.local
  HostName 192.168.0.224     ← the trap
  HostKeyAlias jetson.local
  User paul
```

The `HostName` line was added on 2026-05-06 as a band-aid during Wi-Fi
power-save troubleshooting (the real fix was a NetworkManager config
change in `/etc/NetworkManager/conf.d/wifi-powersave-off.conf`; the SSH
override was "extra insurance" and was never removed). It told SSH:
*"when anyone asks for `jetson.local`, skip OS-level name resolution and
use this IP directly."* Hard-pinned the Jetson to `.224`.

During a probable router reboot in a 2026-05-27 thunderstorm, the
Jetson reconnected and got a new DHCP lease at `192.168.0.225`. The
Pi's SSH config still said `.224`. Pi → Jetson SSH failed silently every
4 hours for 15 days. The bug existed from 2026-05-06; the IP change on
2026-05-27 just *triggered* it.

The whole capture pipeline aborts on the first failed step, so no
observation row was written, which made the failure look indistinguishable
from "the entire Pi is dead." From the road, with no LAN access, that's
the worst possible failure signature.

**Lessons.**

1. **Self-healing > deterministic, when the cost is low.** Names that
   re-resolve every call (mDNS, DNS, service discovery) absorb world-
   changes for free. Hardcoded IPs cache a truth that was only true at
   the moment of writing. The latency cost of self-healing (~20ms for
   mDNS) is nothing compared to the operational cost of even a single
   bad reconciliation.

2. **Band-aids become load-bearing.** Every temporary fix is an
   undocumented assumption you'll forget about by next quarter. If you
   patch a symptom, document (a) the underlying cause and (b) the
   removal condition, then *actually remove* the band-aid when the cause
   is properly fixed. Otherwise yesterday's quiet workaround becomes
   tomorrow's load-bearing dependency.

3. **Hidden state is invisible failure.** A hardcoded value in one
   device's `~/.ssh/config`, never logged, never surfaced in any
   dashboard, can be silently wrong forever. State that isn't visible to
   the operator is state that can rot. Visibility is a reliability
   feature, not a UX feature.

4. **Silent failure is the worst failure.** The pipeline aborted on the
   first error and wrote no observation row. That made "Jetson
   unreachable" look identical to "Pi is dead" from the dashboard. Had
   we written an error row with `action_result: "jetson_unreachable"`,
   diagnosis would have taken minutes from anywhere with internet.
   *Failure modes that emit structured errors are 10× faster to debug
   than failure modes that emit silence.*

5. **Push pinning to the source of truth.** If the Jetson genuinely needs
   a stable IP, the *router* is the right layer to pin it — a DHCP
   reservation binding MAC → IP. One source of truth, observable from
   anywhere on the network, immune to config copies drifting across
   devices. Don't scatter the same fact across multiple files on
   multiple machines.

6. **Health checks should test assumptions, not just liveness.** "Is
   the Pi alive?" was trivially yes the whole time. "Can the Pi still
   reach the Jetson?" was the assumption that actually mattered, and was
   never checked. Health checks that verify *relationships* between
   parts catch a class of failure that part-level checks fundamentally
   can't.

**What to do differently next time.**

- Default to name-based addressing (mDNS, DNS, service discovery) over
  IP-based for any device-to-device communication on a LAN.
- When a band-aid goes in, leave a comment with the date, the underlying
  cause, and the removal condition. Grep for those comments quarterly.
- Make every pipeline step that depends on an external resource emit a
  structured failure record — never abort the whole pipeline silently.
- Add an "infrastructure heartbeat" check: Pi confirms it can reach
  Jetson, ESP32, Supabase. Log the result as a row in Supabase (even
  with no photo) so the dashboard can distinguish "no capture was due"
  from "we can't see one of the devices."
- For devices that need stable network identity: DHCP reservation at the
  router, not hardcoded IPs in client configs.

**Recovery actions taken (2026-06-11).**

- Backed up `~/.ssh/config` on the Pi to `~/.ssh/config.bak.2026-06-11`.
- Deleted the `HostName 192.168.0.224` line. SSH now resolves
  `jetson.local` via mDNS dynamically.
- Verified end-to-end: `ssh paul@jetson.local "hostname; hostname -I"`
  returns `jetson / 192.168.0.225`. Next cron tick will close the loop.
- *Deferred:* router-level DHCP reservation for the Jetson's MAC; daily
  infrastructure heartbeat job. Both tracked in
  `docs/what_id_change_next_time.md`.

---

## Architecture note: orchestrator + worker

(Not a lesson — a design pattern, recorded here for the same future
readers.)

wy2z uses the Pi 5 as an **orchestrator** and the Jetson Orin Nano as a
specialized **worker**. The Pi has cron, GPIO, sensors, network — it
runs the schedule and the cloud-facing logic. The Jetson has the IMX519
CSI camera and the autofocus calibration code — it runs single-shot
captures on command. The Pi SSHs into the Jetson every 4 hours to
trigger a capture.

Why this split rather than putting everything on one device:

- The camera physically can't move between devices. Whatever drives the
  camera lives on the Jetson.
- A 20W AI accelerator is overkill for reading a $1 humidity sensor and
  driving an OLED. The Pi idles much cheaper.
- **Separation of concerns**: each device has one clear responsibility,
  is debugged/replaced independently, and can be tested in isolation.

The trade-off: the network hop between the two devices is now a failure
surface. That hop is exactly what failed in the 2026-05-27 incident.
*Whatever your architecture splits across machines becomes a new
boundary that can break in ways neither machine alone can break.*
