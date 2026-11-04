# 12B · Network Architectures and Virtualization

## Three-tier and spine-leaf

The classic campus design has three layers:

- **Access** - ports for users and devices, PoE, VLAN assignment, port security.
- **Distribution** - aggregation, inter-VLAN routing, policy, ACLs, and links to the core.
- **Core** - fast, simple transport between distribution blocks and the data centre or WAN.

Small sites collapse distribution and core into one pair of switches. That is a **collapsed core**, and it is normal.

Data centres and large campuses increasingly use **spine-leaf**. Every leaf connects to every spine; leaves never connect to each other. Traffic between servers (east-west) takes one leaf-spine-leaf hop, and every path is the same length, so ECMP works cleanly. Oversubscription is the design number to watch: if 48 access ports at 10 Gbps share four 40 Gbps uplinks, the ratio is 480:160, or 3:1. Know the ratio before you promise performance.

Layer-2 adjacency across a Layer-3 fabric is delivered with an overlay such as VXLAN with EVPN. The underlay just routes; the overlay carries the VLANs.

## SOHO, enterprise, and cloud designs

| Design | What it looks like | Typical use |
|---|---|---|
| **SOHO** | One box does routing, switching, Wi-Fi, firewall, DHCP | Home, small shop |
| **Enterprise campus** | Access, distribution, core, WLC, firewalls, WAN edge | Office buildings |
| **Branch** | Small switch and router, often SD-WAN, local internet breakout | Retail, clinics |
| **Data centre** | Spine-leaf, load balancers, firewalls, storage network | Servers and applications |
| **Cloud** | VPC or VNet, subnets, route tables, gateways | IaaS, PaaS, SaaS workloads |
| **Colocation** | Your equipment in someone else's rack and power | Interconnect, DR |

Traditional WAN used MPLS for private, predictable paths. Modern WAN often uses ordinary internet links plus **SD-WAN**, which builds encrypted tunnels, steers traffic by application policy, and fails over between links. The design question is not "MPLS or internet" but "which applications need which guarantees, and what does the budget allow?"

Cloud networking is still networking: addresses, routes, gateways, and security rules. The names change and the console is a web page.

## Virtualization

A **hypervisor** runs virtual machines. Type 1 runs on bare metal (ESXi, Hyper-V, KVM); type 2 runs on top of a desktop OS (VirtualBox, VMware Workstation). Servers use type 1.

Each VM has virtual CPUs, memory, disks, and one or more virtual NICs. Those vNICs connect to a **virtual switch** inside the hypervisor. The physical NICs are uplinks. If the uplink is a trunk, every port group on the vSwitch needs the right VLAN ID, otherwise the VM lands on the wrong network or nowhere at all.

- A port group is a VLAN plus policy (security, teaming, shaping).
- MAC learning happens on the vSwitch, so the physical switch must accept multiple MACs on that port.
- Promiscuous mode is needed for packet capture and some security tools; it is also a risk.
- Live migration moves a running VM to another host. The network must follow it: same VLANs, same subnets, same policy on the destination.

Virtualisation is why "the server is fine" and "the network is fine" can both be true while the application is broken. The virtual switch sits between them and nobody owns it.

## Containers and cloud networking

A container shares the host kernel and packages only the application and its libraries. It starts in milliseconds and is much lighter than a VM. Kubernetes schedules containers across hosts and gives each pod an address; the cluster network is usually an overlay, so the underlay still has to route.

| Cloud construct | What it does | On-premises equivalent |
|---|---|---|
| **VPC / VNet** | Isolated virtual network | VRF or separate campus |
| **Subnet** | Address range in one availability zone | VLAN and subnet |
| **Route table** | Where traffic goes next | Routing table |
| **Internet gateway** | Path to the internet | WAN edge |
| **NAT gateway** | Outbound-only internet for private subnets | NAT overload |
| **Security group** | Stateful, instance-level allow rules | Host firewall |
| **Network ACL** | Stateless, subnet-level allow and deny rules | Router ACL |
| **Load balancer** | Distributes traffic across targets | ADC or F5 |

