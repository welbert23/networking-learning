# C · Reference Tables

## IPv4 subnet reference

| Prefix | Mask | Block | Usable hosts | Networks in /24 |
|---|---|---|---|---|
| /24 | 255.255.255.0 | 256 | 254 | 1 |
| /25 | 255.255.255.128 | 128 | 126 | 2 |
| /26 | 255.255.255.192 | 64 | 62 | 4 |
| /27 | 255.255.255.224 | 32 | 30 | 8 |
| /28 | 255.255.255.240 | 16 | 14 | 16 |
| /29 | 255.255.255.248 | 8 | 6 | 32 |
| /30 | 255.255.255.252 | 4 | 2 | 64 |
| /31 | 255.255.255.254 | 2 | 2 (RFC 3021) | 128 |
| /32 | 255.255.255.255 | 1 | 1 | 256 |

### Quick lookup by mask octet

| Mask octet | Block | Prefix |
|---|---|---|
| 0 | 256 | /24 |
| 128 | 128 | /25 |
| 192 | 64 | /26 |
| 224 | 32 | /27 |
| 240 | 16 | /28 |
| 248 | 8 | /29 |
| 252 | 4 | /30 |
| 254 | 2 | /31 |
| 255 | 1 | /32 |

## Private address space

| Range | Prefix | Hosts |
|---|---|---|
| 10.0.0.0 – 10.255.255.255 | 10.0.0.0/8 | ~16.7 M |
| 172.16.0.0 – 172.31.255.255 | 172.16.0.0/12 | ~1.05 M |
| 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 | 65,534 |

## Administrative distance

| Source | AD |
|---|---|
| Connected | 0 |
| Static | 1 |
| eBGP | 20 |
| EIGRP internal | 90 |
| OSPF | 110 |
| IS-IS | 115 |
| RIP | 120 |
| EIGRP external | 170 |
| iBGP | 200 |
| Unusable | 255 |

## Routing protocol comparison

| | OSPF | IS-IS | BGP | EIGRP |
|---|---|---|---|---|
| Type | link state | link state | path vector | advanced distance vector |
| Scope | intra-domain | intra-domain | inter-domain | intra-domain |
| Algorithm | SPF | SPF | best path attributes | DUAL |
| Transport | IP 89 | CLNS | TCP 179 | IP 88 |
| Metric | cost | cost | attributes | composite |
| Convergence | fast | very fast | configurable | very fast |
| Typical use | enterprise | ISP core | Internet/edge | Cisco shops |

## STP port states

| Classic | RSTP | Forwards |
|---|---|---|
| Disabled | Discarding | no |
| Blocking | Discarding | no |
| Listening | Discarding | no |
| Learning | Learning | no |
| Forwarding | Forwarding | yes |

## STP costs

| Link speed | Cost (short) | Cost (long) |
|---|---|---|
| 10 Mbps | 100 | 2,000,000 |
| 100 Mbps | 19 | 200,000 |
| 1 Gbps | 4 | 20,000 |
| 10 Gbps | 2 | 2,000 |
| 100 Gbps | — | 200 |

## BGP best-path order

1. Highest weight
2. Highest local preference
3. Locally originated
4. Shortest AS_PATH
5. Lowest origin
6. Lowest MED
7. eBGP over iBGP
8. Lowest IGP metric to next hop
9. Oldest route (eBGP)
10. Lowest router ID
11. Lowest neighbor address

## DSCP values

| Name | Value | Per-hop behaviour |
|---|---|---|
| Default | 0 | best effort |
| CS1 | 8 | scavenger |
| AF11 | 10 | low loss |
| AF21 | 18 | low latency data |
| AF31 | 26 | broadcast video |
| AF41 | 34 | streaming video |
| EF | 46 | voice |
| CS6 | 48 | network control |
| CS7 | 56 | reserved |

## Cable and optics

| Type | Max distance | Speed |
|---|---|---|
| Cat5e | 100 m | 1 Gbps |
| Cat6 | 100 m | 1–10 Gbps |
| Cat6a | 100 m | 10 Gbps |
| Cat7/8 | 30–100 m | 10–40 Gbps |
| OM3 MMF | 300 m @ 10G | 10–40 Gbps |
| OM4 MMF | 550 m @ 10G | 10–100 Gbps |
| OS2 SMF | 10+ km | 10–400 Gbps |
| DAC | 1–7 m | 10–100 Gbps |

## Ethernet frame sizes

| Item | Size |
|---|---|
| Minimum frame | 64 bytes |
| Standard MTU | 1500 bytes |
| Max standard frame | 1518 bytes |
| With VLAN tag | 1522 bytes |
| Jumbo frame | 9000+ bytes |
| Preamble + SFD | 8 bytes |
| Inter-frame gap | 12 bytes |

## Time and logging

| Item | Value |
|---|---|
| NTP port | 123/UDP |
| NTP stratum 0 | reference clock |
| NTP stratum 16 | unsynchronized |
| Syslog port | 514/UDP |
| Syslog TLS | 6514/TCP |
| Default syslog buffer | 4 KB – 16 KB typical |
| Syslog levels | 0 emergency … 7 debugging |

## Latency references

| Path | RTT |
|---|---|
| Same switch | < 0.1 ms |
| Same data center | 0.2–1 ms |
| Metro | 1–5 ms |
| Cross-country | 30–70 ms |
| Transatlantic | 70–90 ms |
| Cross-Pacific | 150–250 ms |
| GEO satellite | 500–700 ms |
