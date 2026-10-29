# 07 · Routing Fundamentals

Routing is the act of choosing a path for a packet between networks. Everything else —
OSPF, BGP, MPLS — is just a way to fill the routing table.

## The routing table

Every router keeps a table of destinations and next hops.

```
Destination        Mask            Next hop        Interface   Metric
0.0.0.0            0.0.0.0         203.0.113.1     Gi0/0       1
10.0.0.0           255.0.0.0       10.1.1.2        Gi0/1       20
192.168.10.0       255.255.255.0   directly connected Gi0/2    0
```

When a packet arrives, the router:

1. Looks up the **destination** in the table.
2. Picks the **most specific match** (longest prefix).
3. If several routes match equally, picks the lowest **administrative distance**.
4. Among routes from the same protocol, picks the lowest **metric**.
5. Rewrites the Layer-2 header and forwards.

## Longest prefix match

```
Routes:  10.0.0.0/8  -> via A
         10.1.0.0/16 -> via B
Packet to 10.1.2.3  -> matches both -> /16 wins -> via B
```

Specificity always beats distance. This is why a host route (`/32`) can override everything.

## Administrative distance

Trust ranking between sources of the same route.

| Source | Cisco AD | Meaning |
|---|---|---|
| Connected | 0 | interface is up |
| Static | 1 | you configured it |
| eBGP | 20 | external BGP |
| OSPF | 110 | link state IGP |
| IS-IS | 115 | link state IGP |
| RIP | 120 | legacy |
| iBGP | 200 | internal BGP |
| Unknown | 255 | never use |

Lower is more trusted. A static route beats OSPF by default — occasionally useful, often
a trap when a "temporary" static route is forgotten for two years.

## Static routes

```
ip route 192.168.20.0 255.255.255.0 10.1.1.2      # next hop
ip route 192.168.20.0 255.255.255.0 Gi0/1         # exit interface
ip route 0.0.0.0 0.0.0.0 203.0.113.1              # default route
ip route 10.9.0.0 255.255.0.0 10.1.1.9 200        # floating static, AD 200
```

**Floating static** — a backup route with a higher AD. It sits unused until the primary
disappears. Classic WAN design trick.

When to use static routes: stub networks, default routes to an ISP, very small sites,
backup paths. Not for anything that changes often.

## Default route

`0.0.0.0/0` matches everything. It is the "rest of the world" entry.

A router with only directly connected routes and a default route is called a **stub router**.
Most branch sites are stubs.

## First-hop redundancy (FHRP)

If the default gateway dies, hosts lose connectivity. FHRP gives them a virtual gateway.

| Protocol | Vendor | Notes |
|---|---|---|
| **HSRP** | Cisco | active/standby, virtual IP + MAC |
| **VRRP** | open standard | master/backup |
| **GLBP** | Cisco | load balancing across gateways |

```
interface Vlan10
 ip address 192.168.10.2 255.255.255.0
 standby 10 ip 192.168.10.1
 standby 10 priority 120
 standby 10 preempt
```

Hosts point at `192.168.10.1` — the virtual address. If the active router fails, the
standby takes over. **Preempt** is what lets the original router take back over when it returns.

## Control plane vs data plane

| Plane | What it does | Examples |
|---|---|---|
| **Control plane** | decides the path, builds tables | OSPF, BGP, STP, ARP |
| **Data plane** | forwards packets | ASIC, TCAM, FIB |
| **Management plane** | you talk to the device | SSH, SNMP, NETCONF |

A router can have a correct control plane and a broken data plane (a bug, an ACL, a
hardware fault). This is why "the route is there but traffic does not pass" is a real
scenario.

## Policy-based routing (brief)

Sometimes you must forward based on source, port, or protocol, not destination.

```
route-map PBR permit 10
 match ip address 101
 set ip next-hop 10.1.1.5
!
interface Gi0/1
 ip policy route-map PBR
```

Useful for forced inspection or dual-ISP tricks. Use sparingly — it breaks the "routing
is destination-based" mental model and confuses everyone later.

## Troubleshooting routing

| Check | Command |
|---|---|
| Is the route present? | `show ip route 10.1.2.3` |
| Which protocol installed it? | `show ip route` (code letter) |
| Is the next hop reachable? | `show ip arp 10.1.1.2`, `ping` |
| Is an ACL dropping it? | `show ip access-lists`, counters |
| Is it asymmetric? | `traceroute` both directions |

**Asymmetric routing** is a favourite interview topic: the reply takes a different path
than the request. Usually fine for routing, fatal for stateful firewalls (they see only
half the flow and drop it).

## Chapter check

1. Routes `10.0.0.0/8` via A and `10.1.0.0/16` via B. Packet to `10.1.5.5` goes where?
2. Static route AD 1 vs OSPF AD 110. Which wins?
3. What does a floating static route do?
4. Why can a stateful firewall break asymmetric routing?
5. What does `0.0.0.0/0` mean?

<details>
<summary>Answers</summary>

1. Via B — longest prefix match.
2. Static, because 1 < 110.
3. It is a backup path that only appears when the primary (lower AD) route is withdrawn.
4. The firewall sees the request but not the reply, so it has no session state and drops the return traffic.
5. The default route: "any destination not matched by a more specific route".

</details>
