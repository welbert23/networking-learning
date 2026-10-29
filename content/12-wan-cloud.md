# 12 · WAN, SD-WAN, and Cloud

The WAN is the part you do not own. That changes everything: cost, latency, and who you
call when it breaks.

## The old WAN

| Technology | What it was |
|---|---|
| Leased line | dedicated circuit, expensive, fixed bandwidth |
| Frame Relay | shared, committed rate, obsolete |
| ATM | cell-based, obsolete |
| MPLS L3VPN | provider-managed, any-to-any, QoS, still common |

### MPLS in one page

The provider builds a private network. Your sites connect to **PE routers**. The provider
adds a **label** to each packet so core routers forward by label, not by IP lookup.

- **CE** = customer edge, **PE** = provider edge, **P** = provider core
- Labels stack; the outer label is the transport, the inner identifies the VPN
- Traffic engineering and QoS come for free from the provider's SLAs
- Expensive, slow to change (weeks to add a site)

You configure a plain IP link to the provider and run BGP or static routes with them.
The MPLS magic is invisible to you.

## The modern WAN: SD-WAN

Instead of one expensive private circuit, use several cheap ones (broadband, LTE, fiber)
and let software choose the best path per application.

| Feature | What it does |
|---|---|
| Overlay | builds tunnels (IPsec, WireGuard, proprietary) over any underlay |
| Application-aware routing | voice goes over the low-latency link, backups over the cheap one |
| Central policy | configure once, push to all sites |
| Zero-touch provisioning | ship a box, it phones home and configures itself |
| Local internet breakout | SaaS traffic goes straight out, not back to HQ |

**SASE** extends this to security: cloud-delivered firewall, CASB, ZTNA, and SWG at the
edge instead of a box in a data center.

Trade-off: SD-WAN is only as good as the underlay. If the broadband is congested, no
policy can fix it.

## DIA vs backhaul

```
Backhaul:  Branch -> HQ (inspect) -> Internet      slow, expensive, but centralized policy
DIA:       Branch -> Internet (local breakout)     fast, cheap, distributed policy
```

Most organisations now use **hybrid**: DIA for SaaS, backhaul/private for sensitive apps.

## Cloud networking

Every cloud has the same basic primitives with different names.

| Concept | AWS | Azure | GCP |
|---|---|---|---|
| Virtual network | VPC | VNet | VPC |
| Subnet | Subnet (per AZ) | Subnet | Subnet (regional) |
| Route table | Route table | Route table / UDR | Route |
| Internet gateway | IGW | (implicit) | (implicit) |
| NAT gateway | NAT GW | NAT GW | Cloud NAT |
| Peering | VPC peering | VNet peering | VPC peering |
| Hub / transit | Transit Gateway | Virtual WAN / Hub | Network Connectivity Center |
| Private link to on-prem | Direct Connect | ExpressRoute | Dedicated Interconnect |
| Stateful firewall | Security Group | NSG | Firewall rules |
| Stateless ACL | NACL | (none directly) | (none directly) |

### The mental model that transfers

1. **A VPC/VNet is a routing domain.** Subnets are just address ranges inside it.
2. **Security groups are stateful and attached to resources.** NACLs are stateless and
   attached to subnets.
3. **Cloud networks are default-deny for inbound, default-allow for outbound** in most
   providers. That is the opposite of a naive on-prem firewall.
4. **Everything is software-defined.** There is no spanning tree, no VLANs, no ARP storms.
5. **Routing is explicit.** If a route table does not know a destination, the packet is dropped.

### Hybrid connectivity

```
On-prem ---- (Direct Connect / ExpressRoute) ---- Cloud VPC
On-prem ---- (IPsec VPN over Internet) ---------- Cloud VPC
```

Design rules:

- Use BGP for dynamic routing between on-prem and cloud.
- Never overlap address space. Cloud VPCs make overlap painful and expensive to fix.
- Two paths minimum, different providers if possible.
- Put a firewall or inspection VPC between the edge and workloads.

## Latency reality check

| Path | Typical RTT |
|---|---|
| Same rack | < 0.1 ms |
| Same data center | 0.2–1 ms |
| Same city | 1–5 ms |
| Cross-country | 30–70 ms |
| Cross-continent | 150–250 ms |
| Satellite (GEO) | 500–700 ms |

Speed of light in fiber is about 200 km/ms, and real paths are not straight lines. If
someone promises 5 ms from Manila to Virginia, they are wrong.

## Chapter check

1. What does the provider actually do in an MPLS L3VPN?
2. Why does SD-WAN use multiple underlays?
3. What is the difference between a security group and a NACL?
4. Why is overlapping address space a disaster in hybrid cloud?
5. What is local internet breakout?

<details>
<summary>Answers</summary>

1. It forwards labelled packets across its core and isolates customer VPNs; you see a normal IP/BGP handoff at the CE.
2. So policy can steer each application over the best available path and survive one link failing.
3. Security groups are stateful and applied per resource; NACLs are stateless and applied per subnet.
4. You cannot route between overlapping ranges without NAT, which breaks DNS and complicates everything.
5. Sending SaaS/Internet traffic directly from the branch instead of backhauling it to a central site.

</details>
