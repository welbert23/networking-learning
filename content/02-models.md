# 02 · The Models: OSI and TCP/IP

The OSI model is not a protocol. It is a **mental checklist** that lets you say
"this is a Layer 2 problem" and stop guessing.

## The two models side by side

```
   OSI (7 layers)                 TCP/IP (4 layers)
   ------------------             ---------------------
 7 Application  ┐
 6 Presentation ├──────────────►  Application  (HTTP, DNS, SSH, TLS)
 5 Session      ┘
 4 Transport    ──────────────►  Transport    (TCP, UDP, QUIC)
 3 Network      ──────────────►  Internet     (IP, ICMP, OSPF, BGP)
 2 Data Link    ┐
 1 Physical     ┴─────────────►  Link         (Ethernet, Wi-Fi, ARP)
```

The industry still speaks OSI ("Layer 2 switch", "Layer 3 problem", "Layer 7 firewall").
TCP/IP is what actually runs. Learn OSI to communicate, TCP/IP to build.

## What each layer does, and what breaks there

| Layer | Job | Units | Typical failure | First thing to check |
|---|---|---|---|---|
| 7 Application | User-facing protocol | Data | wrong URL, certificate, app config | can you curl it from the host? |
| 6 Presentation | Encoding, encryption | Data | TLS version, cipher mismatch | TLS handshake in Wireshark |
| 5 Session | Conversation state | Data | idle timeout, auth session drop | logs, timeout settings |
| 4 Transport | End-to-end delivery, ports | Segment/Datagram | firewall blocking port, retransmits | `ss -tulpn`, capture |
| 3 Network | Addressing, routing | Packet | wrong route, ACL, asymmetric path | `ping`, `traceroute`, routing table |
| 2 Data Link | Local delivery, MAC | Frame | VLAN mismatch, STP loop, duplex | switch MAC table, error counters |
| 1 Physical | Bits on the medium | Bits | bad cable, dirty fiber, no light | link lights, `ethtool`, cable test |

**Rule of thumb:** 80% of "network problems" are Layer 1, 2, or a DNS mistake.

## Encapsulation

Data moves down the stack on the sender, and up on the receiver.

```
Sender                              Receiver
HTTP request                        "GET /index.html"
  │                                 ▲
  ▼                                 │
TCP header + data    [TCP|DATA]     │
  │                                 │
  ▼                                 │
IP header            [IP|TCP|DATA]  │
  │                                 │
  ▼                                 │
Ethernet header      [ETH|IP|TCP|DATA|FCS]
  │                                 │
  └──────── wire ───────────────────┘
```

Each layer adds its own header. At the receiving side, each layer strips its header and
hands the payload up. This is why you can capture a single frame and read the entire stack
inside it.

## MTU and fragmentation

- **MTU (Maximum Transmission Unit)** — the largest payload a link can carry.
  Ethernet default: **1500 bytes**.
- If an IP packet is bigger than the MTU and DF (don't fragment) is set, the router sends
  back **ICMP "fragmentation needed"**.
- If DF is not set, the packet is fragmented. Fragmentation is expensive and often breaks
  firewalls.

Common MTU problems:

| Symptom | Cause |
|---|---|
| Ping works, large transfers hang | path MTU black hole, ICMP blocked |
| VPN works for small packets only | tunnel overhead reduced MTU, no MSS clamping |
| SSH connects then freezes | MTU/MSS issue on the path |

MTU by technology: Ethernet 1500, VLAN tag −4, GRE −24, IPsec −50 to −73, VXLAN −50.

## Ports: how one IP carries many conversations

A connection is identified by the **5-tuple**:

```
source IP, source port, destination IP, destination port, protocol
```

That is how your laptop holds 200 connections to the same server on port 443 and keeps
them all separate.

| Range | Name | Notes |
|---|---|---|
| 0–1023 | Well-known | HTTP 80, HTTPS 443, SSH 22, DNS 53 |
| 1024–49151 | Registered | vendor-specific services |
| 49152–65535 | Ephemeral | client-side source ports |

See Appendix A for the full port table you actually need.

## The troubleshooting ladder

When something is broken, walk the stack. Do not skip.

1. **L1:** Is the link up? `ip link`, `ethtool eth0`, LED, `show interface`
2. **L2:** Is the MAC reachable? `ip neigh`, `show mac address-table`, VLAN correct?
3. **L3:** Is there a route? `ip route`, `show ip route`, `ping`, `traceroute`
4. **L4:** Is the port open? `ss -tulpn`, `nc -vz host port`, firewall rules
5. **L7:** Does the app answer? `curl -v`, `dig`, logs

Each step answers a yes/no question. Once a step fails, stop and fix that — do not
"try random things" at Layer 7 when the cable is unplugged.

## Chapter check

1. A web request fails with a certificate error. Which layer?
2. Ping works to an IP but not to a hostname. Which layer, and what do you check first?
3. Why is the 5-tuple important for NAT and firewalls?
4. You enable a GRE tunnel and large transfers start hanging. What changed?

<details>
<summary>Answers</summary>

1. Layer 6/7 (TLS). The path is fine; the certificate chain or time is wrong.
2. Layer 7 (DNS), not Layer 3. Check resolver config and `dig`.
3. Because NAT and stateful firewalls track each conversation by those five fields.
4. GRE reduced the MTU by 24 bytes; path MTU discovery is failing. Lower the tunnel MTU or clamp MSS.

</details>
