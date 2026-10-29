# 09 · BGP

BGP is the routing protocol of the Internet and of every large enterprise. It does not
find the shortest path. It implements **policy**: who is allowed to reach what, through
whom.

If OSPF asks "what is the fastest road?", BGP asks "which road am I contractually and
politically allowed to use?"

## Autonomous Systems

An **AS** is a network under one administrative control, identified by a number.

- Public ASN: assigned by a registry (e.g. 13335 Cloudflare)
- Private ASN: 64512–65534 (and 4200000000–4294967294 for 32-bit)

```
AS 65001 ---- AS 65002 ---- AS 65003
   eBGP          eBGP
```

- **eBGP** — between different ASes. Default TTL 1, next hop changes.
- **iBGP** — inside one AS. Full mesh required, next hop does not change by default.

## Why iBGP needs full mesh or route reflectors

BGP does not re-advertise a route learned from one iBGP peer to another (loop prevention).
So with *n* routers you need *n(n−1)/2* sessions. At 20 routers that is 190 sessions.

Solutions:

- **Route reflector (RR)** — one router reflects routes to clients.
- **Confederation** — split the AS into sub-ASes.

In practice: route reflectors, always.

## The BGP session

BGP runs over **TCP port 179**. It does not discover neighbors — you configure them.

```
Neighbor states:
Idle -> Connect -> Active -> OpenSent -> OpenConfirm -> Established
```

- **Active** means "trying to connect" (counter-intuitive but correct).
- **Established** means the session is up and routes are exchanging.

```
Cisco:  show bgp summary
        show bgp ipv4 unicast summary
        show bgp neighbors 10.1.1.2
FRR:    show bgp summary
```

## Path attributes

A BGP route is a prefix plus a set of attributes.

| Attribute | Type | Meaning |
|---|---|---|
| **AS_PATH** | well-known mandatory | sequence of ASes the route traversed |
| **NEXT_HOP** | well-known mandatory | where to send traffic |
| **ORIGIN** | well-known mandatory | IGP, EGP, or incomplete |
| **LOCAL_PREF** | well-known discretionary | preference inside the AS (higher wins) |
| **MED** | optional | hint to the neighbouring AS (lower wins) |
| **WEIGHT** | Cisco proprietary | local preference, highest wins, not advertised |
| **COMMUNITY** | optional transitive | tags for policy (e.g. no-export) |
| **ATOMIC_AGGREGATE / AGGREGATOR** | optional | summarization metadata |

## Best path selection

Cisco's order, simplified. Stop at the first difference.

1. **Highest weight** (local only)
2. **Highest local preference**
3. **Locally originated** (network command, redistribute)
4. **Shortest AS_PATH**
5. **Lowest origin** (IGP < EGP < incomplete)
6. **Lowest MED**
7. **eBGP over iBGP**
8. **Lowest IGP metric to the next hop**
9. **Oldest route** (eBGP only)
10. **Lowest router ID**
11. **Lowest neighbor address**

Memorise the first six. That covers 95% of real questions.

**The most important insight:** BGP prefers the path with the fewest AS hops only at
step 4. Local preference beats everything except weight — which is why enterprises control
outbound traffic with local preference and inbound traffic with AS_PATH prepending or
communities.

## Basic configuration

```
router bgp 65001
 bgp router-id 1.1.1.1
 neighbor 10.1.1.2 remote-as 65002
 network 192.168.10.0 mask 255.255.255.0
 !
 address-family ipv4 unicast
  neighbor 10.1.1.2 activate
  neighbor 10.1.1.2 route-map FROM-ISP in
  neighbor 10.1.1.2 route-map TO-ISP out
```

FRR equivalent:

```
router bgp 65001
 bgp router-id 1.1.1.1
 neighbor 10.1.1.2 remote-as 65002
 address-family ipv4 unicast
  network 192.168.10.0/24
  neighbor 10.1.1.2 activate
```

## Filtering: the part that actually matters

You never trust a BGP peer. You filter both directions.

| Tool | Purpose |
|---|---|
| **prefix-list** | match prefixes and lengths |
| **route-map** | match and modify attributes |
| **as-path filter** | match AS paths |
| **community list** | match tags |
| **maximum-prefix** | safety limit against leaks |

```
ip prefix-list PL-OUT seq 10 permit 192.168.10.0/24
!
route-map TO-ISP permit 10
 match ip address prefix-list PL-OUT
!
neighbor 10.1.1.2 maximum-prefix 1000 80 warning-only
```

**Route leaks** happen when you advertise prefixes you do not own. The 2008 Pakistan
Telecom YouTube outage and the 2021 Facebook outage both came from BGP mistakes. Always
filter outbound, always set maximum-prefix.

## Useful knobs

| Goal | Method |
|---|---|
| Prefer one ISP for outbound | higher local preference |
| Prefer one ISP for inbound | AS_PATH prepend to the other |
| Backup only (no transit) | communities from the ISP |
| Load sharing across two ISPs | accept both, let BGP decide per prefix |
| Faster failover | BFD, `bgp fast-external-fallover` |
| Prevent loops | AS_PATH (built in) |

## Common failures

| Symptom | Cause |
|---|---|
| Session stuck in Active | wrong neighbor IP, no route to it, firewall 179 |
| Session flapping | MTU, CPU, keepalive mismatch, unstable link |
| Session up, no routes | prefix not in table, `network` command wrong, filter blocking |
| Routes received but not installed | next hop unreachable, iBGP sync, better path exists |
| Only one path used | BGP picks one best path by default; use multipath |
| Sudden traffic shift | a prefix was withdrawn somewhere upstream |

```
show bgp summary
show bgp ipv4 unicast
show bgp ipv4 unicast 10.0.0.0/8
show bgp neighbors 10.1.1.2 advertised-routes
show bgp neighbors 10.1.1.2 received-routes
```

## Chapter check

1. Why does BGP use TCP and not a raw IP protocol?
2. Session is stuck in `Active`. Is it connected?
3. Two paths: one with local pref 200 and 5 AS hops, one with local pref 100 and 1 AS hop.
   Which wins?
4. Why is full-mesh iBGP a problem at scale?
5. What is AS_PATH prepending used for?

<details>
<summary>Answers</summary>

1. Reliability, ordered delivery, and reuse of existing TCP stack — BGP can be large and long-lived.
2. No — "Active" means it is actively trying to establish a TCP connection.
3. The one with local preference 200. Local pref is checked before AS path length.
4. Sessions grow as n(n−1)/2; route reflectors or confederations are needed.
5. To make a path look longer so inbound traffic prefers another link.

</details>
