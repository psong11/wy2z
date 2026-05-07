# Jetson Wi-Fi Power-Save Fix

## Symptom

A scheduled cron run on the Pi fails at the Jetson SSH step with:

```
ssh: connect to host 192.168.0.224 port 22: No route to host
```

…even though the Jetson is powered on, has not rebooted, has the same IP, and is reachable a few minutes later when you try by hand. The OLED shows `ERR: capture` for that run only.

## Cause

`wlP1p1s0` (Jetson Wi-Fi) defaults to `Power save: on`. When the Jetson is idle, the radio drops into a low-power state — still associated with the AP, but takes hundreds of ms to seconds to wake on inbound packets. Cron-driven SSH connections hit that wake-up window, ARP times out, kernel returns "No route to host." Verify with:

```bash
ssh paul@jetson.local 'iw dev wlP1p1s0 get power_save'
# Power save: on   ← this is the bug
```

This bites only the first inbound connection after an idle period — once the radio is awake it stays awake for a while, which is why retries minutes later succeed.

## Fix (run on the Jetson, requires sudo)

### Persistent (recommended for unattended operation)

```bash
echo -e "[connection]\nwifi.powersave = 2" | sudo tee /etc/NetworkManager/conf.d/wifi-powersave-off.conf
sudo systemctl restart NetworkManager
```

`wifi.powersave = 2` is NetworkManager's "force off" (1 = let the kernel decide, 3 = force on).

### Verify

```bash
iw dev wlP1p1s0 get power_save
# Power save: off
```

### Temporary (until next reboot, useful for quick testing)

```bash
sudo iw dev wlP1p1s0 set power_save off
```

## Why we can't do this from the Pi or Mac

The SSH playbook (`docs/ssh_jetson.md` §5) only allows non-interactive `sudo` for the i2c tools. Anything else hangs waiting for a password. NetworkManager config and `iw set` both require root, so this has to be run interactively on the Jetson itself (or via a session where you can type the sudo password).

## Related

- `docs/ssh_jetson.md` — the broader SSH protocol; mentions the IP-pinning workaround in §1.
- The handoff `2026-05-05-site-shipped-pump-arrives.md` flagged stale-IP as the suspected cause; the actual cause turned out to be Wi-Fi power-save, not DHCP renewal.
