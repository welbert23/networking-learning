# 16B · Device Management

## Boot process and files

A router or switch boots in stages: power-on self-test, ROMMON (the tiny bootstrap), load the IOS image from flash, then load the startup configuration into running memory.

```
show version
show flash:
dir flash:
show boot
```

The **configuration register** tells the device where to boot and whether to use the startup configuration. `0x2102` is the normal value. `0x2142` ignores the startup configuration, which is exactly how password recovery works.

```
show version | include register
configure terminal
config-register 0x2102
end
```

Startup configuration lives in NVRAM and is copied to RAM at boot. Running configuration is in RAM and disappears on reload unless you save it. That is why `copy running-config startup-config` is the most important command in this chapter.

## Licensing

Modern Cisco IOS XE uses smart licensing, where the device registers with a licensing server or a satellite and reports consumption. Feature sets are enabled by licence level, for example network essentials versus advantage, and DNA tiers for controllers.

```
show license
show license status
show license summary
license smart register idtoken <token>
license boot level network-advantage
```

Do not assume a feature is available because the command exists in help. Check the licence. An expired evaluation licence can disable features during a maintenance window, so track expiry before it bites.

## Backup and restore

```
copy running-config startup-config
copy running-config tftp://10.0.0.50/R1.cfg
copy tftp://10.0.0.50/R1.cfg running-config
!
archive
 path tftp://10.0.0.50/$h-archive
 write-memory
show archive
configure replace tftp://10.0.0.50/R1.cfg force
```

TFTP has no authentication or encryption. It is fine in a lab and unacceptable across an untrusted network. Use SCP or SFTP in production, restrict who can reach the server, and keep backups versioned. A backup you have never restored is a rumour.

For a real restore, compare first: `show archive config differences` or a text diff against the candidate. Then apply with `configure replace`, verify with show commands, and save.

## Password recovery

Password recovery requires physical or console access. Only do it on equipment you are authorised to recover.

1. Connect to the console, power cycle, and interrupt the boot to reach ROMMON.
2. Change the configuration register so the startup configuration is ignored: `confreg 0x2142`, then `reset`.
3. The device boots with no configuration. Enter privileged mode, then `copy startup-config running-config`.
4. Set a new `enable secret` and any missing credentials.
5. Restore the register to `0x2102`, save, and reload.

Check interfaces afterwards. Some platforms administratively shut every interface when they boot without a configuration, and the old config copy may bring back the shutdown state.

## Upgrades

1. Read the release notes and compatibility matrix; pick a target version, not "latest".
2. Verify the image checksum (MD5 or SHA) before copying.
3. Confirm free flash space for the new image plus the old one.
4. Copy the image, set the boot variable, and reload in a maintenance window.
5. Verify version, interfaces, routing neighbours, and licence after boot.
6. Keep the old image on flash until the new one has survived a week.

```
verify /md5 flash:cat9k_iosxe.17.09.04a.SPA.bin
boot system flash:cat9k_iosxe.17.09.04a.SPA.bin
reload
show version
```

For fleets, use the controller's image management rather than logging into each device. Staged rollout and a golden image beat heroics at 2 a.m.

## Monitoring and time

- **NTP** - every log, certificate, and correlation depends on correct time. Point devices at internal NTP servers and check `show ntp status`.
- **Syslog** - send to a central server. Severity 0 is emergency, 7 is debug. Never leave production at debug.
- **SNMP** - use v3 with authentication and privacy. Poll for trends, trap for events.
- **NetFlow / IPFIX** - who talked to whom, how much, and when. Invaluable for capacity and security questions.
- **Configuration drift** - compare running config to the intended state on a schedule. Drift is how outages start.

```
ntp server 10.0.0.10
logging host 10.0.0.20
logging trap informational
show logging
show clock
show ntp status
```

If you cannot answer "what changed, when, and who changed it", the monitoring is not finished. AAA logging plus configuration backups plus accurate time is the minimum bar.

## Chapter check

1. What does configuration register 0x2142 do?

   - A. Boots from ROMMON only.
   - B. Ignores the startup configuration at boot.
   - C. Erases the IOS image.
   - D. Enables SSH automatically.

2. What is the first step of Cisco password recovery?

   - A. Delete the flash image.
   - B. Reach ROMMON and change the configuration register.
   - C. Reset the licence.
   - D. Reload the device twice.

3. Which backup transport is appropriate for production?

   - A. TFTP over the internet
   - B. SCP or SFTP with restricted access
   - C. Copying to a USB drive taped to the rack
   - D. Emailing the config

4. Which syslog severity is the most severe?

   - A. 0 - emergency
   - B. 4 - warning
   - C. 7 - debugging
   - D. 3 - error

5. Why verify an image checksum before an upgrade?

   - A. To confirm the file is complete and untampered.
   - B. To make the file compress smaller.
   - C. To enable smart licensing.
   - D. To change the configuration register.

<details>
<summary>Answers</summary>

1. **B** - 0x2142 tells the device to skip the startup configuration, which is used during password recovery.
2. **B** - You interrupt boot to reach ROMMON, set 0x2142, then reset so the saved config is ignored.
3. **B** - SCP or SFTP encrypts the transfer and supports authentication; TFTP is clear text and unauthenticated.
4. **A** - Severity 0 is emergency, the highest level. Severity 7 is debugging, the lowest.
5. **A** - A checksum confirms the copied image matches the published file, avoiding a failed or compromised upgrade.

</details>
