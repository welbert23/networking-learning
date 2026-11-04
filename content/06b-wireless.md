# 06B · Wireless LANs

## Wireless is a shared medium

An Ethernet switch gives every port its own collision domain. A wireless access point gives every client one shared radio channel, so the rules are different.

- **Half duplex.** A radio cannot transmit and receive on the same channel at the same time.
- **CSMA/CA.** Listen first, wait a random backoff, transmit, then wait for an ACK. Collisions are avoided rather than detected.
- **Hidden node.** Two clients can hear the AP but not each other. RTS/CTS reserves the medium so they stop talking over each other.
- **Interference.** Microwave ovens, Bluetooth, cordless phones, neighbouring networks, and metal shelving all raise the noise floor.
- **Rate is per client.** A distant client negotiates a lower data rate and holds the channel longer, which slows everyone else.

Signal is measured as RSSI in dBm. Rules of thumb: -30 dBm is excellent, -67 dBm is a common voice threshold, -75 dBm is weak, and -80 dBm is barely usable. Every 3 dB doubles the power; every 10 dB is ten times.

## Standards, bands, and channels

| Standard | Name | Bands | Notes |
|---|---|---|---|
| **802.11b** | - | 2.4 GHz | 11 Mbps, very old, interferes with everything |
| **802.11g** | - | 2.4 GHz | 54 Mbps, backwards compatible with b |
| **802.11a** | - | 5 GHz | 54 Mbps, less interference, shorter range |
| **802.11n** | Wi-Fi 4 | 2.4 / 5 GHz | MIMO, up to 600 Mbps |
| **802.11ac** | Wi-Fi 5 | 5 GHz | wider channels, MU-MIMO downlink |
| **802.11ax** | Wi-Fi 6 / 6E | 2.4 / 5 / 6 GHz | OFDMA, better density, 6 GHz in 6E |
| **802.11be** | Wi-Fi 7 | 2.4 / 5 / 6 GHz | multi-link operation, very wide channels |

In 2.4 GHz only channels 1, 6, and 11 do not overlap (North America). In 5 GHz there are many more channels, but some are DFS and require radar avoidance. The 6 GHz band is clean because only newer devices use it.

Channel width is a trade: 20 MHz gives more non-overlapping channels; 40, 80, and 160 MHz give more speed per client but fewer channels to reuse. In a dense office, 20 or 40 MHz is usually the right answer. A design that gives every AP an 80 MHz channel will drown itself in co-channel interference.

## SSIDs, APs, and controllers

- **SSID** is the network name clients see. It is not a security boundary.
- **BSS** is one AP radio. Its **BSSID** is that radio's MAC address.
- **ESS** is several APs sharing one SSID so clients can roam. The distribution system (usually the wired LAN) connects them.
- **Roaming** is always the client's decision. The network can only make it easier.

An **autonomous AP** is configured one box at a time. A **lightweight AP** gets its configuration from a wireless LAN controller (WLC) over **CAPWAP** (UDP 5246 control, UDP 5247 data). The controller centralises SSIDs, security, RF profiles, and roaming policy.

Fast roaming uses 802.11k (neighbour reports), 802.11v (BSS transition), and 802.11r (fast BSS transition). Voice and video need 802.11r; without it, a roam can drop a call.

A controller can switch traffic centrally or locally at the AP (FlexConnect). Local switching keeps guest and branch traffic off the WAN, but policy has to be applied at the edge.

## Wireless security

| Mode | How it works | Use it? |
|---|---|---|
| **Open** | No encryption | Only with a captive portal or OWE |
| **WEP** | Broken RC4 key | Never |
| **WPA / TKIP** | Deprecated | No |
| **WPA2-Personal** | Pre-shared key, AES-CCMP | Home and small office |
| **WPA2-Enterprise** | 802.1X with RADIUS, per-user login | Business |
| **WPA3-Personal** | SAE, forward secrecy | Preferred for new deployments |
| **WPA3-Enterprise** | 192-bit mode, 802.1X | High-security environments |

A pre-shared key is shared by everyone. One leaked laptop and the whole network is compromised. 802.1X gives each user their own credentials and a RADIUS server decides who gets on. EAP-TLS uses certificates; PEAP-MSCHAPv2 uses a username and password inside a TLS tunnel.

Other basics: separate guest SSID on its own VLAN with client isolation, disable WPS, enable management frame protection (802.11w), keep controller and AP firmware current, and watch for rogue APs.

