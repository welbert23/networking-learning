# D · Glossary

Every entry answers three questions: **what it is**, **what it does**, and **why you should
care**. If a term has a chapter, the chapter explains it in context.

ACL rules, for example, are not just "permit/deny lists" — they are read top to bottom and stop
at the first match, which is why a broad rule near the top makes every rule below it dead.

---

## A

**AAA** — Authentication, Authorization, Accounting. The three questions asked of anyone who
touches the network: who are you, what are you allowed to do, and what did you actually do.
RADIUS and TACACS+ are the protocols that carry those answers.

**ABR (Area Border Router)** — An OSPF router with interfaces in two or more areas. It keeps a
separate topology database for each area and advertises summaries between them, so routers
inside one area never need to know another area's internals.

**ACL (Access Control List)** — An ordered list of permit and deny rules attached to an
interface or a firewall. The device reads the rules from the top and **stops at the first
match**, so the order *is* the policy: a broad `permit` placed too early makes every rule
below it useless, and a missing final `deny` silently allows everything.

**Administrative distance** — The number a router uses to choose between routes to the same
destination learned from **different sources**. Lower wins: connected 0, static 1, eBGP 20,
OSPF 110, IS-IS 115, RIP 120, iBGP 200. It is the tiebreaker applied *before* metrics are
compared.

**Anycast** — One address assigned to several servers in different locations. Routing delivers
each client to the nearest one, which is how `8.8.8.8` and most CDNs work. If one node fails,
traffic simply shifts to the others.

**ARP (Address Resolution Protocol)** — The protocol that finds the MAC address that owns an
IPv4 address on the local link. A host broadcasts "who has 10.0.0.1?" and the owner replies
with its MAC, which is then cached for a few minutes. Without ARP, a host knows where it wants
to go but not which hardware to hand the frame to.

**AS (Autonomous System)** — A network under one administrative control, identified by an AS
number. Routing **between** ASes is BGP's job; routing **inside** one AS is an IGP's job.

**AS path** — The BGP attribute listing every AS a route has passed through. It is both a loop
check (seeing your own AS number means reject) and the usual tiebreaker: the shortest path
wins unless policy says otherwise.

**ASBR (AS Boundary Router)** — An OSPF router that connects the OSPF domain to another
routing domain and injects external routes into it. A router can be an ASBR and an ABR at the
same time; the roles answer different questions.

**Automation** — Doing configuration and verification with code instead of typing into
devices. The value is repeatability: the same input produces the same result, and one mistake
is fixed once instead of on two hundred devices.

## B

**Bandwidth** — The maximum rate a link can carry, measured in bits per second. It is a
capacity, not a promise: what you actually get is throughput, which is always lower.

**BFD (Bidirectional Forwarding Detection)** — A lightweight protocol that sends tiny probes
every few hundred milliseconds to detect a dead neighbour. Routing protocols use it so they
can fail over in under a second instead of waiting for their own slow timers.

**BGP (Border Gateway Protocol)** — The routing protocol of the Internet. It exchanges
reachability between autonomous systems and chooses paths by **policy** (which path you prefer)
rather than by pure shortest path.

**BPDU (Bridge Protocol Data Unit)** — The message switches exchange to run Spanning Tree. It
carries the bridge ID, root path cost, and port information that decide which ports stay
forwarding and which get blocked.

**BPDU guard** — A switch feature that shuts a port down if it receives a BPDU. Applied to
access ports, it stops a user from plugging in their own switch and quietly changing the
topology.

**Broadcast** — A frame or packet addressed to every device on the local segment (MAC
`ff:ff:ff:ff:ff:ff`, IPv4 `255.255.255.255`). Routers do not forward broadcasts, which is
exactly what makes a broadcast domain end at the router.

**Broadcast domain** — Every device that receives a broadcast sent by any one of them. A whole
switch is one broadcast domain unless VLANs split it.

## C

