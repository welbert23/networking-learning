# 11 · Network Security

You are not expected to be a penetration tester. You are expected to build a network that
does not fall over when someone plugs in a laptop.

## The threat model, briefly

| Threat | Example | Control |
|---|---|---|
| Reconnaissance | port scans, ping sweeps | filtering, no unnecessary exposure |
| Credential theft | weak SNMP/community strings, telnet | SSH, SNMPv3, AAA |
| Lateral movement | flat network, one VLAN for everything | segmentation, ACLs |
| Spoofing | ARP/DHCP/IP spoofing | DAI, DHCP snooping, uRPF |
| Denial of service | flood, SYN flood | rate limits, upstream scrubbing |
| Data in transit | unencrypted management | TLS, IPsec, SSH |
| Insider | misconfiguration, rogue device | port security, 802.1X, logging |

The biggest real-world risk is **a flat network**: everything in one VLAN, one subnet,
no policy. One compromised printer means everything is reachable.

## ACLs

An access list is an ordered list of permit/deny rules. **First match wins. There is an
implicit deny at the end.**

### Standard vs extended

| Type | Matches | Number range (Cisco) |
|---|---|---|
| Standard | source IP only | 1–99, 1300–1999 |
| Extended | source, destination, protocol, ports | 100–199, 2000–2699 |

```
access-list 100 permit tcp 192.168.10.0 0.0.0.255 any eq 443
access-list 100 permit tcp 192.168.10.0 0.0.0.255 any eq 80
access-list 100 deny ip any any log
```

Apply it:

```
interface Gi0/0
 ip access-group 100 in
```

**Direction matters.** `in` filters traffic entering the interface from the attached
network. `out` filters traffic leaving toward it. Getting the direction backwards is the
single most common ACL mistake.

### Wildcard masks

An ACL mask is the **inverse** of a subnet mask.

| Subnet mask | Wildcard |
|---|---|
| 255.255.255.0 | 0.0.0.255 |
| 255.255.255.128 | 0.0.0.127 |
| 255.255.255.252 | 0.0.0.3 |
| 255.255.0.0 | 0.0.255.255 |

```
permit 10.1.1.0 0.0.0.255   # whole /24
permit 10.1.1.5 0.0.0.0     # one host
permit any                  # everything
```

### Where to place ACLs

- **Extended ACLs close to the source** — stop traffic early, save bandwidth.
- **Standard ACLs close to the destination** — they only match source, so placing them
  early blocks the wrong things.

## Stateful vs stateless

| | Stateless (ACL) | Stateful (firewall) |
|---|---|---|
| Remembers connections | no | yes |
| Return traffic | must be allowed explicitly | automatically allowed |
| Asymmetric routing | tolerates it | breaks |

A firewall builds a session table from the 5-tuple. That is why it can allow replies
without an inbound rule — and why it drops traffic when the reply takes a different path.

## Zones and DMZ

```
Internet --- [ outside ] --- FIREWALL --- [ inside ] --- Users
                                  |
                              [ dmz ] --- Public servers
```

| Zone | Trust | Contains |
|---|---|---|
| Outside | untrusted | Internet |
| DMZ | semi-trusted | web, mail, reverse proxies |
| Inside | trusted | users, internal apps |

Rules of thumb:

- Inside → outside: allow, with web filtering
- Outside → DMZ: only the published ports
- DMZ → inside: **deny** (this is the one people forget)
- Management: separate VLAN, not reachable from users

## VPN

### IPsec (site-to-site)

Two phases:

| Phase | Purpose | Ports |
|---|---|---|
| **IKE phase 1** | authenticate peers, build a secure channel | UDP 500 (4500 with NAT-T) |
| **IKE phase 2** | negotiate the actual data tunnel (ESP) | ESP (protocol 50) |

Components to match on both sides:

- Encryption (AES-256)
- Integrity (SHA-256)
- DH group
- Authentication (PSK or certificates)
- Interesting traffic (the subnets in the crypto ACL)
- Lifetime

**A single mismatch means the tunnel never comes up.** When troubleshooting, compare the
full proposal on both sides, line by line.

```
Cisco:  show crypto isakmp sa
        show crypto ipsec sa
        show crypto session
```

### SSL/TLS VPN (remote access)

Client connects to a portal over 443, authenticates, and gets a tunnel or per-app proxy.
Works through almost any firewall because it looks like HTTPS.

### WireGuard

Modern, simple, fast. UDP only, no built-in user authentication — pair it with a proper
identity system. Great for site-to-site and admin access.

## 802.1X — port-based authentication

Before a device gets network access, it must authenticate.

```
Supplicant (PC) <--EAPOL--> Authenticator (switch) <--RADIUS--> Authentication server
```

- Port starts in an unauthorized state.
- EAP exchange happens.
- RADIUS returns Accept/Reject and often a **dynamic VLAN**.
- MAB (MAC Authentication Bypass) for devices that cannot do 802.1X (printers, cameras).

RADIUS ports: **1812** (auth), **1813** (accounting).

This is how you stop someone plugging an unknown laptop into a wall port.

## Layer-2 hardening checklist

- [ ] Disable unused ports and put them in a dead VLAN
- [ ] Port security with a MAC limit on access ports
- [ ] DHCP snooping on access VLANs, trust only uplinks
- [ ] Dynamic ARP Inspection on user VLANs
- [ ] BPDU Guard + Root Guard
- [ ] Disable DTP (`switchport nonegotiate`) and set access ports explicitly
- [ ] Native VLAN changed from 1, unused
- [ ] No VLAN 1 for user traffic
- [ ] SSH only, Telnet disabled, AAA with TACACS+/RADIUS
- [ ] Enable `exec-timeout`, `logging synchronous`, banners
- [ ] Control plane policing (CoPP) on routers
- [ ] uRPF where symmetric routing is guaranteed

## Management plane hygiene

| Do | Do not |
|---|---|
| SSH v2 with keys | Telnet, SNMPv1/v2c |
| AAA with per-user accounts | shared `admin/admin` |
| Out-of-band management network | management on the user VLAN |
| Logging to a central server | logs only in RAM |
| Config backups automated | "I have it in my laptop" |
| NTP everywhere | manual clocks |

## Chapter check

1. ACL has `permit 10.1.1.0 0.0.0.255` then `deny ip any any`. A packet from `10.1.1.5`
   to `8.8.8.8` — allowed or denied?
2. Why must you place an extended ACL near the source?
3. Why does asymmetric routing break a stateful firewall?
4. Which IKE phase builds the data tunnel?
5. What does 802.1X actually authenticate — the user, the device, or the port?

<details>
<summary>Answers</summary>

1. Allowed — first match wins and the source matches the permit.
2. To drop unwanted traffic before it consumes bandwidth across the network.
3. The firewall sees only one direction and has no session state for the reply.
4. Phase 2 (IPsec/ESP). Phase 1 protects the negotiation itself.
5. The device (supplicant) on that port; the policy is applied to the port.

</details>
