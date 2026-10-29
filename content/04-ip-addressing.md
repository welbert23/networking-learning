# 04 · IP Addressing and Subnetting

This is the chapter people fear. It is just binary arithmetic with a shortcut.

## The IPv4 address

32 bits, written as four decimal numbers: `192.168.10.25`.

```
192      .168      .10       .25
11000000 .10101000 .00001010 .00011001
```

An address is split into a **network part** and a **host part** by the subnet mask.

```
IP:    192.168.10.25
Mask:  255.255.255.0    -> /24
       11111111.11111111.11111111.00000000
       |------ network ------|  hosts  |
```

The first *N* bits identify the network. The remaining bits identify the host.

## CIDR and the block-size trick

Stop converting to binary for every subnet. Use this instead:

```
Block size = 256 − (mask octet)
```

| Prefix | Mask | Block size | Networks per /24 | Usable hosts |
|---|---|---|---|---|
| /24 | 255.255.255.0 | 256 | 1 | 254 |
| /25 | 255.255.255.128 | 128 | 2 | 126 |
| /26 | 255.255.255.192 | 64 | 4 | 62 |
| /27 | 255.255.255.224 | 32 | 8 | 30 |
| /28 | 255.255.255.240 | 16 | 16 | 14 |
| /29 | 255.255.255.248 | 8 | 32 | 6 |
| /30 | 255.255.255.252 | 4 | 64 | 2 |
| /31 | 255.255.255.254 | 2 | 128 | 2 (point-to-point) |
| /32 | 255.255.255.255 | 1 | 256 | 1 (host route) |

**Usable hosts = 2^(host bits) − 2** (network and broadcast are reserved).

## Worked example: subnet 192.168.10.0/26

- Block size: 256 − 192 = **64**
- Networks: `.0`, `.64`, `.128`, `.192`
- For `.64`: network `.64`, broadcast `.127`, usable `.65–.126`
- Hosts: 2^6 − 2 = **62**

So `192.168.10.90` is in the `.64` network. One step, no binary.

### Second example: 10.1.1.200/27

- Block size 32, networks: `.0 .32 .64 .96 .128 .160 .192 .224`
- `.200` falls in `.192` → network `10.1.1.192`, broadcast `10.1.1.223`, usable `.193–.222`

## VLSM: different sizes per subnet

Variable Length Subnet Masking = allocate from largest to smallest need.

Requirement: 100 hosts, 50 hosts, 25 hosts, and two point-to-point links, from `172.16.0.0/24`.

| Need | Prefix | Size | Allocated |
|---|---|---|---|
| 100 hosts | /25 | 128 | 172.16.0.0/25 |
| 50 hosts | /26 | 64 | 172.16.0.128/26 |
| 25 hosts | /27 | 32 | 172.16.0.192/27 |
| P2P | /30 | 4 | 172.16.0.224/30 |
| P2P | /30 | 4 | 172.16.0.228/30 |
| spare | — | — | 172.16.0.232–255 |

**Always allocate largest first.** If you start with the /30s you will fragment the space.

## Route summarization

A summary is the smallest prefix covering several networks. Convert to binary and take
the common leading bits.

```
172.16.0.0/24   = 10101100.00010000.00000000
172.16.1.0/24   = 10101100.00010000.00000001
172.16.2.0/24   = 10101100.00010000.00000010
172.16.3.0/24   = 10101100.00010000.00000011
                  common: 22 bits      -> 172.16.0.0/22
```

Summaries reduce routing table size and make the network stable — if a /24 flaps, the
summary does not.

## Public, private, and special addresses

| Range | Name | Notes |
|---|---|---|
| 10.0.0.0/8 | Private | large enterprises |
| 172.16.0.0/12 | Private | 172.16.0.0 – 172.31.255.255 |
| 192.168.0.0/16 | Private | home and small office |
| 127.0.0.0/8 | Loopback | 127.0.0.1 = localhost |
| 169.254.0.0/16 | Link-local (APIPA) | means DHCP failed |
| 0.0.0.0/0 | Default route | "everything else" |
| 224.0.0.0/4 | Multicast | OSPF 224.0.0.5, VRRP 224.0.0.18 |
| 240.0.0.0/4 | Reserved | — |

**`169.254.x.x` is a diagnostic gift:** if a host has it, DHCP did not answer. Say that
out loud in an interview and people notice.

## Common traps

| Trap | Reality |
|---|---|
| "The gateway must be .1" | Convention only. Any usable address works. |
| "A /24 always has 254 hosts" | Only if the mask is /24. Check the mask. |
| Network and broadcast are usable | No, except /31 (RFC 3021) and /32. |
| Overlapping subnets are fine | They cause asymmetric routing and NAT chaos. Never overlap. |
| Renumbering is easy | It is the most painful change in networking. Plan space up front. |

## How to practise

Do 10 problems a day for two weeks. Write the network, broadcast, and usable range for
random addresses. Use `ipcalc` to check yourself:

```bash
ipcalc 192.168.10.90/26
```

Speed comes from repetition, not from reading.

## Chapter check

1. Network, broadcast, usable range of `10.20.30.0/27`?
2. Is `192.168.5.130/25` in the same subnet as `192.168.5.200/25`?
3. Summarize `10.0.0.0/24` through `10.0.7.0/24`.
4. How many /30s fit in a /24?
5. A host shows `169.254.10.5/16`. What happened?

<details>
<summary>Answers</summary>

1. Network `.0`, broadcast `.31`, usable `.1–.30`.
2. **Yes.** A `/25` splits the /24 at `.128`. Both `.130` and `.200` are above `.128`, so both sit in `192.168.5.128/25`.
3. `10.0.0.0/21` (8 × /24 = 3 host bits).
4. 64.
5. DHCP did not respond — no server, no relay, or a VLAN/port issue.

</details>

---

**Next:** chapter **04B** has the live IPv4/IPv6 calculator — type any address and see the binary, mask, network, broadcast, usable range, and IPv6 compression computed for you. Use it to check your hand calculations.