**CAM table (Content Addressable Memory)** — A switch's map of MAC address to port. The switch
learns an entry from every frame's source address and uses the table to send frames out only
the correct port instead of flooding.

**CIDR (Classless Inter-Domain Routing)** — Writing a network as an address plus a prefix
length, like `10.0.0.0/8`. It replaced address classes, so the **prefix** defines the size —
not the first octet.

**Collision domain** — The set of devices sharing one physical medium where frames can collide.
A hub creates one large collision domain; a switch gives every port its own.

**Community (BGP)** — A tag attached to a BGP route, such as `65000:100`. It has no built-in
meaning — you define what it means and match it in route maps to apply policy at scale.

**Control plane** — The part of a device that decides where traffic should go: routing
protocols, ARP, STP, and the tables they build. It is the "thinking" half of the router.

**Convergence** — How long the network takes to agree on a new topology after a change and stop
sending traffic into a dead path. Fast convergence is a design goal, not a single feature.

**CoS (Class of Service)** — The 3-bit priority field inside an 802.1Q tag, used for QoS at
Layer 2. It travels with the frame across trunks, so switches can honour priority without
reading the IP header.

**CPE (Customer Premises Equipment)** — The device on the customer's side of a provider link,
usually the router the ISP installs or hands over. It is where the provider's responsibility
ends.

## D

**DAI (Dynamic ARP Inspection)** — A switch feature that checks ARP packets against the DHCP
snooping table and drops forged replies. It blocks ARP spoofing without installing anything on
the hosts.

**Data plane** — The part of a device that actually moves packets: ASICs, the FIB, and the
interfaces. Perfect routes in the control plane mean nothing if the data plane drops the
traffic.

**Default gateway** — The router a host sends traffic to when the destination is not on its own
subnet. If it is wrong or missing, local traffic still works and everything else fails — the
classic "the network is down but only for me" symptom.

**Default route** — The route `0.0.0.0/0` (or `::/0`), meaning "everything not matched more
specifically goes here". It is the last resort in the routing table.

**DHCP (Dynamic Host Configuration Protocol)** — The protocol that gives hosts an address,
mask, gateway, and DNS server automatically. It uses four messages: discover, offer, request,
acknowledge.

**DHCP snooping** — A switch feature that marks ports trusted or untrusted and accepts DHCP
offers only from trusted ports. It stops a rogue server from handing out a fake gateway.

**DIA (Direct Internet Access)** — Sending a branch's internet traffic straight out a local
link instead of back through the data centre. It cuts latency and WAN cost, but moves the
security controls to the branch.

**DMZ (Demilitarized Zone)** — A segment for services that must be reachable from the internet,
kept separate from the internal network. If the web server is compromised, the attacker is
still outside the inside.

**DNS (Domain Name System)** — The system that turns names into addresses. Almost every "the
internet is down" ticket is really DNS, because everything else depends on it.

**DR/BDR (Designated Router / Backup DR)** — The two routers elected on an OSPF broadcast
segment to be the only ones forming full adjacencies and generating LSAs for that segment. It
keeps the number of adjacencies from growing quadratically as routers are added.

**DSCP (Differentiated Services Code Point)** — The 6-bit field in the IP header that marks a
packet's QoS class. Edge devices set it, interior devices trust or rewrite it, and every hop
uses it to choose a queue.

**Dual stack** — Running IPv4 and IPv6 on the same interface at the same time. It is the normal
migration method because there is no flag day when the Internet switches over.

**Duplex** — Whether a link can send and receive at the same time (full) or only one direction
at a time (half). A duplex mismatch causes collisions, retransmissions, and terrible throughput
on a link that otherwise looks healthy.

## E

**eBGP** — BGP running between routers in **different** autonomous systems. It is how networks
exchange routes with each other, and it is the protocol that builds the Internet's routing
table.

**EIGRP (Enhanced Interior Gateway Routing Protocol)** — Cisco's advanced distance-vector IGP.
It converges quickly and summarizes easily, but it is effectively Cisco-only, which limits
mixed-vendor designs.

