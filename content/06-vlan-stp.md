# 06 · Switching in Depth: VLANs, Trunks, STP

Everything here happens at Layer 2, inside one broadcast domain — or between several of
them if you configure it right.

## VLANs

A VLAN is a logical switch inside the physical switch. Each VLAN is its own broadcast
domain, its own MAC table view, and its own subnet (by convention).

Why they exist:

- **Segmentation** — voice, data, guest, IoT, management, each isolated
- **Security** — a compromised printer cannot sniff HR traffic
- **Flexibility** — move a port to another VLAN with one command
- **Scale** — 48 ports split into 6 VLANs without 6 switches

```
Cisco:  vlan 10
        name USERS
        interface Gi0/5
         switchport mode access
         switchport access vlan 10
```

## Access ports and trunk ports

| Port type | Carries | Connected to |
|---|---|---|
| **Access** | One VLAN, untagged | end devices (PC, printer, AP) |
| **Trunk** | Many VLANs, tagged | another switch, router, hypervisor, firewall |

Trunking uses **802.1Q**: a 4-byte tag inserted after the source MAC.

```
+------+------+--------+------+---------+-----+
| Dst  | Src  | 0x8100 | VLAN | Type    | ... |
|      |      |  (TPID)| (12b)|         |     |
+------+------+--------+------+---------+-----+
```

- **TPID** `0x8100` marks the frame as tagged.
- **VLAN ID** 12 bits → 1–4094 usable.
- Frames on the **native VLAN** are sent untagged on the trunk.

### Native VLAN

By default, untagged frames on a trunk belong to VLAN 1. Best practice:

- Set native VLAN to an unused VLAN on both ends (must match).
- Never use VLAN 1 for user traffic.
- Mismatched native VLANs cause silent cross-VLAN leakage — a real security issue.

```
Cisco:  interface Gi0/1
         switchport mode trunk
         switchport trunk allowed vlan 10,20,30
         switchport trunk native vlan 999
```

**Always set `allowed vlan` explicitly.** Default is all VLANs, which is how a guest VLAN
ends up trunked to a place it should not be.

## Inter-VLAN routing

Two ways to route between VLANs:

| Method | How | Use when |
|---|---|---|
| **Router-on-a-stick (ROAS)** | router subinterfaces, one per VLAN, over one trunk | small sites, lab |
| **SVI (switch virtual interface)** | L3 switch has an interface per VLAN | normal enterprise design |
| **Routed port** | switch port is a router port (`no switchport`) | core and data center links |

```
ROAS on the router:
interface Gi0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0
```

```
SVI on a L3 switch:
interface Vlan10
 ip address 192.168.10.1 255.255.255.0
ip routing
```

ROAS has a single trunk as a bottleneck. SVI scales in hardware. Learn ROAS to understand
the concept, use SVI in real designs.

## Spanning Tree Protocol (STP)

Redundant Layer-2 links create **loops**. Broadcast frames would circulate forever, MAC
tables would thrash, and the network would die in seconds. STP prevents this by blocking
redundant ports.

### How it works

1. **Elect one root bridge** — lowest **bridge ID** (priority + MAC).
2. Every other switch picks **one root port** — the lowest-cost path to the root.
3. Each segment picks **one designated port** per segment.
4. All other ports go to **blocking** (or discarding in RSTP).

```
        [Root]
        /    \
      [SW2]--[SW3]      one link is blocked
```

### Port states

| 802.1D (classic) | 802.1w (RSTP) | Forwards data? |
|---|---|---|
| Blocking | Discarding | no |
| Listening | Discarding | no |
| Learning | Learning | no (learns MACs) |
| Forwarding | Forwarding | yes |
| Disabled | Disabled | no |

Classic STP takes **30–50 seconds** to converge. RSTP takes **under a second**.
Modern networks run RSTP (802.1w) or MSTP (802.1s). Never design with classic STP.

### Cost

| Speed | STP cost (short mode) |
|---|---|
| 10 Mbps | 100 |
| 100 Mbps | 19 |
| 1 Gbps | 4 |
| 10 Gbps | 2 |

### Timers and tuning

- Hello 2 s, forward delay 15 s, max age 20 s (classic).
- Set **priority 4096 or 0** on the switch you want as root, and never leave it random.
- **PortFast** on access ports to skip listening/learning for end devices.
- **BPDU Guard** on access ports to shut them down if a switch is plugged in.
- **Root Guard** on ports facing other networks to stop a rogue root.
- **Loop Guard** on fiber/trunk links to prevent loops from unidirectional failures.

### Common STP problems

| Symptom | Cause |
|---|---|
| Network freezes on a new cable | physical loop, STP disabled or filtered |
| Root bridge is an old access switch | default priority, nobody set the root |
| Flapping links, TCN storms | unstable link or duplex mismatch |
| Port stuck in blocking | wrong cost or priority, or a loop |

```
Cisco:  show spanning-tree
        show spanning-tree root
        show spanning-tree interface Gi0/1 detail
```

## EtherChannel / LAG

Bundle several links into one logical link for bandwidth and redundancy.

| Protocol | Notes |
|---|---|
| **LACP (802.3ad)** | open standard, active/passive, recommended |
| **PAgP** | Cisco proprietary, desirable/auto |
| **Static (on)** | no negotiation, fragile — avoid |

Requirements: same speed, same duplex, same VLAN config, same trunk settings on all members.

