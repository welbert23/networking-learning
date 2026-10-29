# 04B · IPv4 & IPv6 Calculator

Everything in this chapter runs in your browser. Type an address, change the prefix, and
every field updates. There are six tabs: **IPv4**, **IPv6**, **VLSM**, **IPv6 Split**,
**Practice**, and **Reference**.

The point is not to skip the arithmetic. The point is to see it happen: every result comes
with the bits that produced it, so a wrong hand calculation is easy to trace back to the
exact bit you got wrong.

## What the calculator gives you

| IPv4 | IPv6 |
|---|---|
| Binary of the address and the mask | 8 hextets with hex, decimal, and 16-bit binary |
| Network address (the AND operation) | Expanded and RFC 5952 compressed form |
| Broadcast address | Network prefix and last address |
| First and last usable host | Address count in the prefix |
| Usable host count | Address type (global, link-local, ULA, multicast, …) |
| Subnet mask and wildcard mask | Interface ID |
| Block size and the interesting octet | 128-bit binary view |
| Class, private/public, special ranges | SLAAC and planning guidance |
| IPv4-mapped IPv6 forms | — |

Beyond the two columns above, the calculator also has a **VLSM planner**, an
**IPv6 splitter**, a **MAC → EUI-64** helper, and a **prefix overlap checker**.

## Worked example: 15.168.1.1/17

Follow the five steps.

**Step 1 — mask.** /17 means 17 network bits.

```
11111111.11111111.10000000.00000000
   255  .   255  .   128  .    0
```

**Step 2 — block size.** The interesting octet is the third one (mask 128 → block 256 − 128 = 128).

**Step 3 — network.** The third octet is 1. The multiples of 128 are 0 and 128. The highest
one at or below 1 is 0.

```
15.168.1.1  AND  255.255.128.0  =  15.168.0.0
```

**Step 4 — broadcast.** Next block starts at 15.168.128.0, so broadcast is 15.168.127.255.

**Step 5 — usable range and hosts.**

```
first host  15.168.0.1
last host   15.168.127.254
hosts       2^(32−17) − 2 = 32768 − 2 = 32766
```

Check those numbers against the calculator below. They should match exactly.

## Worked example: an IPv6 address at /48

Take `2001:0db8:85a3:0000:0000:8a2e:0370:7334/48`.

**Step 1 — split into 8 hextets.**

```
2001 : 0db8 : 85a3 : 0000 : 0000 : 8a2e : 0370 : 7334
```

**Step 2 — /48 keeps the first three hextets.** Everything after is the interface ID.

```
network = 2001:0db8:85a3:0000:0000:0000:0000:0000
```

**Step 3 — last address in the prefix** is the network with all host bits set to 1.

```
2001:0db8:85a3:ffff:ffff:ffff:ffff:ffff
```

**Step 4 — compress.** Drop leading zeros, then replace the longest run of zero groups
with `::` once.

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334   ->   2001:db8:85a3::8a2e:370:7334
```

**Step 5 — count.** 128 − 48 = 80 host bits, so 2^80 addresses — about 1.2 × 10^24.

## VLSM in five steps

VLSM means **variable length subnet mask**: inside the same address block, different subnets
can have different sizes. A /24 for four departments does not have to be four /26s.

Example: `10.0.0.0/24`, with Sales 50 hosts, IT 20, Voice 10, and one point-to-point link.

**Step 1 — sort the requirements biggest first.** 50, 20, 10, 2.

**Step 2 — size each subnet.** Find the smallest host bits `n` where `2^n − 2 ≥ hosts`.

| Requirement | Host bits | Usable | Prefix |
|---|---|---|---|
| 50 | 6 | 62 | /26 |
| 20 | 5 | 30 | /27 |
| 10 | 4 | 14 | /28 |
| 2 | 2 | 2 | /30 |

**Step 3 — place each block at the next aligned address.**

```
Sales   10.0.0.0/26     .0    - .63
IT      10.0.0.64/27    .64   - .95
Voice   10.0.0.96/28    .96   - .111
P2P     10.0.0.112/30   .112  - .115
```

**Step 4 — see what is left.** `.116` to `.255` = 140 addresses still free.

**Step 5 — check alignment.** Every block starts on a multiple of its own size. `/26` starts
at 0, `/27` at 64, `/28` at 96, `/30` at 112. If a block does not start on a multiple of its
size, the plan is wrong.

That is exactly what the VLSM tab does — put the base and the host counts in, and it returns
the table above. If the requirements do not fit, it tells you which one failed.

## Splitting a /48 into /64s

A `/48` has 16 subnet bits left before the interface ID, so it contains `2^16 = 65,536` /64s.

```
2001:db8:1234:0000::/64
2001:db8:1234:0001::/64
2001:db8:1234:0002::/64
...
2001:db8:1234:ffff::/64
```

Only the fourth hextet changes. The first three hextets are the site prefix, and the last
four are the interface ID.

| Allocation | Contains |
|---|---|
| /32 to an ISP | 65,536 /48 sites |
| /48 to a site | 65,536 /64 LANs |
| /56 to a home | 256 /64 LANs |
| /64 to one LAN | 18.4 quintillion addresses |

Do not subnet a /64 further. SLAAC needs the host part to stay 64 bits, and every device on
the LAN expects the same prefix length.

## The other two tools

**MAC → EUI-64.** Flip the universal/local bit of the first octet (XOR the second-least
significant bit of the first byte), then insert `ff:fe` in the middle.

```
00:1a:2b:3c:4d:5e
 ^^ flip bit 1 of 0x00 -> 0x02
02:1a:2b  ff:fe  3c:4d:5e      interface ID
fe80::21a:2bff:fe3c:4d5e/64    link-local address
```

**Overlap checker.** Two prefixes either share no address at all, are identical, or one is
inside the other. If two prefixes share addresses but neither contains the other, one of them
is misaligned — that is a configuration error.

## The calculator

<!--IPCALC-->

## Accuracy notes

- Binary is shown per bit, with the network portion and the host portion in different colours.
- The network address is a real 32-bit AND, and the table shows every step.
- IPv6 compression follows RFC 5952: longest zero run, first one on a tie, used only once.
- Address type comes from the real prefix, not from the first octet.
- Any valid address works — the results are never limited to a fixed sample.

## How to use it while studying

1. **Before you calculate by hand**, predict the network and broadcast.
2. Type the address into the calculator.
3. **Compare.** If you were wrong, look at the AND table and find the bit you got wrong.
4. Do five problems in the Practice tab. Aim for five correct in a row.
5. Move the prefix by one (/24 → /25 → /26) and watch which field halves.
6. Design a VLSM plan for `10.0.0.0/24` by hand, then check it in the VLSM tab.
7. Take a /48 and split it into /64s on paper, then confirm the first ten in the IPv6 Split tab.

The goal is not to use the calculator forever. The goal is that after 50 problems you no
longer need it — and you can explain every field on the screen.