**Encapsulation** — Wrapping data in the header of the layer below: a segment gets an IP header,
the packet gets a frame header, and the frame becomes bits on the wire. Decapsulation is the
reverse process on receipt.

**EUI-64** — The 64-bit interface ID built from a 48-bit MAC by flipping the universal/local
bit and inserting `ff:fe` in the middle. SLAAC uses it to build an address with no DHCP server.

**EVPN (Ethernet VPN)** — A BGP-based control plane for Layer-2 and Layer-3 overlays, usually
paired with VXLAN. It replaces flood-and-learn with a real routing protocol, which is why large
data centres use it.

## F

**FHRP (First Hop Redundancy Protocol)** — A family (HSRP, VRRP, GLBP) that gives hosts one
virtual gateway address served by two or more routers. If the active router dies, the standby
takes over the address and the hosts never notice.

**FIB (Forwarding Information Base)** — The data-plane copy of the routing table, optimized for
fast lookups. The control plane computes it; the ASIC reads it for every packet.

**Floating static route** — A static route configured with a worse administrative distance than
the primary route, so it stays hidden until the primary disappears. It is a cheap backup path
with no protocol overhead.

**FRR (FRRouting)** — An open-source routing suite that runs OSPF, BGP, IS-IS, and more on
Linux. It is what the free labs in this book use instead of vendor images.

## G

**gNMI** — A gRPC-based protocol for reading and changing device state, including streaming
telemetry. It is the modern alternative to polling devices with SNMP or scraping the CLI.

**GRE (Generic Routing Encapsulation)** — A simple tunnelling protocol that wraps one protocol
inside another. It can carry multicast and routing protocols, which IPsec alone cannot, but it
adds no encryption by itself.

## H

**HSRP (Hot Standby Router Protocol)** — Cisco's first-hop redundancy protocol. Routers share a
virtual IP and MAC address; one is active, the other stands by and takes over if the active one
stops answering.

## I

**iBGP** — BGP running between routers in the **same** autonomous system. It carries external
routes inside the AS and needs either a full mesh of sessions or route reflectors.

**ICMP (Internet Control Message Protocol)** — IP's signalling protocol. It carries errors such
as "destination unreachable" and "time exceeded", plus the echo request/reply that `ping` uses.
It carries no user data.

**IGP (Interior Gateway Protocol)** — Any routing protocol that works inside one autonomous
system: OSPF, IS-IS, EIGRP, RIP. It finds the best path **within** your network, which is the
opposite job to BGP.

**IPAM (IP Address Management)** — Keeping track of which addresses and prefixes exist and who
owns them. Without it, duplicate addresses and exhausted pools are discovered by outage instead
of by a report.

**IPsec** — A suite that encrypts and authenticates IP traffic. It has two parts: IKE negotiates
keys and parameters, while ESP (or AH) protects the actual packets.

**IS-IS (Intermediate System to Intermediate System)** — A link-state IGP that runs directly on
Layer 2 rather than inside IP. It scales very well and is common in ISP and provider cores.

**ISP (Internet Service Provider)** — The company that sells connectivity to the rest of the
Internet.

## J

**Jitter** — Variation in delay between packets. Voice and video care about jitter more than
raw latency: a steady 150 ms sounds fine, but 20 ms ± 80 ms does not.

## L

**LACP (Link Aggregation Control Protocol)** — The IEEE standard (802.3ad) for bundling several
links into one logical link. It negotiates with the far end, so a half-configured bundle cannot
silently create a loop.

**Latency** — The time a packet takes to travel from source to destination, measured in
milliseconds. Distance, queueing, and serialization all add to it.

**Link-state** — A class of routing protocol where every router builds a complete map of the
topology and runs shortest path over it. OSPF and IS-IS are link-state; they converge quickly
and scale well.