```
interface range Gi0/1-2
 channel-group 1 mode active
!
interface Port-channel1
 switchport mode trunk
```

Hashing is per-flow, not per-packet. One TCP connection will not exceed one member link's
speed. Do not promise "2 Gbps" to a single server.

## Port security

Limit which MACs can use a port.

```
interface Gi0/5
 switchport port-security
 switchport port-security maximum 2
 switchport port-security violation restrict
 switchport port-security mac-address sticky
```

Violation modes: `protect` (drop silently), `restrict` (drop + log + counter),
`shutdown` (err-disable). Know all three — it is a classic exam and interview question.

## Discovery protocols: CDP and LLDP

| Protocol | Owner | Layer | Notes |
|---|---|---|---|
| **CDP** | Cisco proprietary | Layer 2 | On by default, very detailed |
| **LLDP** | IEEE 802.1AB | Layer 2 | Vendor-neutral, must usually be enabled |

```
show cdp
show cdp neighbors
show cdp neighbors detail
show lldp
show lldp neighbors
show lldp neighbors detail
```

They advertise device name, platform, software version, management address, local port, and remote port. That is wonderful for documentation, topology discovery, and voice deployments (LLDP-MED), and it is also free reconnaissance for an attacker.

```
no cdp run
interface Gi0/1
 no cdp enable
 no lldp transmit
 no lldp receive
```

Keep discovery on trusted infrastructure links; disable it toward user ports, guest networks, and untrusted service providers. If you disable it everywhere, you also lose the fastest way to prove what is plugged into which port.

## Rapid PVST+ and STP protection

| Variant | Standard | Scope | Notes |
|---|---|---|---|
| **STP** | 802.1D | One tree | Slow, 30 to 50 seconds |
| **PVST+** | Cisco | One tree per VLAN | Load sharing, still slow |
| **RSTP** | 802.1w | One tree | Fast convergence, edge ports |
| **Rapid PVST+** | Cisco | One rapid tree per VLAN | Common Cisco campus default |
| **MSTP** | 802.1s | Groups of VLANs | Scales well, needs matching regions |

RSTP adds alternate and backup port roles and negotiates with neighbours instead of waiting for timers. Edge ports (PortFast) skip listening and learning and go straight to forwarding, which is correct for host ports and dangerous for switch ports.

```
spanning-tree mode rapid-pvst
spanning-tree vlan 10 root primary
spanning-tree portfast default
spanning-tree portfast bpduguard default
!
interface Gi0/24
 spanning-tree guard root
 storm-control broadcast level 20
```

- **PortFast** - only on ports that face end devices.
- **BPDU Guard** - err-disables the port if a BPDU arrives. Stops users from plugging in a switch.
- **Root Guard** - stops a downstream switch from becoming root.
- **Loop Guard** - protects against unidirectional links that would otherwise create a loop.
- **Storm control** - rate-limits broadcast, multicast, or unknown unicast flooding.

```
show spanning-tree summary
show spanning-tree vlan 10
show spanning-tree root
show errdisable recovery
errdisable recovery cause bpduguard
errdisable recovery interval 300
```

BPDU Guard puts a port into err-disabled state; it does not fix itself. Know how to recover it, and know why it happened before you re-enable the port.

## Chapter check

1. Two switches, a trunk between them, native VLAN mismatched. What happens?

   - A. The trunk shuts down automatically.
   - B. Untagged frames leak into the other side's native VLAN, plus a CDP warning.
   - C. All VLANs are blocked until the mismatch is fixed.
   - D. The switch rewrites all tags to VLAN 1.

2. Why does a Layer-2 loop kill a network so fast?

   - A. STP converts loops into routing loops at Layer 3.
   - B. Loops only affect the management VLAN.
   - C. Switches rate-limit broadcasts per port by default.
   - D. Broadcasts have no TTL at Layer 2. They loop forever, flooding and thrashing MAC tables.

3. Which switch becomes root if all priorities are default?

   - A. The switch with the lowest MAC address.
   - B. The switch with the highest MAC address.
   - C. The oldest switch by uptime.
   - D. The switch closest to the default gateway.

4. You need 4 Gbps between two switches. Is a 4-link EtherChannel enough for one backup job?

   - A. Yes - the bundle always aggregates to 4 Gbps per flow.
   - B. No - EtherChannel is limited to two links.
   - C. No - hashing is per flow, so one TCP flow uses at most one member link.
   - D. Yes - if LACP is set to active mode.

5. What is the difference between an access port and a trunk port in one sentence?

   - A. Access carries one untagged VLAN to an end device; a trunk carries many tagged VLANs between network devices.
   - B. Access carries tagged frames; a trunk carries untagged frames.
   - C. Access is for routers; a trunk is for hosts.
   - D. Access uses 802.1Q; a trunk uses no tagging.

<details>
<summary>Answers</summary>

1. **B** - Untagged frames leak into the other side's native VLAN, plus a CDP warning.
2. **D** - Broadcasts have no TTL at Layer 2. They loop forever, flooding and thrashing MAC tables.
3. **A** - The switch with the lowest MAC address wins when priorities are equal.
4. **C** - No. Hashing is per flow, so one TCP flow uses at most one member link.
5. **A** - Access carries one untagged VLAN to an end device; a trunk carries many tagged VLANs between network devices.

</details>
