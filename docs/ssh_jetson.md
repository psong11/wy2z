# SSH Playbook — Running Commands on the Jetson from Claude

> **Migrated verbatim from `~/Documents/learn/jetson-yolo-stream/docs/ssh_jetson.md`.** The protocol is the same. The only project-specific change in `wy2z` is the snapshot directory and the script names.

**IMPORTANT for Claude:** Read this file *before* running any `ssh paul@jetson.local` commands. It documents how to drive the Jetson remotely without causing hangs, hidden state, or destructive surprises.

---

## 1. Connection basics

- **Host:** `paul@jetson.local` (mDNS; falls back via router DHCP if `.local` fails)
- **Auth:** SSH key `~/.ssh/id_ed25519` (set up 2026-04-16). No password prompts expected.
- **Quick health check pattern:**
  ```bash
  ssh paul@jetson.local 'uptime; df -h / | tail -1; ls /dev/video0 2>&1'
  ```

If SSH fails:
1. Verify the Mac can resolve `jetson.local` (`ping -c 1 jetson.local`).
2. If mDNS is broken, ask Paul for the Jetson's IP (`ip addr` on the Jetson).
3. Don't try `StrictHostKeyChecking=no` or other auth bypasses without asking.

---

## 2. Running commands — the one-shot pattern

**Always use the `ssh host 'command'` form** inside the `Bash` tool. Do not open interactive shells — the `Bash` tool has no TTY.

```bash
ssh paul@jetson.local 'ls -lh /dev/video*'
```

For multiple commands, chain them inside the quotes with `&&` or `;`:

```bash
ssh paul@jetson.local 'cd ~/wy2z_captures && ls -lh | tail -5'
```

**For long or multi-line commands → write a script, SCP it, then execute it.** Inline multi-line commands break under quote-escaping and have no good recovery when they fail mid-way.

---

## 3. Quote-escaping (the #1 foot-gun)

GStreamer pipelines contain single quotes, parentheses, and `!` — all of which zsh/bash interpret. Rules:

- **Wrap the whole SSH command in single quotes.** Inside, use double quotes for GStreamer caps:
  ```bash
  ssh paul@jetson.local 'gst-launch-1.0 nvarguscamerasrc num-buffers=30 ! "video/x-raw(memory:NVMM),width=1920,height=1080" ! nvjpegenc ! filesink location=/tmp/out.jpg'
  ```
- **If a command is complex enough to need nested quotes,** write a script and SCP it instead. Don't try to be clever.
- **Never use `!` inside double-quoted strings in bash history mode** — it triggers history expansion. Single-quote the outer shell, or escape.

---

## 4. Background processes — a trap

A naked `&` over SSH will sometimes hang the SSH session because SSH waits for the background process's stdout/stderr to close. Use this pattern instead:

```bash
ssh paul@jetson.local 'nohup gst-launch-1.0 ... > /tmp/gst.log 2>&1 < /dev/null & disown; echo started'
```

Critical pieces: `nohup` (survives disconnect), redirect both streams to a file, `< /dev/null` (close stdin), `& disown` (detach), `echo started` (gives SSH something to return).

Stop a backgrounded process by name:
```bash
ssh paul@jetson.local 'pkill -f nvarguscamerasrc'
```

**Never leave a background gst pipeline running across commands without an explicit kill.** The camera has one ISP channel — a stale pipeline blocks the next one.

---

## 5. `sudo` — narrow allowlist

Paul has `NOPASSWD` configured **only for these commands** (see `/etc/sudoers.d/paul-i2c` on the Jetson):

- `/usr/sbin/i2cset`
- `/usr/sbin/i2cdetect`
- `/usr/sbin/i2cget`

**Anything else requiring `sudo` will hang forever** waiting for a password over non-interactive SSH. If you need other `sudo`, either ask Paul to run it, or use `sudo -n <cmd>` so it fails fast.

Do NOT expand the NOPASSWD list without asking.

---

## 6. File transfer

- **Pull from Jetson → Mac:** `scp paul@jetson.local:~/file ~/Desktop/`
- **Push Mac → Jetson:** `scp ~/file paul@jetson.local:~/`
- **Recursive:** `-r`. **Glob:** quote the remote side.

Convention: **edit locally on Mac, run remotely on Jetson.** Never edit source files in place on the Jetson.

---

## 7. Output management

`gst-launch-1.0` is chatty — every run prints ~30 lines of NvArgus status. Defaults:

- Redirect noisy tools to a logfile: `> /tmp/gst.log 2>&1`
- Pull only the last N lines if needed: `tail -20 /tmp/gst.log`
- For loops with per-iteration output, echo one summary line per iteration.

---

## 8. wy2z-specific quick reference

| Thing | Value |
|---|---|
| Camera node | `/dev/video0` |
| Sensor I2C | bus 10, addr `0x1a` |
| VCM (autofocus) I2C | bus 10, addr `0x0c` — **only powered while sensor is streaming** |
| VCM protocol | AK7375: 3-byte write `i2ctransfer w3@0x0c 0x00 <high> <low>`, init `w2@0x0c 0x02 0x00` |
| GStreamer source | `nvarguscamerasrc` (never `cv2.VideoCapture(0)` — green frames) |
| HW JPEG encoder | `nvjpegenc` |
| Snapshot dir | `~/wy2z_captures/` |
| Project repo on Mac | `/Users/paulsong/Documents/personal_projects/wy2z` |
| Capture script on Jetson | `~/wy2z/capture_one.py` (synced from Mac repo `jetson/capture_one.py`) |
| Calibrated AF DAC | **3510** (as of 2026-05-03 with current camera position). Use `--af-dac 3510` to skip the 9s hill-climb. Re-run `sweep_focus.py` if camera is repositioned. |

---

## 9. Things that require explicit confirmation from Paul

Never do these silently, even if they'd solve the problem:

- `rm -rf` anything outside `/tmp/` or a file from the current session
- Modify `/etc/`, `/boot/`, device tree, udev rules, systemd units
- Install or upgrade system packages (`apt`)
- `pip install` into the system Python — venvs only
- Edit `sudoers` / `sudoers.d/*`
- Flash, rebuild, or modify kernel modules
- Touch the JetPack base image or `/usr/src/nvidia/`
- Power / reboot the Jetson
- Git operations that rewrite published history

When in doubt, ask. Bricking the SD card means a full JetPack reflash.

---

## 10. When not to SSH at all

- **Interactive tools** (vim, htop, `python` REPL, `sudo apt` confirmations) — ask Paul to run them.
- **Anything requiring a display.** Use file + SCP to see images.
- **Multi-step workflows that should survive crashes.** Write a script and execute it as a unit.

---

## 11. First-move checklist for any Jetson session

```bash
ssh paul@jetson.local '~/bin/jstatus'
```

`jstatus` is installed at `~/bin/jstatus` on the Jetson (source in `jetson-yolo-stream/docs/jstatus.sh`). One round-trip, one clear signal of host health, camera state, active processes, etc.

---

## 12. tmux — long-running work on the Jetson

For anything more than a few seconds (captures, debugging) use a tmux session so the process survives SSH disconnect.

```bash
ssh paul@jetson.local 'tmux new -d -s claude "python3 ~/wy2z/capture_one.py 2>&1 | tee /tmp/capture.log"'
ssh paul@jetson.local 'tmux ls'
ssh paul@jetson.local 'tmux capture-pane -t claude -p | tail -40'
ssh paul@jetson.local 'tmux kill-session -t claude'
```

Conventions: session name `claude`, always `tee` to `/tmp/`, never attach interactively from the `Bash` tool.
