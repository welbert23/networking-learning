# 15 · Labs

Fifteen labs, in order. Each one has a **goal**, a **tool**, and a **proof** — the thing you
show someone to prove you did it.

Do not skip the proof. A lab you cannot demonstrate is a lab you did not learn.

## Lab 01 — Two hosts, one switch

- **Goal:** ping between two PCs on the same VLAN; read the MAC table.
- **Tool:** Packet Tracer
- **Proof:** `show mac address-table` output + explanation of why each MAC is on that port.

## Lab 02 — ARP and the gateway

- **Goal:** see ARP for the gateway when pinging a remote host.
- **Tool:** Packet Tracer simulation mode + Wireshark
- **Proof:** capture showing ARP request for the gateway, not for the destination.

## Lab 03 — Subnetting drill

- **Goal:** 50 random addresses, 100% correct.
- **Tool:** pen and paper, then `ipcalc`
- **Proof:** a sheet of worked answers with zero corrections.

## Lab 04 — VLANs and trunks

- **Goal:** two VLANs, one trunk, inter-VLAN routing with router-on-a-stick.
- **Tool:** Packet Tracer
- **Proof:** topology + `show vlan brief` + `show interfaces trunk` + successful cross-VLAN ping.

## Lab 05 — Break the trunk

- **Goal:** remove a VLAN from the allowed list and document the symptom.
- **Tool:** Packet Tracer
- **Proof:** a short table: what you broke, what you saw, how you fixed it.

## Lab 06 — STP

- **Goal:** three switches in a triangle; find the root, the root ports, the blocked port.
- **Tool:** Packet Tracer
- **Proof:** `show spanning-tree` from all three + a diagram of port roles.

## Lab 07 — OSPF with three routers

- **Goal:** full adjacency, loopbacks reachable, convergence under 10 s.
- **Tool:** containerlab + netlab + FRR
- **Proof:** `show ip ospf neighbor`, `show ip route ospf`, convergence timing.

## Lab 08 — Break OSPF

- **Goal:** cause and diagnose three failures: area mismatch, MTU mismatch, passive interface.
- **Tool:** FRR
- **Proof:** for each: the symptom, the state you saw, the fix.

## Lab 09 — BGP between two ASes

- **Goal:** eBGP session up, loopback advertised, AS_PATH visible.
- **Tool:** FRR
- **Proof:** `show bgp summary` + `show bgp ipv4 unicast` showing the path.

## Lab 10 — BGP policy

- **Goal:** change outbound preference with local preference, inbound with prepending.
- **Tool:** FRR
- **Proof:** before/after `show bgp` output with an explanation of which attribute decided it.

## Lab 11 — ACLs and NAT

- **Goal:** permit only HTTP/HTTPS out, block the rest, PAT the inside network.
- **Tool:** Packet Tracer or FRR + iptables
- **Proof:** policy working from two different source hosts + `show ip nat translations`.

## Lab 12 — DHCP and DNS

- **Goal:** a DHCP pool with relay, a local DNS record, a client that resolves it.
- **Tool:** Linux containers or Packet Tracer server
- **Proof:** `dig` output + DHCP lease table.

## Lab 13 — Wireshark deep dive

- **Goal:** explain six captures: ARP, ICMP TTL, OSPF hello, BGP open, DNS query, TCP retransmission.
- **Tool:** Wireshark
- **Proof:** `notes/observations.md` with "expected / saw / because" for each.

## Lab 14 — Automation: config backup

- **Goal:** back up every running lab device to timestamped files.
- **Tool:** Python
- **Proof:** script in Git + a backup directory + one paragraph on error handling.

## Lab 15 — Automation: intent to config

- **Goal:** YAML inventory → Jinja2 template → rendered config → deployed → verified.
- **Tool:** Python + Jinja2 (+ Nornir if you want)
- **Proof:** a commit showing the template, the rendered output, and the verification report.

---

## How to record a lab

Every lab folder should contain:

```
lab-name/
├── README.md        # goal, topology, what I did, what broke, what I learned
├── topology.yml     # if applicable
├── configs/         # final configs
├── captures/        # pcap files
└── notes.md         # raw observations
```

The README is what you show in an interview. Write it for a stranger.

## Suggested order and timing

| Weeks | Labs |
|---|---|
| 1–2 | 01, 02, 03 |
| 3–4 | 04, 05, 06 |
| 5–6 | 07, 08 |
| 7 | 09, 10 |
| 8 | 11, 12 |
| 9 | 13 |
| 10 | 14, 15 |
