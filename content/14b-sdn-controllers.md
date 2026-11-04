# 14B · Controller-Based Networking and SDN

## Why a controller

On a traditional network every device is configured separately. Ten switches mean ten logins, ten chance for drift, and no single view of intent. A controller centralises configuration and policy, watches the whole fabric, and makes changes from one place.

That does not remove the need to understand routing and switching. A controller is a tool that pushes a model; if the model is wrong, it pushes the wrong thing everywhere, faster.

## The three planes

| Plane | What it does | Example |
|---|---|---|
| **Management** | How you configure and monitor | SSH, HTTPS, SNMP, syslog |
| **Control** | Builds the forwarding table | OSPF, BGP, STP, ARP |
| **Data** | Forwards the actual packets | ASIC, TCAM, forwarding table |

Traditional devices run all three locally. SDN separates the control plane from the forwarding devices and puts it in a controller. The devices become simpler forwarders that ask the controller what to do.

In practice most enterprise "SDN" keeps distributed control planes (OSPF, BGP, STP still run) and adds centralised management, assurance, and policy. The exam and the job both care about the difference between the marketing and the architecture.

## SDN architecture

- **Controller** - the brain: topology, policy, path calculation, telemetry.
- **Northbound API** - REST or similar, used by applications, orchestration, and your scripts.
- **Southbound API** - how the controller talks to devices: OpenFlow, NETCONF, RESTCONF, gNMI, or plain CLI/SNMP for legacy gear.
- **Overlay** - VXLAN or similar encapsulation that carries Layer-2 segments over a Layer-3 underlay.

Declarative means "this is the desired end state" (the controller works out the steps). Imperative means "do these commands in this order". Modern APIs and tools are declarative; classic CLI scripts are imperative.

VXLAN encapsulates the original frame in UDP (destination port 4789) with a 24-bit VNI, which gives about 16 million segments. EVPN is the control plane that tells the leaves which MAC and IP addresses live behind which VTEP.

## Controller platforms you will meet

| Platform | What it manages | Typical use |
|---|---|---|
| **Cisco Catalyst Center** (formerly DNA Center) | Campus switches, wireless, fabric, assurance, images | Enterprise campus |
| **Meraki dashboard** | Cloud-managed switches, APs, security appliances | Branch and mid-market |
| **SD-WAN manager** | WAN edge routers, tunnels, application policy | Multi-site WAN |
| **Wireless LAN controller** | Access points and client policy | Any Wi-Fi network |
| **OpenDaylight / ONOS** | Open-source SDN controllers | Labs, research, custom fabrics |

A fabric controller typically offers templates, site profiles, device inventory, software image management, and assurance (telemetry plus machine learning to spot anomalies). The value is consistency and visibility, not magic.

## Configuration management tools

| Tool | Agent | Language | Model |
|---|---|---|---|
| **Ansible** | None (SSH or API) | YAML playbooks | Push |
| **Puppet** | Agent | Puppet DSL | Pull, periodic |
| **Chef** | Agent | Ruby recipes | Pull, periodic |
| **SaltStack** | Agent or agentless | YAML / Python | Push or pull |

Ansible is usually the first tool network engineers learn because it needs no agent on the device and reads like a list of tasks.

```
- name: Ensure NTP servers
  cisco.ios.ios_config:
    lines:
      - ntp server 10.0.0.10
      - ntp server 10.0.0.11
```

**Idempotency** is the property that matters: running the same playbook twice should change nothing the second time. That is what makes automation safe.

A sane workflow: keep inventory and variables in Git, render config from templates, run in check mode, apply to one canary device, verify with show commands or tests, then roll out. If you cannot roll back, you are not ready to roll out.

## Learning path

1. Be solid on VLANs, routing, and STP first. Controllers amplify mistakes.
2. Learn JSON, HTTP, and REST with `curl` and Postman.
3. Try a free DevNet sandbox: read the inventory, GET an interface list, change a description, read it back.
4. Write a Python script with `requests` that saves device facts to a file.
5. Install Ansible, run one playbook against a lab device, then run it twice and prove idempotency.
6. Read the controller's assurance data and explain one anomaly to a colleague.

You do not need to be a software developer. You need to be a network engineer who can read an API response, use Git, and automate the boring parts without breaking production.

## Chapter check

1. Which plane does a controller centralise?

   - A. The data plane
   - B. The control plane
   - C. The power plane
   - D. The physical plane

2. What is a northbound API used for?

   - A. Talking from the controller down to switches.
   - B. Talking from applications and orchestration to the controller.
   - C. Powering PoE devices.
   - D. Encrypting VXLAN traffic.

3. Which protocol is commonly used as a southbound API to program forwarding?

   - A. SMTP
   - B. OpenFlow
   - C. DHCP
   - D. NTP

4. Why is Ansible often the first automation tool network engineers learn?

   - A. It requires an agent on every device.
   - B. It is agentless and uses YAML playbooks.
   - C. It only works with Cisco devices.
   - D. It replaces the need to understand routing.

5. What does idempotent mean for a configuration tool?

   - A. It runs faster the second time.
   - B. Running it twice leaves the system in the same desired state.
   - C. It always reboots the device.
   - D. It only works once per device.

<details>
<summary>Answers</summary>

1. **B** - SDN separates the control plane from forwarding and centralises control in the controller.
2. **B** - Northbound APIs face applications and automation; southbound APIs face the network devices.
3. **B** - OpenFlow is a classic southbound protocol for programming forwarding behaviour in SDN.
4. **B** - Ansible connects over SSH or APIs with no agent and uses readable YAML playbooks.
5. **B** - Idempotency means repeated runs converge on the same state and do not make duplicate changes.

</details>
