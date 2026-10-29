# 14 · Automation and Programmability

Every network engineer hired after 2020 is expected to automate. Not because it is trendy,
but because a 500-device network cannot be configured by hand without errors.

## Why automate

| Manual | Automated |
|---|---|
| 500 devices × 20 min = 166 hours | one script, 10 minutes |
| typos, missed devices, drift | consistent, repeatable |
| knowledge in one person's head | knowledge in Git |
| change window = all night | change window = one hour |

The goal is not "replace engineers". It is to stop wasting engineers on copy-paste.

## Data formats

### YAML

```yaml
switches:
  - name: sw1
    mgmt: 10.0.0.11
    vlans: [10, 20, 30]
  - name: sw2
    mgmt: 10.0.0.12
    vlans: [10, 20]
```

### JSON

```json
{"switches": [{"name": "sw1", "mgmt": "10.0.0.11", "vlans": [10, 20, 30]}]}
```

YAML is for humans, JSON for machines. Both map to the same structures: dicts, lists,
strings, numbers, booleans.

## APIs

### REST

```
GET    /api/devices
POST   /api/devices
PUT    /api/devices/1
DELETE /api/devices/1
```

Stateless. Authenticate with a token or basic auth. Returns JSON. Learn `curl` first,
then a library.

```bash
curl -s -H "Authorization: Token $TOKEN" https://netbox/api/dcim/devices/ | jq '.results[].name'
```

### NETCONF / RESTCONF / gNMI

| Protocol | Transport | Model | Use |
|---|---|---|---|
| NETCONF | SSH (830) | YANG | full config, transactions |
| RESTCONF | HTTPS | YANG | REST-style config |
| gNMI | gRPC | YANG | streaming telemetry |

**YANG** is the data model — a schema describing what a device can be configured with.
This is the "structured data" alternative to screen-scraping CLI output.

## Python for network engineers

You need very little Python. This is the whole starting set:

```python
# variables and strings
host = "10.0.0.1"
port = 22
print(f"connecting to {host}:{port}")

# lists and dicts
vlans = [10, 20, 30]
device = {"name": "sw1", "mgmt": "10.0.0.11"}

# loops
for vlan in vlans:
    print(f"vlan {vlan}")

# conditionals
if "mgmt" in device:
    print(device["mgmt"])

# files
with open("inventory.txt") as f:
    for line in f:
        print(line.strip())

# functions
def backup(host):
    return f"backup-{host}.cfg"

# error handling
try:
    do_something()
except Exception as exc:
    print(f"failed: {exc}")
```

That is enough to write 80% of useful network scripts.

### Libraries, in order of learning

| Library | What it does | When |
|---|---|---|
| `subprocess` | run CLI tools | always, start here |
| `requests` | HTTP APIs | REST APIs, NetBox |
| **Netmiko** | SSH to network devices | CLI-based devices |
| **NAPALM** | vendor-neutral config/getters | multi-vendor |
| **Nornir** | parallel automation framework | scale |
| **Ansible** | declarative automation | teams, ops |
| **pynetbox** | NetBox API | source of truth |
| **Jinja2** | templating configs | generate configs |

## The pattern that matters: source of truth → template → deploy → verify

```
NetBox (intent)
      |
      v
Jinja2 template  ->  rendered config
      |
      v
Nornir / Ansible  ->  push to devices
      |
      v
Verify + report
```

Never edit devices by hand after this exists. Change NetBox, run the pipeline, verify.

### Example: Jinja2 template

```jinja
{% for vlan in vlans %}
vlan {{ vlan.id }}
 name {{ vlan.name }}
{% endfor %}
```

### Example: idempotent backup

```python
import subprocess, datetime, pathlib

stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
out = pathlib.Path("backups") / stamp
out.mkdir(parents=True, exist_ok=True)

for host in ["10.0.0.11", "10.0.0.12"]:
    cfg = subprocess.run(
        ["ssh", host, "show running-config"],
        capture_output=True, text=True, check=True,
    ).stdout
    (out / f"{host}.cfg").write_text(cfg)
```

Idempotent means: running it twice does not break anything.

## Git

Non-negotiable. Your configs and scripts go in Git.

```bash
git init
git add .
git commit -m "add ospf lab"
git log --oneline
git diff
```

Why it matters: every change is attributable, reversible, and reviewable. A network
engineer without Git is a network engineer who cannot answer "what changed?".

## Safe automation rules

1. **Dry run first.** Print what would change before changing it.
2. **One device at a time** until the script is proven.
3. **Back up before deploy.** Always.
4. **Verify after deploy.** Compare the intended state to the actual state.
5. **Blast radius.** Never run a loop over all devices on the first attempt.
6. **Rate limit.** SSH sessions are cheap; device CPUs are not.
7. **Log everything.** Who ran what, on which device, at what time.

## What to learn next

- **Terraform** for cloud/network infrastructure
- **Streaming telemetry** (gNMI) instead of polling
- **CI/CD** for network changes (GitHub Actions + tests)
- **Batfish** to verify configs before deployment
- **Containerlab** to test changes before touching production

## Chapter check

1. Why is YAML preferred for human-written config data?
2. What is the difference between NETCONF and RESTCONF?
3. What does "idempotent" mean?
4. Why is Git essential for network automation?
5. What is the first thing a deploy script should do?

<details>
<summary>Answers</summary>

1. It is more readable (indentation, comments, fewer brackets) and maps cleanly to dicts and lists.
2. Both use YANG models; NETCONF runs over SSH and is transaction-oriented, RESTCONF runs over HTTPS with REST semantics.
3. Running it multiple times produces the same result — no duplicates, no drift.
4. It gives history, attribution, review, and rollback for every change.
5. Back up the current config (and print a dry run of what it intends to change).

</details>
