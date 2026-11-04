# 03 · Ethernet, MAC Addresses, and Switching

Ethernet is Layer 2. It moves frames between devices on the **same local network**.
It does not know about IP, and it does not route.

## The Ethernet frame

```
+---------+---------+---------+----------+-------------+-----+
| Dst MAC | Src MAC |  Type   | Payload  |     FCS     | IFG |
| 6 bytes | 6 bytes | 2 bytes | 46-1500  |   4 bytes   |     |
+---------+---------+---------+----------+-------------+-----+
```

| Field | Purpose |
|---|---|
| Destination MAC | Who should receive this frame |
| Source MAC | Who sent it |
| Type | What is inside: 0x0800 = IPv4, 0x86DD = IPv6, 0x8100 = VLAN tag, 0x0806 = ARP |
| Payload | The IP packet |
| FCS | CRC for error detection |

Minimum frame: 64 bytes. Maximum: 1518 bytes (1522 with a VLAN tag). Frames outside
that range are usually dropped as "runts" or "giants".

## MAC addresses

A 48-bit address, written as six hex pairs: `00:1A:2B:3C:4D:5E`.

- First 3 bytes = **OUI** (manufacturer).
- Last 3 bytes = assigned by the manufacturer.
- **Unicast** — destined for one NIC.
- **Broadcast** — `FF:FF:FF:FF:FF:FF`, every device in the broadcast domain.
- **Multicast** — starts with `01:00:5E` (IPv4) or `33:33` (IPv6) at the Ethernet level.

MAC addresses are **local to the link**. They are not routed. When a router forwards a
packet to a new network, it writes new source and destination MACs for the next hop.

## How a switch works

A switch is a Layer-2 device that learns which MAC lives on which port.

1. Frame arrives on port 3 from `AA:AA:...`
2. Switch records `AA:AA -> port 3` in its **MAC address table** (CAM table).
3. It looks up the destination MAC:
   - known -> forward out that port only (**unicast**)
   - unknown -> flood out all ports except the source (**unknown unicast flood**)
   - broadcast/multicast -> flood
4. Frames age out of the table after ~300 seconds by default.

```
Cisco:  show mac address-table
Linux:  bridge fdb show
```

## Collision domains and broadcast domains

- A **collision domain** is a set of devices that can collide. Each switch port is its own
  collision domain. A hub is one big collision domain (avoid hubs).
- A **broadcast domain** is a set of devices that receive each other's broadcasts.
  A switch (without VLANs) is one broadcast domain. **A VLAN is a broadcast domain.**

This distinction is the reason VLANs exist.

## Duplex and speed

| Mode | Behaviour | Symptom when mismatched |
|---|---|---|
| Full duplex | send and receive at the same time | — |
| Half duplex | one direction at a time, uses CSMA/CD | collisions, late collisions, slow throughput |

Autonegotiation usually works. When it does not — often with old gear, or a hard-coded
side — you get a duplex mismatch. Symptom: **link is up, ping works, throughput is
terrible, FCS/CRC and late-collision counters climb**.

```
Cisco:  show interfaces | include duplex|collision|CRC
Linux:  ethtool eth0
```

## ARP: finding a MAC from an IP

Before A can send a frame to B on the same subnet, it needs B's MAC.

```
A: "Who has 192.168.1.20? Tell 192.168.1.10"   -> broadcast FF:FF:FF:FF:FF:FF
B: "192.168.1.20 is at BB:BB:BB:BB:BB:BB"      -> unicast back to A
```

Then A caches the mapping. If the destination is on another subnet, A ARPs for the
**default gateway**, not for the remote host — a detail that trips up a lot of beginners.

```
Cisco:  show arp
Linux:  ip neigh
```

**Gratuitous ARP** — an unsolicited ARP announcement, used when an interface comes up or
an IP moves (failover). It is also the basis of ARP spoofing attacks.

## Common Layer-2 attacks (and why they matter to you)

| Attack | How | Defence |
|---|---|---|
| MAC flooding | fill the CAM table so the switch floods everything | port security, MAC limits |
| ARP spoofing | answer ARP for the gateway | Dynamic ARP Inspection, static entries |
| VLAN hopping | double-tagged frames or trunk negotiation | disable DTP, set access ports explicitly, native VLAN ≠ 1 |
| STP takeover | become the root bridge | BPDU guard, root guard |
| DHCP starvation | exhaust the DHCP pool | DHCP snooping, port security |

You do not need to be a security engineer, but you must know these exist because they are
configured on switches you will touch.

## Media types you will meet

| Medium | Distance | Notes |
|---|---|---|
| Cat5e | 100 m | 1 Gbps |
| Cat6 / 6a | 100 m | 1 Gbps / 10 Gbps |
| Multimode fiber (OM3/OM4) | 300–550 m | 10–100 Gbps, cheap optics |
| Single-mode fiber | kilometres | long haul, expensive optics |
| DAC cable | 1–5 m | direct attach copper in racks |
| Wi-Fi | varies | shared medium, half duplex |

Rule: **copper inside the rack and to the desk, fiber between buildings and to the core.**

## Chapter check

1. A switch receives a frame for a MAC not in its table. What does it do?

   - A. Floods it out of every other port in the same VLAN.
   - B. Drops it and sends an ICMP unreachable.
   - C. Sends it to the default gateway.
   - D. Floods it out of every port in every VLAN.

2. Why does a host ARP for the gateway instead of the destination when the destination is remote?

   - A. The destination MAC is always the gateway's MAC for the whole path.
   - B. ARP only works for local subnets, so it asks the gateway to proxy.
   - C. The switch rewrites the destination MAC at every hop.
   - D. The frame's destination MAC must be the next hop; the router re-frames for the next segment.

3. Link is up, ping works, but file transfer is 2 Mbps on a 1 Gbps link. What do you check?

   - A. Replace the switch; ping success proves the ASIC is failing.
   - B. Duplex mismatch, CRC/FCS errors, or a speed mismatch - check show interfaces counters.
   - C. Increase the TCP window size on the server.
   - D. Change the VLAN to the native VLAN.

4. How many broadcast domains are in a switch with 24 ports and 3 VLANs?

   - A. One - the switch is a single broadcast domain.
   - B. 24 - every port is its own broadcast domain.
   - C. Six - one per VLAN pair.
   - D. Three - each VLAN is its own broadcast domain.

<details>
<summary>Answers</summary>

1. **A** - It floods the frame out of every other port in the same VLAN (unknown unicast flood).
2. **D** - The frame's destination MAC must be the next hop; the router re-frames for the next segment.
3. **B** - Duplex mismatch, CRC/FCS errors, or a speed mismatch - check show interfaces counters.
4. **D** - Three. Each VLAN is its own broadcast domain.

</details>
