# 08 · OSPF

OSPF is the most common interior routing protocol in enterprise networks. It is a
**link-state** protocol: every router builds a complete map of the area and computes
shortest paths with Dijkstra.

## The idea in one paragraph

Each router describes its own links (who I am, who I am connected to, what it costs).
Those descriptions are flooded to every router in the area. Every router ends up with
the **same map** (the link-state database). Each router then runs the same algorithm on
the same map, so everyone agrees on the best path. No rumours, no counting to infinity.

## Neighbors first

Before any routing happens, two routers must become **neighbors**.

| Packet type | Purpose |
|---|---|
| Hello | "I am here", keeps the adjacency alive |
| DBD | summary of my database |
| LSR / LSU / LSAck | request, send, acknowledge details |

Hello timers must match:

| Network type | Hello | Dead |
|---|---|---|
| Broadcast (Ethernet) | 10 s | 40 s |
| Point-to-point | 10 s | 40 s |
| NBMA | 30 s | 120 s |

If hello/dead, area ID, authentication, or subnet do not match, the adjacency stays down.

### Neighbor states

```
Down -> Init -> 2-Way -> ExStart -> Exchange -> Loading -> Full
```

- **2-Way** is normal between two non-DR routers on a broadcast segment.
- **Full** means databases are synchronized.
- Stuck in `ExStart` usually means an MTU mismatch.

## DR and BDR

On a broadcast segment with many routers, everyone would form a full adjacency with
everyone else (n² adjacencies). Instead, they elect a **Designated Router** and a
**Backup DR**, and everyone syncs with those two.

- Election: highest **priority** wins, then highest **router ID**.
- Priority 0 means "never become DR".
- Non-preemptive: a new router with higher priority does not take over until the DR fails.

```
Cisco:  show ip ospf neighbor
        show ip ospf interface Gi0/1
```

## Areas

Large flat networks are hard to compute and unstable. OSPF splits them into areas.

- **Area 0** (backbone) — all other areas must connect to it.
- **Normal area** — full LSDB for its own area, summaries for the rest.
- **Stub / totally stubby** — no external routes (or no summaries either). Smaller tables.
- **NSSA** — stub but can import external routes as type 7.

```
        Area 1 --- Area 0 --- Area 2
                     |
                   ABR
```

**ABR** (Area Border Router) connects areas. **ASBR** injects external routes.

Every area must touch Area 0, directly or through a **virtual link** (avoid virtual links;
they are a design smell).

## LSAs you must know

| Type | Name | Origin |
|---|---|---|
| 1 | Router LSA | every router, its links |
| 2 | Network LSA | DR, the broadcast segment |
| 3 | Summary LSA | ABR, prefixes between areas |
| 4 | ASBR Summary | ABR, how to reach an ASBR |
| 5 | External LSA | ASBR, redistributed routes |
| 7 | NSSA External | ASBR inside an NSSA |

Types 1 and 2 build the map. Types 3–5 tell you what is outside.

## Cost

```
cost = reference bandwidth / interface bandwidth
```

Default reference is 100 Mbps, so a 1 Gbps link costs 1 and a 10 Gbps link also costs 1.
That is why modern networks change the reference:

```
router ospf 1
 auto-cost reference-bandwidth 10000
```

Or set it manually:

```
interface Gi0/1
 ip ospf cost 10
```

Lower cost wins. Cost is **cumulative** along the path.

## Configuration, minimal

```
router ospf 1
 router-id 1.1.1.1
 network 10.0.0.0 0.0.0.255 area 0
 network 10.1.0.0 0.0.0.255 area 0
 passive-interface Gi0/2
!
interface Gi0/1
 ip ospf 1 area 0
```

Always set an explicit **router ID**. Passive interfaces on links with no neighbors
(users, loopbacks) — a classic hardening step.

Same lab in FRR:

```
router ospf
 ospf router-id 1.1.1.1
 network 10.0.0.0/24 area 0
```

## Convergence

When a link fails:

1. Dead timer expires (40 s by default) or the interface goes down immediately.
2. The router floods a new LSA.
3. Every router recomputes SPF.
4. New routes install.

Tuning for faster convergence: BFD (sub-second failure detection), fast hellos,
event-driven SPF. Do not tune timers before you understand them — flapping adjacencies
are worse than slow convergence.

## Troubleshooting table

| Symptom | Check |
|---|---|
| Neighbor stuck in `INIT` | one-way communication, ACL, or multicast blocked |
| Stuck in `2-WAY` | normal on broadcast between non-DR routers |
| Stuck in `EXSTART` | MTU mismatch on the link |
| Stuck in `LOADING` | corrupt or missing LSA, retransmission |
| Route missing | area mismatch, passive interface, network statement wrong |
| Route present but no traffic | ACL, asymmetric path, or a duplicate router ID |
| Flapping adjacency | bad link, duplex mismatch, CPU overload |

```
show ip ospf neighbor
show ip ospf database
show ip ospf interface brief
show ip route ospf
debug ip ospf adj        # use carefully, it is verbose
```

## Design rules that save you later

1. One area 0, keep it small and stable.
2. Summarize at ABRs (`area 1 range 10.10.0.0 255.255.0.0`).
3. Never run OSPF on user-facing ports (passive-interface default).
4. Set router IDs manually and document them.
5. Keep the topology shallow; OSPF is not a WAN design tool for 500 sites.

## Chapter check

1. Why does OSPF use a DR on Ethernet but not on point-to-point?
2. Two routers have hello 10 and hello 30. What happens?
3. What LSA type tells you about a prefix in another area?
4. Why does a 10 Gbps link cost the same as a 1 Gbps link by default?
5. Adjacency stuck in EXSTART — what is the most likely cause?

<details>
<summary>Answers</summary>

1. To avoid n² adjacencies on a shared segment; point-to-point has only two routers, so no election is needed.
2. They never form an adjacency (hello timers must match).
3. Type 3 (Summary LSA) from the ABR.
4. The default reference bandwidth is 100 Mbps; both links exceed it, so both cost 1.
5. MTU mismatch on the two interfaces.

</details>
