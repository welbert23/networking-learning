# 16 · Career: Getting the Job

Skills get you interviews. Evidence gets you offers.

## Certifications vs skills

| | Certificate | Skill + evidence |
|---|---|---|
| Proves | you passed a test | you can do the work |
| Expires | yes | no |
| Costs | money | time |
| Gets you | past HR filters | through technical interviews |

The practical answer: **get one certificate early to pass filters, then build evidence.**

| Certificate | When it makes sense |
|---|---|
| **CCNA** | first job, strong general foundation |
| **CCNP Enterprise** | 2+ years experience, moving to design |
| **Juniper JNCIA / JNCIS** | Juniper shops |
| **AWS / Azure networking** | cloud-heavy roles |
| Vendor-neutral (Network+) | absolute beginner, before CCNA |

Do not collect certificates instead of building. Three certs and no lab is a red flag.

## What employers actually screen for

1. Can you subnet without a calculator?
2. Can you explain what happens when you type a URL?
3. Can you read a packet capture?
4. Have you broken something and fixed it?
5. Can you describe a network you built or operated?
6. Do you document?

## The URL question

Practice this until it is fluent:

> Browser checks cache → DNS resolution (recursive → root → TLD → authoritative) →
> TCP handshake to the server IP:443 → TLS handshake (certificate, key exchange) →
> HTTP GET → server responds → browser renders.
> Along the way: ARP for the gateway, routing through the default route, NAT at the edge,
> stateful firewall tracking the session.

Every word in that answer is a chapter in this book.

## Portfolio

Three things, in one public repo:

1. **A lab you built** — topology diagram, configs, and what you learned.
2. **A capture you explained** — the pcap plus your analysis.
3. **A script you wrote** — backup, audit, or report. Small is fine.

Add a `README.md` that says, in plain language, what each one demonstrates.

## Interview questions with short answers

| Question | The answer they want |
|---|---|
| What happens when you type a URL? | DNS → TCP → TLS → HTTP, with ARP/routing/NAT in between |
| Difference between a switch and a router? | L2 vs L3; MAC table vs routing table; one broadcast domain vs boundaries |
| What is a VLAN? | A logical broadcast domain; segmentation without extra hardware |
| How does OSPF choose a path? | Lowest cumulative cost via SPF; DR/BDR on broadcast segments |
| Why does BGP exist? | Policy-based inter-domain routing between autonomous systems |
| What is the difference between TCP and UDP? | Reliability/ordering vs speed/simplicity |
| How do you troubleshoot "no internet"? | Scope, ping by IP, DNS, gateway, ARP, traceroute, capture |
| What is NAT and why? | Address translation to conserve public IPv4; breaks end-to-end |
| What is an MTU issue and how do you find it? | Path MTU discovery failure; test with DF and decreasing sizes |
| What is your favourite network tool? | Be specific and explain why (Wireshark, tcpdump, mtr, Batfish) |
| Describe a failure you caused and fixed | Honesty + method + lesson. This separates candidates |
| How would you automate 100 switches? | Source of truth → template → deploy → verify, with dry runs |

## Resume bullets that work

Bad: *"Responsible for network operations."*

Good:

- *"Migrated 42 access switches from static VLAN config to a templated Ansible pipeline, cutting change time from 3 hours to 15 minutes."*
- *"Reduced recurring broadcast storms by implementing BPDU Guard and RSTP across 12 buildings."*
- *"Built a containerlab lab replicating the production OSPF/BGP design to test changes before deployment."*
- *"Documented and automated configuration backups for 120 devices, eliminating manual nightly work."*

Formula: **action + scale + measurable result**.

## 30-60-90 for a new role

| Period | Focus |
|---|---|
| First 30 days | learn the topology, the change process, and who to ask; read the docs; do not change anything without a backup |
| Days 31–60 | take small tickets, document as you go, automate one annoying task |
| Days 61–90 | own a change end to end, propose one improvement with data |

## Where the jobs are

| Role | Focus |
|---|---|
| Network operations (NOC) | monitoring, tickets, incidents |
| Network engineer | design, build, change |
| Network automation engineer | code + network |
| Cloud network engineer | VPC/VNet, hybrid, transit |
| Security network engineer | firewalls, segmentation, VPN |
| Solutions architect | design and sales support |

Start in operations if you can. You will see more failures in one year than a design role
sees in five, and failures teach faster than diagrams.

## The unfashionable advice that works

1. **Document everything.** The engineer who writes the runbook becomes the lead.
2. **Learn one thing deeply.** OSPF or BGP or Linux networking — depth transfers.
3. **Read packet captures for fun.** It compounds.
4. **Automate the boring part first.** Nobody is impressed by a framework; they are
   impressed by the 15 minutes you gave back.
5. **Be the person who says "let me verify".** That is the whole job.

## Final check

- [ ] I can subnet any IPv4 address in under 30 seconds
- [ ] I can explain the full URL-to-page path
- [ ] I have built and broken a VLAN/STP topology
- [ ] I have run OSPF and BGP in a real lab
- [ ] I have explained six packet captures
- [ ] I have a script that backs up configs
- [ ] I have a repo that shows all of the above
- [ ] I can describe a failure I caused and how I fixed it

If all eight are true, you are ready to apply — with or without a certificate.
