# B · Command Cheat Sheet

Three worlds: Cisco IOS, FRR (vtysh), and Linux. Learn one, map the others.

## Device status and interfaces

| Task | Cisco IOS | FRR (vtysh) | Linux |
|---|---|---|---|
| Interface summary | `show ip interface brief` | `show interface brief` | `ip -br addr` |
| Interface detail | `show interfaces Gi0/1` | `show interface eth1` | `ip -s link show eth1` |
| Counters/errors | `show interfaces counters errors` | `show interface eth1` | `ethtool -S eth1` |
| Speed/duplex | `show interfaces Gi0/1` | `show interface eth1` | `ethtool eth1` |
| Link state | `show interfaces status` | `show interface brief` | `ip link` |

## Switching

| Task | Cisco IOS | Linux |
|---|---|---|
| VLAN list | `show vlan brief` | `bridge vlan show` |
| Trunk status | `show interfaces trunk` | `bridge vlan show dev eth1` |
| MAC table | `show mac address-table` | `bridge fdb show` |
| STP | `show spanning-tree` | `bridge -d link show` |
| STP root | `show spanning-tree root` | — |
| Port config | `show run interface Gi0/5` | `bridge link show dev eth1` |
| Add VLAN to bridge | `switchport access vlan 10` | `bridge vlan add dev eth1 vid 10 pvid untagged` |
| Make a trunk | `switchport mode trunk` | `bridge vlan add dev eth1 vid 10,20 tagged` |

## Routing

| Task | Cisco IOS | FRR (vtysh) | Linux |
|---|---|---|---|
| Routing table | `show ip route` | `show ip route` | `ip route` |
| Specific route | `show ip route 10.1.2.3` | `show ip route 10.1.2.3` | `ip route get 10.1.2.3` |
| ARP table | `show arp` | — | `ip neigh` |
| Add static route | `ip route 10.0.0.0 255.0.0.0 10.1.1.2` | `ip route 10.0.0.0/8 10.1.1.2` | `ip route add 10.0.0.0/8 via 10.1.1.2` |
| Default route | `ip route 0.0.0.0 0.0.0.0 203.0.113.1` | `ip route 0.0.0.0/0 203.0.113.1` | `ip route add default via 203.0.113.1` |
| Disable routing | `no ip routing` | — | `sysctl net.ipv4.ip_forward=0` |

## OSPF

| Task | Cisco IOS | FRR (vtysh) |
|---|---|---|
| Neighbors | `show ip ospf neighbor` | `show ip ospf neighbor` |
| Interfaces | `show ip ospf interface brief` | `show ip ospf interface` |
| Database | `show ip ospf database` | `show ip ospf database` |
| Routes | `show ip route ospf` | `show ip route ospf` |
| Config | `router ospf 1` | `router ospf` |
| Network | `network 10.0.0.0 0.0.0.255 area 0` | `network 10.0.0.0/24 area 0` |
| Passive | `passive-interface Gi0/2` | `passive-interface eth2` |
| Cost | `ip ospf cost 10` | `ip ospf cost 10` |
| Router ID | `router-id 1.1.1.1` | `ospf router-id 1.1.1.1` |

## BGP

| Task | Cisco IOS | FRR (vtysh) |
|---|---|---|
| Summary | `show bgp summary` | `show bgp summary` |
| Table | `show bgp ipv4 unicast` | `show bgp ipv4 unicast` |
| One prefix | `show bgp ipv4 unicast 10.0.0.0/8` | `show bgp ipv4 unicast 10.0.0.0/8` |
| Neighbors | `show bgp neighbors 10.1.1.2` | `show bgp neighbors 10.1.1.2` |
| Advertised | `show bgp neighbors X advertised-routes` | same |
| Received | `show bgp neighbors X received-routes` | same |
| AS number | `router bgp 65001` | `router bgp 65001` |
| Neighbor | `neighbor 10.1.1.2 remote-as 65002` | same |
| Advertise | `network 10.0.0.0 mask 255.0.0.0` | `network 10.0.0.0/8` |

## NAT (Cisco)

```
show ip nat translations
show ip nat statistics
clear ip nat translation *
debug ip nat
```

## DHCP (Cisco)

```
show ip dhcp binding
show ip dhcp pool
show ip dhcp conflict
show ip dhcp server statistics
```

## VPN (Cisco)

```
show crypto isakmp sa
show crypto ipsec sa
show crypto session
show crypto map
```

## Linux networking essentials

```bash
ip addr                       # addresses
ip -br link                   # interfaces, brief
ip route                      # routes
ip route get 8.8.8.8          # which route would be used
ip neigh                      # ARP/NDP cache
ss -tulpn                     # listening sockets
ss -tnp                       # established TCP
tcpdump -i eth0 -nn port 443  # capture
dig +short example.com        # DNS
traceroute 8.8.8.8            # path
mtr 8.8.8.8                   # path + loss
curl -v https://example.com   # full HTTP/TLS
ethtool eth0                  # link speed, duplex
ethtool -S eth0               # driver counters
bridge fdb show               # MAC table
bridge vlan show              # VLANs
```

## Wireshark display filters

```
ip.addr == 10.1.1.5
tcp.port == 443
tcp.flags.syn == 1 && tcp.flags.ack == 0
tcp.analysis.retransmission
tcp.analysis.zero_window
icmp.type == 3
dns.flags.response == 0
arp
tls.handshake.type == 1
http.request
!arp && !icmp
```

## tcpdump capture filters

```bash
tcpdump -i eth0 -nn 'host 10.1.1.5 and port 443'
tcpdump -i eth0 -nn 'icmp or arp'
tcpdump -i eth0 -nn -w cap.pcap 'not port 22'
tcpdump -r cap.pcap -nn
```

## Useful one-liners

```bash
# top talkers on an interface (requires ntopng/iftop)
iftop -i eth0

# who is on this subnet
nmap -sn 192.168.1.0/24

# test a TCP port
nc -vz 10.1.1.10 22

# trace the DNS delegation
dig +trace example.com

# check MTU along a path (Linux)
ping -M do -s 1472 8.8.8.8

# generate traffic
iperf3 -s            # server
iperf3 -c 10.1.1.10  # client
```
