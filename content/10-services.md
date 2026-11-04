# 10 · Network Services

Routing gets packets there. Services make the network usable. Most real tickets live here.

## DHCP — giving out addresses

**DORA**:

```
Client -> DHCP DISCOVER (broadcast)
Server -> DHCP OFFER
Client -> DHCP REQUEST (broadcast, "I accept this one")
Server -> DHCP ACK
```

Ports: server **67**, client **68**.

What DHCP can hand out: IP, mask, gateway, DNS servers, NTP, TFTP, domain name, lease time.

### Example pool (Cisco)

```
ip dhcp pool LAN-10
 network 10.0.0.16 255.255.255.240
 default-router 10.0.0.17
 dns-server 10.0.0.53
 lease 0 8
```

`network` takes the **network address and subnet mask**, not a usable host address.
`default-router` is the router interface clients use as their gateway.

### DHCP relay

Broadcasts do not cross routers. If the server is on another subnet, the router acts as
a relay agent (`ip helper-address 10.1.1.10` on Cisco). It rewrites the request with the
**giaddr** field so the server knows which pool to use.

| Symptom | Cause |
|---|---|
| Host gets `169.254.x.x` | no DHCP response at all |
| Wrong subnet leased | relay missing or pointing at the wrong interface |
| Some hosts work, some do not | pool exhausted, or VLAN mismatch |
| Lease renews but DNS missing | option 6 not configured |

```
Cisco:  show ip dhcp binding
        show ip dhcp pool
        show ip dhcp conflict
```

**DHCP snooping** — a switch feature that only trusts DHCP offers from uplink ports.
Without it, anyone can run a rogue DHCP server and become the gateway. Tie it to
**IP Source Guard** and **Dynamic ARP Inspection** for a real defence.

## DNS — names to addresses

Resolution flow for `www.example.com`:

```
1. Host checks its cache, then /etc/hosts
2. Asks its configured resolver (recursive query)
3. Resolver checks cache; if miss, walks the tree:
   root -> .com -> example.com -> www.example.com   (iterative)
4. Returns the A/AAAA record, cached for the TTL
```

| Record | Meaning |
|---|---|
| A | IPv4 address |
| AAAA | IPv6 address |
| CNAME | alias to another name |
| MX | mail server |
| NS | authoritative nameserver |
| TXT | SPF, DKIM, verification |
| PTR | reverse lookup |
| SRV | service location |

**TTL** is the cache lifetime. Lowering TTL before a migration is standard practice;
forgetting it is why "the change did not take effect" for hours.

Common tools:

```bash
dig example.com
dig +short example.com
dig @8.8.8.8 example.com
dig +trace example.com        # follow the delegation chain
nslookup example.com          # Windows
```

**Why DNS breaks networks:** if DNS fails, users say "the internet is down" even though
routing is perfect. Always test by IP before blaming the network.

## NAT — translating addresses

| Type | What it does |
|---|---|
| **Static NAT** | one private ↔ one public, permanent |
| **Dynamic NAT** | pool of public addresses |
| **PAT / NAT overload** | many private → one public, by source port |
| **NAT64** | IPv6 ↔ IPv4 |

```
ip nat inside source list 10 interface Gi0/0 overload
interface Gi0/1
 ip nat inside
interface Gi0/0
 ip nat outside
```

NAT breaks things that embed IP addresses in payloads: SIP, FTP active mode, some VPNs,
IPsec without NAT-T. If a protocol "works internally but not externally", suspect NAT.

NAT also destroys end-to-end addressability, which is why IPv6 exists.

## NTP — time

Time is not cosmetic. Certificates, logs, Kerberos, and correlation all depend on it.

- Port **123/UDP**
- **Stratum 0** = atomic clock, **1** = directly attached, **2+** = synced downstream
- A server at stratum 16 is unsynchronized

```
Cisco:  ntp server 10.1.1.10 prefer
        show ntp status
Linux:  chronyc tracking
        timedatectl
```

**A wrong clock causes TLS failures and login failures.** It is one of the most common
"impossible" bugs.

## Syslog — logs

Port **514/UDP** (or 6514/TLS).

| Severity | Name |
|---|---|
| 0 | Emergency |
| 1 | Alert |
| 2 | Critical |
| 3 | Error |
| 4 | Warning |
| 5 | Notification |
| 6 | Informational |
| 7 | Debugging |

```
logging host 10.1.1.20
logging trap informational
logging buffered 16384
```

Send logs to a central server. Logs on the device disappear when the device dies — which
is exactly when you need them.

## SNMP — monitoring

| Version | Security |
|---|---|
| v1 | community string, plaintext |
| v2c | community string, plaintext, bulk |
| v3 | users, authentication (SHA), encryption (AES) |

Ports **161/UDP** (poll) and **162/UDP** (trap). Use v3 and read-only in production.
Poll with a monitoring system (LibreNMS, Zabbix, Prometheus snmp_exporter) and alert on
interface errors, CPU, uptime, and BGP state.

## QoS — when bandwidth is not enough

Four steps, in order:

1. **Classify** — identify traffic (ACL, NBAR, DSCP)
2. **Mark** — set DSCP/CoS at the edge, trust it in the core
3. **Queue** — priority queue for voice, weighted queues for the rest
4. **Shape/police** — smooth or drop excess

| DSCP | Typical use |
|---|---|
| EF (46) | voice |
| AF41 (34) | video |
| AF31 (26) | call signalling |
| CS1 (8) | scavenger / bulk |
| 0 | best effort |

**Police** drops or marks above a rate. **Shape** buffers above a rate. Voice needs
low jitter and low loss; bulk data tolerates delay but needs bandwidth.

Rule: QoS cannot create bandwidth. It only decides who suffers first.

## Chapter check

1. A host gets 169.254.x.x. What are the first three things you check?

   - A. DNS resolution and the default gateway.
   - B. NAT translations and the public IP lease.
   - C. Link/VLAN, DHCP server reachability, and ip helper-address on the gateway interface.
   - D. STP state and the trunk native VLAN.

2. Why does DHCP need a relay?

   - A. DHCP uses broadcasts, which routers do not forward by default.
   - B. DHCPv6 requires a relay for every IPv4 client.
   - C. Relays encrypt DHCP leases.
   - D. Relays assign a default gateway to the client.

3. What does a low DNS TTL let you do safely?

   - A. Hide the server's real IP address from clients.
   - B. Change DNS records with minimal caching delay during a migration.
   - C. Prevent DNS cache poisoning.
   - D. Reduce DNSSEC signature size.

4. Which NAT type lets 500 users share one public IP?

   - A. Static NAT
   - B. Dynamic NAT with a pool of one address
   - C. PAT (NAT overload), distinguished by source port
   - D. Twice NAT

5. Why does a wrong clock break HTTPS?

   - A. TLS uses the clock to generate the session key.
   - B. HTTPS requires the client and server to share a time zone.
   - C. A wrong clock changes the server's IP address.
   - D. TLS validates certificate validity dates; a skewed clock makes a valid certificate look expired or not-yet-valid.

<details>
<summary>Answers</summary>

1. **C** - Link/VLAN, DHCP server reachability, and ip helper-address on the gateway interface.
2. **A** - DHCP uses broadcasts, which routers do not forward by default.
3. **B** - Change DNS records with minimal caching delay during a migration.
4. **C** - PAT (NAT overload), distinguished by source port.
5. **D** - TLS validates certificate validity dates; a skewed clock makes a valid certificate look expired or not-yet-valid.

</details>