**Local preference** — A BGP attribute used **inside** an AS to choose the outbound path.
Highest wins, and it is exchanged only between iBGP peers — it never crosses an AS boundary.

**Longest prefix match** — The rule that a router forwards by the **most specific** route, not
the first one configured. A `/24` always beats a `/16` for the same destination.

**LSA (Link State Advertisement)** — OSPF's unit of topology information. Routers flood LSAs
until every router in the area holds the same database, and then each runs shortest path on it.

## M

**MAC address** — The 48-bit hardware address of an interface, used only within one link. It is
not routable, and it changes at every hop as frames are rebuilt.

**MED (Multi-Exit Discriminator)** — A BGP attribute that hints which entry point into an AS is
preferred. Lower is better, and it is normally compared only between the same two neighbours.

**Metric** — The number a routing protocol assigns to a path to rank it. Lower is better, but
the meaning differs by protocol: OSPF cost, RIP hop count, EIGRP composite.

**MPLS (Multiprotocol Label Switching)** — Provider forwarding that attaches a short label to
each packet and switches on the label instead of doing an IP lookup at every hop. It is the
basis of many carrier VPNs and traffic-engineering designs.

**MSS (Maximum Segment Size)** — The largest TCP payload a host will accept, usually MTU minus
40 bytes of IP and TCP headers. If a tunnel lowers the MTU, MSS clamping keeps TCP from
overrunning it.

**MTU (Maximum Transmission Unit)** — The largest payload an interface will send; 1500 bytes on
standard Ethernet. A path with a smaller MTU silently drops large packets unless PMTUD or MSS
clamping deals with it.

**Multicast** — One sender, many receivers, using a group address. Hosts join a group and the
network delivers only to links that have members. IPv4 uses `224.0.0.0/4`; IPv6 uses `ff00::/8`.

## N

**NAT (Network Address Translation)** — Rewriting addresses at a boundary, usually private to
public. PAT, also called NAT overload, rewrites the source port too so many hosts can share one
public address.

**NDP (Neighbor Discovery Protocol)** — IPv6's combined replacement for ARP, router discovery,
and redirects. It runs over ICMPv6 and also performs duplicate address detection.

**NETCONF** — A protocol for configuring devices with structured data over SSH. It is
transactional: you send a change, the device validates and applies it — or rejects the whole
thing.

**Next hop** — The next device a packet is handed to on the way to its destination. The
destination may be far away; the next hop is always exactly one hop away.

**NOC (Network Operations Center)** — The team and the room where monitoring, alerting, and
incident response happen. Their runbooks matter as much as their dashboards.

**NTP (Network Time Protocol)** — The protocol that keeps clocks synchronized. Log correlation,
certificates, and any real troubleshooting all depend on correct time.

## O

**OSPF (Open Shortest Path First)** — A link-state IGP that floods LSAs, builds a topology map
per area, and runs Dijkstra to find shortest paths. It is the most common interior protocol in
enterprise networks.

**Overlay** — A virtual network built on top of a physical underlay, usually with tunnels.
VXLAN, IPsec, and SD-WAN are overlays: they hide the underlay's details from the tenants.

## P

**Packet** — The Layer-3 unit of data: an IP header plus payload. Frame is Layer 2, segment is
Layer 4, packet is Layer 3.

**PAT (Port Address Translation)** — NAT that also rewrites the port, letting many internal
hosts share one public address. It is what a home router does.

**PBR (Policy-Based Routing)** — Forwarding decisions based on something other than the
destination, such as source address, protocol, or DSCP marking.

**PDU (Protocol Data Unit)** — The data unit at a given layer: frame at Layer 2, packet at
Layer 3, segment at Layer 4.

**Peering** — Two networks exchanging traffic directly, usually without payment. It is a
business relationship expressed as BGP configuration.

**Ping** — The tool that sends ICMP echo requests and measures the replies. Success proves the
path **and** the return path work; failure does not tell you where it broke.

