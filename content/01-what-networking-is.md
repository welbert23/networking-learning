# 01 · What Networking Really Is

Strip away the marketing and a network is three things: **hosts**, **links**, and **rules**.

## The smallest possible network

Two computers and one cable.

```
[ PC-A ]====================[ PC-B ]
  192.168.1.10              192.168.1.20
```

For A to send a file to B, four things must be true:

1. **A must know B's address** (IP address).
2. **A must know how to reach it** (same subnet -> send directly; different -> send to a router).
3. **A must know B's hardware address** (MAC address, found with ARP).
4. **Both must agree on the rules** (Ethernet framing, IP, TCP or UDP, ports).

Everything else in networking is a variation of these four problems at a larger scale.

## Why layers exist

Imagine writing one program that handles: the electrical signal, the cable type, the
addressing scheme, retransmission, encryption, and the file format. Now imagine changing
Wi-Fi and having to rewrite the file format code.

Layers let each part change independently. Wi-Fi replaces Ethernet without changing TCP.
IPv6 replaces IPv4 without changing HTTP. This is the single most important idea in networking.

## The cast of characters

| Term | Meaning | Example |
|---|---|---|
| **Host / endpoint** | A device with an IP that sends or receives | laptop, server, phone, router interface |
| **Link** | The physical or logical connection between two devices | copper cable, fiber, Wi-Fi, a tunnel |
| **Node** | Any device on the network | switch, router, firewall, host |
| **Packet** | A unit of data with headers | an IP packet |
| **Frame** | A packet wrapped in a Layer-2 header | an Ethernet frame |
| **Segment** | A TCP/UDP unit | TCP segment |
| **Protocol** | An agreed set of rules | TCP, OSPF, DNS |

## LAN, WAN, and the Internet

- **LAN (Local Area Network)** — one administrative domain, usually one building or floor.
  High speed, low latency, you control it.
- **WAN (Wide Area Network)** — connects sites over a provider's infrastructure.
  Lower speed relative to cost, higher latency, you do not control the middle.
- **The Internet** — the WAN of WANs. A network of networks that agree to exchange routes
  using BGP.

A network engineer usually owns the LAN edge, the WAN edge, and the policy between them.

## Circuit switching vs packet switching

Old telephone networks reserved a path for the whole call. If you were not talking, the
capacity was still reserved and wasted.

The Internet does not reserve anything. It chops data into packets and lets each packet
find its own way. This is why:

- links can be shared by thousands of users
- a failed link can be routed around
- but quality is not guaranteed — hence QoS, buffers, and congestion

## Bandwidth, latency, throughput, jitter

These four get confused constantly. Learn the difference now.

| Term | Meaning | Analogy |
|---|---|---|
| **Bandwidth** | Maximum capacity of a link | Width of a highway |
| **Latency** | Time for one bit to travel | How long one car takes |
| **Throughput** | Actual data delivered per second | Cars that arrive per hour |
| **Jitter** | Variation in latency | Uneven traffic flow |

A 1 Gbps link with 200 ms latency still feels slow for interactive work.
A 100 Mbps link with 2 ms latency feels instant. **Latency is usually the real problem.**

### The bandwidth-delay product

The amount of data "in flight" on a path:

```
BDP = bandwidth × round-trip time
```

On a 1 Gbps link with 100 ms RTT, 100 million bits (about 12.5 MB) can be in flight.
If the TCP window is smaller than that, you will never fill the link. This is why long,
fast paths need window scaling — and why "the link is 1 Gbps but the file transfer is slow"
is a real and common problem.

## What a network engineer actually does

| Activity | Share of the job |
|---|---|
| Designing and documenting | 20% |
| Configuring and changing | 25% |
| Troubleshooting | 35% |
| Automating and improving | 20% |

Troubleshooting is the biggest slice. That is why this book keeps returning to
"what does it look like when it breaks".

## Chapter check

1. Why can Wi-Fi replace Ethernet without changing your browser?
2. A user says "the internet is slow". Which of the four metrics do you measure first?
3. You have a 10 Gbps link and a 20 ms RTT. What is the BDP in megabytes?
4. What are the four things two hosts must agree on to communicate?

<details>
<summary>Answers</summary>

1. Because layers are independent — the physical/link layer changed, the transport and application layers did not.
2. Latency first, then throughput, then loss/jitter. Bandwidth is rarely the issue.
3. 10 Gbps × 0.02 s = 200 Mbit = 25 MB.
4. Addressing, reachability (routing), hardware address (ARP), and framing rules.

</details>
