# Networking: From Zero to Network Engineer

A practical, vendor-neutral networking field guide covering the fundamentals through switching, routing, security, troubleshooting, automation, hands-on labs, and career preparation.

## Read the ebook

- [Landing page](./index.html) — start here
- [Open the ebook](./Networking-Ebook.html)
- [Open the subnetting and IP calculator](./IP-Calculator.html)
- [Open the browser network lab](./Network-Lab.html)

The ebook is a standalone HTML page with responsive navigation, chapter search, a dark reading theme, reference tables, an interactive subnetting calculator, and a shortcut to the browser-based network lab.

The network lab is a learning simulator, not Cisco Packet Tracer or a Cisco IOS emulator. Its workbench has a large pannable topology canvas with zoom controls and Fit view, draggable devices, device palette, connection tool, selectable/deletable cables, PC/laptop/server/hub/switch/router models, IPv4/VLAN/interface settings, a Cisco-style command subset, static routes, and ping PDUs with a selectable destination. The Configure panel can check modeled addressing, duplicate IPs, interface/link state, basic VLAN attachment, gateway reachability, and a basic end-to-end ping. The switch CLI includes a simulated `show mac address-table` populated after a successful simulated ping. Simulation mode advances a packet through the modeled topology one device at a time; realtime mode delivers the test immediately, and completed tests can be repeated. Selecting any of the 15 browser-lab Guided Labs loads a visible starter topology into the workspace along with its goal, tools, proof requirements, and link to the full instructions; loading a lab replaces the current topology. Advanced labs still require their listed external tools and are not validated by this browser checker. Browser-local save plus JSON import/export are also included. It does not run real device images or send network traffic, and it does not reproduce every feature or protocol in commercial network simulators. Queued packets re-check each link before forwarding, route selection honors the longest matching static prefix and next-hop address, and imported topologies are checked for invalid devices, interfaces, routes, and cable endpoints.

## Project layout

```
index.html                 landing page
Networking-Ebook.html      the ebook (markup only)
IP-Calculator.html         standalone calculator page (markup only)
Network-Lab.html           the lab workbench (markup only)
assets/
  favicon.svg
  css/
    base.css               design tokens, reset, shared components
    landing.css            landing page
    ebook.css              reading layout for the ebook
    ipcalc.css             the calculator widget
    calculator.css         calculator page shell
    lab.css                the network lab
  js/
    ebook.js               navigation, search, progress, code copy
    ipcalc.js              all IPv4/IPv6 calculator logic
    calculator.js          remembers the last address you typed
    lab.js                 topology editor, CLI, and packet simulation
content/                   chapter source material in Markdown
widgets/ipcalc.html        reusable calculator widget page
build.js                   inlines the CSS/JS into single-file copies (optional)
dist/                      generated standalone pages (see below)
```

Every page is plain HTML, CSS, and JavaScript. There is no build step required,
no package installation, and no network dependency — the whole folder works
offline. `build.js` is optional and only produces shareable single-file copies.

## Features

- **Dark theme** on every page.
- **Chapter search** in the ebook sidebar (press `/` to focus it).
- **Copy buttons** on every code block in the ebook.
- **Reading progress** bar plus a remembered scroll position.
- **Print stylesheet** for the ebook.
- **Persistent calculator state** so your last address survives a reload.

There are no inline scripts left; every page loads its behaviour from `assets/js`.

## Run locally

Open `index.html` in a modern browser. No build step or package installation is required.

If you prefer a local server (recommended when testing links):

```powershell
# any static file server works, for example
npx serve .
```

Lab state is saved in that browser; use Export/Import to move a topology to another browser or device.

## Single-file copies

The source pages share one set of CSS/JS files so the design stays consistent.
If you need a page that works on its own — one `.html` with no `assets/` folder,
easy to email or drop on a USB stick — build the standalone copies:

```powershell
node build.js
```

That writes `dist/index.html`, `dist/Networking-Ebook.html`,
`dist/IP-Calculator.html`, `dist/Network-Lab.html`, and
`dist/widgets/ipcalc.html`, each with its stylesheets, scripts, and favicon
inlined. Open them with `file://` or host them anywhere. Re-run the command
after editing anything in `assets/` or the page markup.

Note: `dist/` is generated output — edit the source pages in the project root,
not the files inside `dist/`.
