# A · Ports and Protocols Reference

## The ports you will actually see

| Port | Protocol | Transport | What it is |
|---|---|---|---|
| 20/21 | FTP | TCP | file transfer (data/control) |
| 22 | SSH | TCP | secure shell, SCP, SFTP |
| 23 | Telnet | TCP | unencrypted remote access — disable |
| 25 | SMTP | TCP | mail transfer |
| 53 | DNS | UDP/TCP | name resolution (TCP for large/zone transfers) |
| 67/68 | DHCP | UDP | server / client |
| 69 | TFTP | UDP | file transfer, device images |
| 80 | HTTP | TCP | web |
| 110 | POP3 | TCP | mail retrieval |
| 123 | NTP | UDP | time sync |
| 137–139 | NetBIOS | TCP/UDP | legacy Windows |
| 143 | IMAP | TCP | mail retrieval |
| 161/162 | SNMP | UDP | poll / trap |
| 179 | BGP | TCP | routing |
| 389/636 | LDAP/LDAPS | TCP | directory |
| 443 | HTTPS | TCP | web (TLS) |
| 445 | SMB | TCP | Windows file sharing |
| 500/4500 | IKE/IPsec NAT-T | UDP | VPN |
| 514 | Syslog | UDP | logging |
| 587 | SMTP submission | TCP | mail sending |
| 636 | LDAPS | TCP | encrypted LDAP |
| 830 | NETCONF | TCP | device config |
| 1194 | OpenVPN | UDP | VPN |
| 1812/1813 | RADIUS | UDP | auth / accounting |
| 3306 | MySQL | TCP | database |
| 3389 | RDP | TCP | Windows remote desktop |
| 4789 | VXLAN | UDP | overlay encapsulation |
| 5432 | PostgreSQL | TCP | database |
| 5060/5061 | SIP | UDP/TCP | VoIP signalling |
| 51820 | WireGuard | UDP | VPN |
| 6343 | sFlow | UDP | traffic sampling |
| 6514 | Syslog TLS | TCP | secure logging |

## IP protocol numbers

| Number | Protocol |
|---|---|
| 1 | ICMP |
| 2 | IGMP |
| 6 | TCP |
| 17 | UDP |
| 41 | IPv6 encapsulation |
| 47 | GRE |
| 50 | ESP (IPsec) |
| 51 | AH (IPsec) |
| 58 | ICMPv6 |
| 89 | OSPF |
| 103 | PIM |
| 112 | VRRP |
| 115 | L2TP |

## Multicast addresses

| Address | Used by |
|---|---|
| 224.0.0.1 | all hosts on the subnet |
| 224.0.0.2 | all routers on the subnet |
| 224.0.0.5 | OSPF all routers |
| 224.0.0.6 | OSPF DR/BDR |
| 224.0.0.9 | RIPv2 |
| 224.0.0.10 | EIGRP |
| 224.0.0.13 | PIM |
| 224.0.0.18 | VRRP |
| 224.0.0.22 | IGMPv3 |
| 239.255.255.250 | SSDP |
| ff02::1 | IPv6 all nodes |
| ff02::2 | IPv6 all routers |
| ff02::5 | OSPFv3 |
| ff02::1:ff00:0/104 | IPv6 solicited-node |

## EtherTypes

| Value | Payload |
|---|---|
| 0x0800 | IPv4 |
| 0x0806 | ARP |
| 0x8100 | 802.1Q VLAN tag |
| 0x86DD | IPv6 |
| 0x8847 | MPLS unicast |
| 0x88CC | LLDP |
| 0x88A4 | EtherCAT |
| 0x9000 | loopback |

## Well-known MAC addresses

| MAC | Meaning |
|---|---|
| FF:FF:FF:FF:FF:FF | broadcast |
| 01:00:0C:CC:CC:CC | CDP, VTP, DTP, PAgP |
| 01:00:0C:CC:CC:CD | Cisco STP |
| 01:80:C2:00:00:00 | STP BPDU |
| 01:80:C2:00:00:0E | LLDP |
| 00:00:0C:07:AC:xx | HSRP virtual MAC |
| 00:00:5E:00:01:xx | VRRP virtual MAC |

## Notable standards

| Standard | Subject |
|---|---|
| 802.1D | STP |
| 802.1Q | VLAN tagging |
| 802.1w | RSTP |
| 802.1s | MSTP |
| 802.1X | port-based authentication |
| 802.3 | Ethernet |
| 802.3ad | link aggregation (LACP) |
| 802.11 | Wi-Fi |
| 802.1AX | link aggregation (current) |