Security groups are stateful: return traffic is allowed automatically. Network ACLs are stateless: you must allow both directions. That single difference explains most cloud troubleshooting tickets.

The shared responsibility model matters. The provider secures the physical facility and the hypervisor; you secure identities, data, operating systems, and the rules you write.

## PoE, cabling, and optics

| Standard | PSE power | Typical load |
|---|---|---|
| **802.3af** (PoE) | 15.4 W | Phones, basic APs, cameras |
| **802.3at** (PoE+) | 30 W | Wi-Fi 6 APs, PTZ cameras |
| **802.3bt** (PoE++) | 60 W or 90 W | Large APs, displays, laptops |

Always check the switch's total PoE budget, not just per-port capability. Forty ports at 30 W is 1200 W, which many access switches cannot deliver. `show power inline` tells you what is allocated and what is left.

- **Cat5e** - 1 Gbps to 100 m; 2.5G/5G on short runs.
- **Cat6** - 1 Gbps to 100 m; 10 Gbps to about 55 m.
- **Cat6a** - 10 Gbps to 100 m; better shielding, thicker cable.
- **Multimode fibre** - OM3/OM4, short to medium distances, cheaper optics.
- **Single-mode fibre** - long distances, longer-wave optics, higher cost.
- **DAC** - direct-attach copper for short rack connections.

Transceivers must match on both ends: speed, wavelength, and fibre type. A 10G SR optic will not talk to a 10G LR optic over multimode. Bend radius, cable management, and labelling are not decoration; they are why the next person can fix it.

## Design checklist

1. What are the applications, users, and growth numbers?
2. What redundancy is required: power, uplinks, devices, sites?
3. What is the PoE budget and the cable pathway?
4. Where does routing happen, and where does policy happen?
5. How is the network managed, monitored, and backed up?
6. What addressing scheme and VLAN plan will still make sense in five years?
7. What is the failure domain, and what happens when one link or one switch dies?

The most common design mistake is buying hardware before writing the requirements. The second is forgetting management access, out-of-band access, and a rollback plan.

## Chapter check

1. Why does a spine-leaf design handle east-west traffic well?

   - A. Every leaf connects to every spine, so all paths are equal and ECMP works.
   - B. Leaves connect to each other in a ring.
   - C. It removes the need for routing.
   - D. It uses only Layer 2 switching.

2. What is the difference between a type 1 and a type 2 hypervisor?

   - A. Type 1 runs on bare metal; type 2 runs on a host OS.
   - B. Type 1 is free; type 2 is licensed.
   - C. Type 1 only runs containers.
   - D. Type 2 cannot use virtual switches.

3. A security group allows inbound HTTPS but blocks the return traffic. Why is that wrong?

   - A. Security groups are stateless.
   - B. Security groups are stateful, so return traffic is allowed automatically.
   - C. HTTPS uses UDP.
   - D. Security groups only apply to outbound traffic.

4. Which PoE standard provides about 30 W at the switch port?

   - A. 802.3af
   - B. 802.3at
   - C. 802.3bt Type 4
   - D. 802.3ad

5. A VM on a hypervisor cannot reach its VLAN after a change. What is the most likely cause?

   - A. The VM disk is full.
   - B. The port group VLAN ID or the physical uplink trunk is wrong.
   - C. The VM has too much memory.
   - D. The vSwitch needs a reboot.

<details>
<summary>Answers</summary>

1. **A** - A full leaf-spine mesh gives equal-cost paths, so server-to-server traffic crosses one spine and can be load-balanced.
2. **A** - Type 1 hypervisors run directly on hardware; type 2 hypervisors run as applications on a desktop OS.
3. **B** - Cloud security groups are stateful. NACLs are the stateless construct where you must allow both directions.
4. **B** - 802.3at (PoE+) provides about 30 W at the PSE, enough for Wi-Fi 6 access points and PTZ cameras.
5. **B** - Virtual switches rely on correct port group VLAN tagging and a correctly trunked physical uplink.

</details>
