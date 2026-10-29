# 13 · Troubleshooting Like an Engineer

This is the chapter that gets you hired. Anyone can configure a lab. Not everyone can
find a problem at 2 a.m. without breaking it further.

## The method

Never troubleshoot by trying random things. Use a loop.

```
1. Define the problem precisely
2. Gather facts
3. Form a hypothesis
4. Test the hypothesis
5. Fix, verify, document
   (if wrong, go back to 3 with new facts)
```

### 1. Define the problem

"The network is down" is not a problem statement. Ask:

- Who is affected? One user, one floor, one site, everyone?
- What exactly fails? DNS, a specific app, all traffic?
- When did it start? What changed recently?
- Is it constant or intermittent?

**"What changed?"** solves more tickets than any command.

### 2. Gather facts

| Layer | Fact | Tool |
|---|---|---|
| L1 | link up? errors? | `ip link`, `ethtool`, `show interface` |
| L2 | MAC learned? VLAN? | `ip neigh`, `bridge fdb`, `show mac address-table` |
| L3 | route exists? | `ip route`, `show ip route`, `traceroute` |
| L4 | port open? | `ss -tulpn`, `nc -vz`, ACL counters |
| L7 | app responds? | `curl -v`, `dig`, logs |

### 3. Form a hypothesis

A hypothesis is testable: "The DHCP relay is missing on VLAN 30, so hosts on VLAN 30 get
link-local addresses."

Not testable: "It's probably the firewall."

### 4. Test it

One change at a time. If you change two things, you learn nothing.

### 5. Fix, verify, document

Verification means **the user confirms it works**, not "it pings now". Documentation means
the next person (probably you at 3 a.m.) can find it.

## The tools you actually use

| Tool | Use | Trap |
|---|---|---|
| `ping` | reachability, RTT | ICMP often blocked; success ≠ app works |
| `traceroute` | path | shows forward path only, per-hop filtering hides hops |
| `mtr` | path + loss over time | shows loss accumulating only where real |
| `dig` | DNS | caching hides problems |
| `tcpdump` / Wireshark | truth | capture point matters — both directions? |
| `ss -tulpn` | listening ports | shows local sockets only |
| `nc -vz host port` | port test | can be blocked by ACLs |
| `curl -v` | full HTTP/TLS flow | do not forget DNS resolution step |
| `show interface` / `ethtool` | errors | counters reset on reload |
| `show log` | history | time zones differ between devices |

## Reading `show interface` output

```
GigabitEthernet0/1 is up, line protocol is up
  Hardware is ..., address is 0011.2233.4455
  MTU 1500 bytes, BW 1000000 Kbit/sec
  5 minute input rate 12000 bits/sec, 3 packets/sec
  0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
  0 output errors, 0 collisions, 0 interface resets
```

| Field | Meaning when non-zero |
|---|---|
| CRC / FCS | bad cable, bad optic, duplex issue |
| input errors | physical layer problem |
| late collisions | duplex mismatch |
| overrun | device cannot keep up |
| interface resets | flapping, power, or line issue |
| output drops | congestion, queue full |
| runts / giants | MTU or bad NIC |

`up/up` means Layer 1 and Layer 2 are fine. It does **not** mean routing or firewalls are fine.

## Capture workflow

1. Decide the capture point. The right question: "where can I see both directions?"
2. Use a filter, not a 2 GB file. `host 10.1.1.5 and port 443`
3. Reproduce the problem once.
4. Stop and check counts: SYN sent? SYN-ACK returned? Retransmissions?
5. Open in Wireshark, apply a display filter.

Useful Wireshark filters:

```
tcp.flags.syn == 1 && tcp.flags.ack == 0     # connection attempts
tcp.analysis.retransmission                  # retransmits
icmp.type == 3                               # unreachable
dns.flags.response == 0                      # DNS queries
tls.handshake.type == 1                      # client hello
arp                                          # ARP
```

Expert Information (`Analyze → Expert Information`) surfaces retransmissions, resets, and
malformed packets without reading every packet.

## Ten classic tickets

| # | Symptom | Most likely cause |
|---|---|---|
| 1 | Works by IP, fails by name | DNS |
| 2 | One VLAN cannot reach anything | missing SVI/gateway or trunk allowed list |
| 3 | Link up, terrible throughput | duplex mismatch |
| 4 | Intermittent drops every ~30 s | STP topology change or loop |
| 5 | New switch plugged in, whole floor dies | unmanaged loop, no BPDU guard |
| 6 | VPN up, small packets fine, large transfers hang | MTU/MSS |
| 7 | Some users get `169.254.x.x` | DHCP pool exhausted or relay missing |
| 8 | SG works, SSH to device times out | management ACL or out-of-band path |
| 9 | HTTPS fails with certificate error | clock skew or expired cert |
| 10 | BGP session up, no traffic | filter, next-hop unreachable, or a better path |

## Escalation etiquette

When you hand off, give:

- The exact symptom and impact
- What you checked and what you ruled out
- Timestamps (with time zone)
- Captures and command output
- What you changed, if anything

"The network is broken, please check" wastes everyone's time.

## Chapter check

1. What is the first question you ask about any outage?
2. `up/up` on an interface — does that prove routing works?
3. Why is `ping` alone a weak test?
4. What does a capture showing SYN with no SYN-ACK mean?
5. Where should you capture to prove a firewall is dropping traffic?

<details>
<summary>Answers</summary>

1. "What changed?" — followed by scope (who/what is affected).
2. No. It only proves Layers 1 and 2 are healthy.
3. ICMP is often filtered or rate-limited; success does not prove the application path works.
4. The packet reached the capture point but no reply came back (or the reply took another path/filter).
5. On both sides of the firewall, so you can see what entered and what came out.

</details>