## Configuring a WLC

Names differ between AireOS and Catalyst 9800, but the sequence is the same:

1. Create or confirm the VLAN interface the WLAN will use (for example `vlan10`).
2. Create the WLAN with an SSID and a profile name.
3. Map the WLAN to the interface so client traffic lands on the right VLAN.
4. Set security: WPA2 or WPA3, PSK or 802.1X, and the RADIUS servers if used.
5. Enable the WLAN, then verify a client can join and get a DHCP address.

```
config wlan create 1 CORP CORP
config wlan security wpa akm psk set-key ascii 0 ChangeThisPassphrase
config wlan interface 1 vlan10
config wlan enable 1
show wlan summary
show ap summary
show client summary
```

That is AireOS-style syntax; Catalyst 9800 uses policy profiles and tags in the GUI or `wireless` configuration mode. The concept mapping is identical.

The wired side must cooperate: a trunk to the WLC or AP, a DHCP pool for the client VLAN, a default gateway, and DNS. Lightweight APs also need to find the controller, either by DHCP option 43, DNS name `CISCO-CAPWAP-CONTROLLER`, or a broadcast on the local subnet.

## Troubleshooting wireless

| Symptom | Likely cause | Check |
|---|---|---|
| Client cannot see the SSID | Radio off, wrong band, SSID hidden | AP status, channel, broadcast SSID |
| Association or authentication fails | Security mismatch, bad PSK, RADIUS or certificate problem | WLAN policy, client supplicant, RADIUS logs, clock skew |
| Connected but no IP address | Wrong VLAN, missing trunk, DHCP or gateway problem | Client VLAN mapping, trunk, DHCP pool, `show interfaces trunk` |
| Slow for everyone | Weak coverage, co-channel interference, low rates, too many clients | RSSI and SNR, channel utilisation, retry counters, client count per AP |
| Drops while walking | Coverage gap, sticky client, no fast roaming | AP overlap, 802.11r/k/v, roam logs |
| Intermittent failures | Interference, PoE budget, AP reboot | Spectrum analysis, `show power inline`, AP logs |

Start at Layer 1: is the AP powered, is the channel clean, is the client close enough? Then Layer 2: did it associate and authenticate? Then Layer 3: did it get an address and a gateway? Most "Wi-Fi problems" are actually VLAN, DHCP, or DNS problems wearing a Wi-Fi costume.

Useful commands (platform dependent): `show ap summary`, `show ap auto-rf`, `show client summary`, `show wireless client summary`, and the controller's client detail page for RSSI, SNR, retries, and data rate.

## Chapter check

1. Why does 802.11 use CSMA/CA instead of CSMA/CD?

   - A. Radio hardware cannot detect collisions reliably while transmitting.
   - B. Wireless frames are too small to collide.
   - C. CSMA/CD is only for fibre links.
   - D. The access point assigns every client a time slot.

2. Which WPA2 mode gives each user a separate credential?

   - A. WPA2-Personal with a long passphrase
   - B. WPA2-Enterprise with 802.1X
   - C. Open with a captive portal
   - D. WEP with a rotating key

3. A laptop associates to the SSID but never gets an IP address. What should you check first?

   - A. The Wi-Fi password on the client.
   - B. The AP channel width.
   - C. The client VLAN mapping, trunk, and DHCP pool.
   - D. The 802.11 standard the AP is using.

4. Which three 2.4 GHz channels do not overlap in North America?

   - A. 1, 5, 9
   - B. 1, 6, 11
   - C. 2, 4, 8
   - D. 1, 4, 7

5. Why can a single far-away client slow down an entire access point?

   - A. It uses a lower data rate and holds the shared channel longer.
   - B. It encrypts traffic for everyone else.
   - C. It changes the SSID for all clients.
   - D. It forces the AP into half duplex for other clients.

<details>
<summary>Answers</summary>

1. **A** - A radio cannot listen on the same channel while it transmits, so collisions must be avoided with ACKs and backoff rather than detected.
2. **B** - WPA2-Enterprise uses 802.1X and a RADIUS server, so every user authenticates individually.
3. **C** - Association and authentication already worked. No address points at Layer 2 or Layer 3: wrong VLAN, missing trunk, or no DHCP.
4. **B** - Channels 1, 6, and 11 are the standard non-overlapping set in the 2.4 GHz band.
5. **A** - Wireless is a shared half-duplex medium. Low-rate clients take longer per frame, so everyone waits.

</details>
