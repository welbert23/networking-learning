# Networking: From Zero to Network Engineer

A practical, vendor-neutral networking field guide covering the fundamentals through switching, routing, security, troubleshooting, automation, hands-on labs, and career preparation.

## Read the ebook

- [Open the ebook](./Networking-Ebook.html)
- [Open the subnetting and IP calculator](./IP-Calculator.html)
- [Open the browser network lab](./Network-Lab.html)

The ebook is a standalone HTML page with responsive navigation, dark mode, reference tables, an interactive subnetting calculator, and a shortcut to the browser-based network lab.

The network lab is a learning simulator, not Cisco Packet Tracer or a Cisco IOS emulator. Its workbench has a large pannable topology canvas with zoom controls and Fit view, draggable devices, device palette, connection tool, selectable/deletable cables, PC/laptop/server/hub/switch/router models, IPv4/VLAN/interface settings, a Cisco-style command subset, static routes, and ping PDUs with a selectable destination. The Configure panel can check modeled addressing, duplicate IPs, interface/link state, basic VLAN attachment, gateway reachability, and a basic end-to-end ping. The switch CLI includes a simulated `show mac address-table` populated after a successful simulated ping. Simulation mode advances a packet through the modeled topology one device at a time; realtime mode delivers the test immediately, and completed tests can be repeated. Selecting any of the 15 ebook Guided Labs loads a visible starter topology into the workspace along with its goal, tools, proof requirements, and link to the full instructions; loading a lab replaces the current topology. Advanced labs still require their listed external tools and are not validated by this browser checker. Browser-local save plus JSON import/export are also included. It does not run real device images or send network traffic, and it does not reproduce every feature or protocol in commercial network simulators. Queued packets re-check each link before forwarding, route selection honors the longest matching static prefix and next-hop address, and imported topologies are checked for invalid devices, interfaces, routes, and cable endpoints.

## Repository contents

- `Networking-Ebook.html` — complete interactive ebook
- `Network-Lab.html` — browser-based topology editor, device palette, console, packet simulation, guided labs, and topology import/export
- `IP-Calculator.html` — standalone IP calculator
- `content/` — chapter source material in Markdown
- `widgets/` — reusable calculator widget
- `index.html` — GitHub Pages entry point

## Run locally

Open `Networking-Ebook.html` or `Network-Lab.html` in a modern browser. No build step or package installation is required. Lab state is saved in that browser; use Export/Import to move a topology to another browser or device.