**PoE (Power over Ethernet)** — Sending power over the LAN cable with the data, so access
points and cameras need no separate supply. Standards run from 802.3af (15.4 W) to 802.3bt
(90 W).

**Prefix** — The network portion of an address, written with its length: `10.1.0.0/16`. The
prefix length is the number of leading bits that identify the network.

**Prefix list** — A filter that matches routes by prefix and length. For that specific job it is
faster and harder to misconfigure than an access list inside a route map.

## Q

**QoS (Quality of Service)** — Classifying, marking, and scheduling traffic so important packets
are served first when a link is congested. It cannot create bandwidth; it decides who suffers
when there is not enough.

**Queue** — A buffer where packets wait for an interface. Queueing is the mechanism behind QoS:
which queue is served next is what "priority" actually means.

## R

**RADIUS** — The protocol that centralizes authentication for 802.1X, VPN, and admin logins.
The switch or router asks the RADIUS server whether the credentials are good.

**Redistribution** — Taking routes learned by one routing protocol and injecting them into
another. It is where most routing loops and suboptimal paths are born, so it needs filtering and
careful metrics.

**Route map** — A named list of match/set clauses applied to routes or packets. `match` selects
which items are affected; `set` changes them.

**Route reflector** — An iBGP router that relays routes to its clients, replacing the full mesh
that iBGP otherwise requires. It is the standard way to scale BGP inside an AS.

**Route table** — The list of destinations a device knows and where it will send traffic for
each one.

**Router** — A device that forwards packets between networks using Layer-3 addresses. It breaks
up broadcast domains and marks where one subnet ends and the next begins.

**Routing policy** — The rules that decide which routes are accepted, preferred, and advertised.
In BGP, policy usually matters more than the protocol's own path calculation.

**RPKI (Resource Public Key Infrastructure)** — A system that cryptographically certifies which
AS is allowed to originate which prefixes. It prevents a whole class of BGP hijacks.

**RSTP (Rapid Spanning Tree Protocol)** — The 802.1w version of STP, converging in under a
second instead of tens of seconds. It is the default on modern switches.

## S

**SD-WAN (Software-Defined WAN)** — A policy-driven overlay that spreads traffic across several
WAN links according to application needs. It replaces static routing over expensive circuits
with measured, per-application path selection.

**Segment** — The Layer-4 unit: a TCP or UDP header plus payload. The word is also used loosely
to mean a piece of a network, so context matters.

**Shaping** — Delaying packets to keep the rate at or below a limit. Unlike policing, it does
not drop traffic; it smooths bursts by buffering them.

**SLAAC (Stateless Address Autoconfiguration)** — IPv6 hosts build their own address from the
prefix a router advertises plus an interface ID. No DHCP server is involved.

**SNMP (Simple Network Management Protocol)** — The classic protocol for polling counters and
receiving traps from devices. Streaming telemetry is replacing it, but it is still everywhere.

**Spanning tree** — The protocol that keeps a switched network loop-free by electing a root
bridge and blocking redundant ports. Without it, one loop saturates a network in seconds.

**Static route** — A route configured by hand. It does not adapt to failures unless it is paired
with something like BFD or a floating backup.

**STP (Spanning Tree Protocol)** — The IEEE 802.1D protocol that prevents Layer-2 loops. It
blocks ports so that exactly one active path exists between any two points.

**Subnet** — A slice of a larger network, defined by a prefix. Subnetting is the act of choosing
where to split the host bits.

**Subnet mask** — The 32-bit value with 1s in the network bits and 0s in the host bits. The
device ANDs it with an address to find the network.

**Summarization** — Advertising one short prefix instead of many longer ones. It shrinks routing
tables, but it hides detail, so a flapping component can still affect the whole summary.

**SVI (Switch Virtual Interface)** — A Layer-3 interface that represents a VLAN on a switch,
used for management or for routing between VLANs.

**Switch** — A device that forwards frames within a network using MAC addresses. It learns which
MAC is on which port and floods only what it has to.

**Syslog** — The standard for shipping log messages to a central server. It is the first place
to look when something changed at 2 a.m.

## T

**TACACS+** — A Cisco-originated AAA protocol that separates authentication, authorization, and
accounting and encrypts the whole payload. It is common for device administration rather than
user access.

**TCP (Transmission Control Protocol)** — A connection-oriented transport that guarantees
ordered delivery, retransmits lost data, and adjusts its rate to the network. Web, SSH, and most
control traffic use it.

**Throughput** — The rate actually achieved, as opposed to the link's capacity. Overhead, loss,
and latency keep it below the advertised bandwidth.

**TLS (Transport Layer Security)** — The protocol that encrypts and authenticates application
traffic; HTTPS is HTTP inside TLS. It replaced SSL.

**Traceroute** — A tool that reveals the path by sending packets with increasing TTL values and
collecting the "time exceeded" replies. Missing hops usually mean filtering, not a broken path.

**Transit** — Carrying traffic between two other networks for a fee. It is the opposite of
peering.

**Trunk** — A link that carries several VLANs at once, tagging each frame with its VLAN ID
(802.1Q). Access ports carry one untagged VLAN; a trunk is what connects two switches, or a
switch to a router that needs to route between VLANs.

**TTL (Time to Live)** — A counter in the IP header that decreases at every router. At zero the
packet is dropped — which stops loops and is what makes traceroute possible.

**Tunnel** — An encapsulation that makes a packet look like it belongs to another network. VPNs
and overlays are built from tunnels.

## U

**UDP (User Datagram Protocol)** — A connectionless transport with no retransmission and no
ordering. DNS, DHCP, and voice use it because a late packet is worse than a lost one.

**ULA (Unique Local Address)** — IPv6 private space, `fc00::/7`. It is not routable on the
internet and plays the role RFC 1918 plays for IPv4.

**Unicast** — One sender, one receiver, addressed to a single host. It is the normal case for
almost all traffic, and it is what a switch forwards using its CAM table instead of flooding.

**Underlay** — The physical network that carries an overlay's tunnels. If the underlay is
unstable, the overlay inherits every problem.

**uRPF (Unicast Reverse Path Forwarding)** — An anti-spoofing check: accept a packet only if the
source address is reachable through the interface it arrived on.

## V

**VLAN (Virtual LAN)** — A logical broadcast domain inside a switch. Ports in different VLANs
cannot talk at Layer 2 even when they are on the same physical switch.

**VLSM (Variable Length Subnet Mask)** — Using different prefix lengths inside one address block
so every subnet is sized to its actual need instead of all being equal.

**VRF (Virtual Routing and Forwarding)** — Several independent routing tables on one device. It
lets overlapping addresses coexist, which is the basis of MPLS VPNs and multi-tenant designs.

**VRRP (Virtual Router Redundancy Protocol)** — The open-standard first-hop redundancy protocol.
It does the job of HSRP without being vendor-specific.

**VXLAN (Virtual Extensible LAN)** — A tunnel that carries Layer-2 frames over a Layer-3
network, identified by a 24-bit VNI. It allows far more segments than 802.1Q's 4094 VLANs.

## W

**WAN (Wide Area Network)** — The links that connect sites across a provider's infrastructure,
as opposed to the LAN inside one site.

**Wildcard mask** — The inverse of a subnet mask, used in ACLs and OSPF network statements. A 0
bit means "must match"; a 1 bit means "don't care".

**Wireshark** — The packet analyzer. It is the only tool that shows what actually crossed the
wire, which is why it settles most arguments.

## Y

**YANG** — The data modelling language that describes a device's configuration and state as a
structured tree. NETCONF and gNMI both carry YANG-modelled data.

## Z

**Zero trust** — A security model that authenticates and authorizes every request instead of
trusting anything because it is "inside". The network becomes transport, not a trust boundary.
