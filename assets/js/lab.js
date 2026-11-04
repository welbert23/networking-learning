(function () {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const canvas = $("#canvas");
  const canvasViewport = $("#canvasViewport");
  const canvasContent = $("#canvasContent");
  const linkSvg = $("#links");
  const eventsEl = $("#events");
  const statusEl = $("#status");
  const storageKey = "networking-field-guide-lab-v1";
  const state = { devices: [], links: [], selected: null, selectedLink: null, connectMode: false, connectFrom: null, activeGuide: null, cliMode: "user", cliInterface: null, mode: "realtime", events: [], pendingEvents: [], frames: [], zoom: 1, baseWidth: 1800, baseHeight: 1100, spacePanning: false, suppressCanvasClick: false };
  const labs = [
    { id: "lab-01", title: "Lab 01 — Two hosts, one switch", goal: "ping between two PCs on the same VLAN; read the MAC table.", tool: "This browser lab", support: "sim", scope: "Configure both PCs and the switch, send a PDU, then run show mac address-table in the switch CLI.", proof: "show mac address-table output + explanation of why each MAC is on that port." },
    { id: "lab-02", title: "Lab 02 — ARP and the gateway", goal: "see ARP for the gateway when pinging a remote host.", tool: "This browser lab (routed ping + ARP)", support: "sim", scope: "Route between subnets, ping through a gateway, and inspect ARP on end devices or with the packet capture.", proof: "ARP/capture showing resolution for the gateway." },
    { id: "lab-03", title: "Lab 03 — Subnetting drill", goal: "50 random addresses, 100% correct.", tool: "IP calculator (practice mode)", support: "external", scope: "Open the IP calculator and use its practice mode.", proof: "a sheet of worked answers with zero corrections." },
    { id: "lab-04", title: "Lab 04 — VLANs", goal: "create VLANs and assign ports to them.", tool: "This browser lab (VLANs)", support: "sim", scope: "Create VLANs, assign switch ports to access VLANs, and verify with show vlan brief.", proof: "show vlan brief with correct VLAN membership." },
    { id: "lab-05", title: "Lab 05 — Trunks and allowed VLANs", goal: "configure a trunk and restrict allowed VLANs.", tool: "This browser lab (trunk)", support: "sim", scope: "Set switchports to trunk, configure allowed VLANs with switchport trunk allowed vlan, and test connectivity across the trunk.", proof: "show interfaces trunk + test between allowed/disallowed VLANs." },
    { id: "lab-06", title: "Lab 06 — Router-on-a-stick (inter-VLAN routing)", goal: "route between VLANs using subinterfaces.", tool: "This browser lab (ROAS)", support: "sim", scope: "Configure trunk to the router, create G0/0.<vlan> subinterfaces with encapsulation dot1q, assign IPs, and ping between VLANs.", proof: "show ip route + successful cross-VLAN ping." },
    { id: "lab-07", title: "Lab 07 — STP", goal: "three switches in a triangle; find the root, the root ports, the blocked port.", tool: "This browser lab (STP simulation)", support: "sim", scope: "Build a triangle of switches, run show spanning-tree on all three, and identify the root, root/alternate/designated ports.", proof: "show spanning-tree from all three + a diagram of port roles." },
    { id: "lab-08", title: "Lab 08 — OSPF basics", goal: "full adjacency, loopbacks reachable, convergence under 10 s.", tool: "This browser lab (OSPF basics)", support: "sim", scope: "Enable OSPF (router ospf) on three routers, advertise networks, and verify reachability with ping/show ip route.", proof: "show ip ospf neighbor, show ip route, and reachability between loopbacks." },
    { id: "lab-09", title: "Lab 09 — Break OSPF", goal: "cause and diagnose three failures: area mismatch, MTU mismatch, passive interface.", tool: "This browser lab (OSPF diagnostics)", support: "sim", scope: "Use passive-interface, mismatched network masks/areas, or MTU changes and diagnose with show ip ospf neighbor and the capture.", proof: "for each failure: symptom, observed state, fix." },
    { id: "lab-10", title: "Lab 10 — BGP between two ASes", goal: "eBGP session up, loopback advertised, AS_PATH visible.", tool: "This browser lab (eBGP basics)", support: "sim", scope: "Configure router bgp <ASN> on two routers, neighbor with remote-as, network advertise, and check show bgp summary.", proof: "show bgp summary + verification that the remote prefix is reachable." },
    { id: "lab-11", title: "Lab 11 — BGP policy", goal: "change outbound preference with local preference, inbound with prepending.", tool: "This browser lab (BGP policy)", support: "sim", scope: "Use AS-path prepending and policy to influence path selection and observe the effect.", proof: "before/after show bgp output with explanation." },
    { id: "lab-12", title: "Lab 12 — ACLs and NAT", goal: "permit only HTTP/HTTPS out, block the rest, PAT the inside network.", tool: "This browser lab (ACLs/NAT)", support: "sim", scope: "Use access lists on interfaces and NAT/PAT configuration (ip nat inside/outside) to translate inside addresses and filter traffic.", proof: "policy working from inside hosts + translation evidence." },
    { id: "lab-13", title: "Lab 13 — DHCP and DNS", goal: "a DHCP pool with relay, a local DNS record, a client that resolves it.", tool: "This browser lab (DHCP relay + DNS)", support: "sim", scope: "Configure a DHCP server on one router, use ip helper-address for relay, and a local DNS entry to resolve a name.", proof: "client obtains an address and resolves the local DNS name." },
    { id: "lab-14", title: "Lab 14 — Wireshark deep dive (Packet capture)", goal: "explain six captures: ARP, ICMP TTL, OSPF hello, BGP open, DNS query, TCP retransmission.", tool: "This browser lab (Packet capture)", support: "sim", scope: "Use the Capture tab to inspect frames: send PDUs, trigger ARP/DNS/DHCP, and read protocol/fields for each required type.", proof: "capture notes with expected/saw/because for each frame." },
    { id: "lab-15", title: "Lab 15 — Automation: config backup & intent to config", goal: "back up configs and apply intent via template.", tool: "This browser lab (export/intent)", support: "sim", scope: "Export topology/config snapshots, document intent, apply via CLI, and verify with show/ping.", proof: "intent.yaml, rendered config, backup snapshot, verification report." }
  ];
  const deviceTypeLabel = { pc: "PC", laptop: "Laptop", server: "Server", switch: "Switch", router: "Router", hub: "Hub" };
  const supportedDeviceTypes = Object.keys(deviceTypeLabel);
  const isEndDevice = (type) => type === "pc" || type === "laptop" || type === "server";
  const safeId = (prefix) => prefix + Math.random().toString(36).slice(2, 8);
  function interfacesFor(type) {
    if (type === "router") return ["G0/0", "G0/1", "G0/2"];
    if (type === "switch") return Array.from({ length: 24 }, (_, i) => "F0/" + (i + 1));
    if (type === "hub") return Array.from({ length: 8 }, (_, i) => "Port" + (i + 1));
    return ["F0"];
  }
  function newDevice(type, name, x, y) {
    const interfaces = {};
    interfacesFor(type).forEach((port) => { interfaces[port] = { up: isEndDevice(type) || type === "switch" || type === "hub", ip: "", prefix: 24, vlan: 1 }; });
    return normalizeDevice({ id: safeId(type), type, name, x, y, gateway: "", interfaces, routes: [] });
  }
  function normalizeDevice(device) {
    if (!Array.isArray(device.vlans) || !device.vlans.length) device.vlans = [{ id: 1, name: "default" }];
    if (!device.arp || typeof device.arp !== "object") device.arp = {};
    if (!Array.isArray(device.acls)) device.acls = [];
    if (!Array.isArray(device.dns)) device.dns = [];
    if (!Array.isArray(device.routes)) device.routes = [];
    if (device.ospf === undefined) device.ospf = null;
    if (device.bgp === undefined) device.bgp = null;
    if (device.nat === undefined) device.nat = null;
    if (device.dhcp === undefined) device.dhcp = null;
    if (device.lease === undefined) device.lease = null;
    if (!device.dnsServer) device.dnsServer = "";
    if (!device.stp) device.stp = { priority: 32768 };
    Object.entries(device.interfaces).forEach(([, port]) => {
      if (!port.mode) port.mode = "access";
      if (port.allowed === undefined) port.allowed = null;
      if (!port.native) port.native = 1;
      if (!port.helper) port.helper = "";
      if (!port.mtu) port.mtu = 1500;
      if (!port.aclIn) port.aclIn = null;
      if (!port.aclOut) port.aclOut = null;
      if (port.ospfPassive === undefined) port.ospfPassive = false;
      if (!port.vlan) port.vlan = 1;
      if (!port.ip) port.ip = "";
      if (!Number.isInteger(port.prefix)) port.prefix = 24;
    });
    return device;
  }
  function normalizeTopology() { state.devices.forEach(normalizeDevice); }
  function getDevice(id) { return state.devices.find((device) => device.id === id); }
  function getLinksFor(deviceId, port) {
    return state.links.filter((link) => (link.a.deviceId === deviceId && (!port || link.a.port === port)) || (link.b.deviceId === deviceId && (!port || link.b.port === port)));
  }
  function setStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.className = kind === "good" ? "status-good" : kind === "bad" ? "status-bad" : "";
  }
  function resizeWorkspace() {
    const viewport = canvasViewport;
    const previousWidth = state.baseWidth, previousHeight = state.baseHeight;
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / state.zoom / previousWidth;
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / state.zoom / previousHeight;
    state.baseWidth = Math.max(320, viewport.clientWidth);
    state.baseHeight = Math.max(220, viewport.clientHeight);
    canvasContent.style.width = state.baseWidth + "px";
    canvasContent.style.height = state.baseHeight + "px";
    linkSvg.setAttribute("viewBox", "0 0 " + state.baseWidth + " " + state.baseHeight);
    canvas.style.width = state.baseWidth * state.zoom + "px";
    canvas.style.height = state.baseHeight * state.zoom + "px";
    canvasContent.style.transform = "scale(" + state.zoom + ")";
    $("#zoomLevel").textContent = Math.round(state.zoom * 100) + "%";
    if (previousWidth !== state.baseWidth || previousHeight !== state.baseHeight) {
      viewport.scrollLeft = centerX * state.baseWidth * state.zoom - viewport.clientWidth / 2;
      viewport.scrollTop = centerY * state.baseHeight * state.zoom - viewport.clientHeight / 2;
      if (!state.devices.length) {
        viewport.scrollLeft = state.baseWidth * state.zoom / 2 - viewport.clientWidth / 2;
        viewport.scrollTop = state.baseHeight * state.zoom / 2 - viewport.clientHeight / 2;
      }
    }
    updateDeviceDom();
  }
  function setWorkspaceZoom(value, preserveCenter) {
    const viewport = canvasViewport;
    const oldZoom = state.zoom;
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / oldZoom;
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / oldZoom;
    state.zoom = Math.max(0.15, Math.min(2.5, Math.round(value * 100) / 100));
    canvas.style.width = state.baseWidth * state.zoom + "px";
    canvas.style.height = state.baseHeight * state.zoom + "px";
    canvasContent.style.transform = "scale(" + state.zoom + ")";
    $("#zoomLevel").textContent = Math.round(state.zoom * 100) + "%";
    if (preserveCenter !== false) {
      viewport.scrollLeft = centerX * state.zoom - viewport.clientWidth / 2;
      viewport.scrollTop = centerY * state.zoom - viewport.clientHeight / 2;
    }
    renderLinks();
  }
  function fitWorkspaceView() {
    if (!state.devices.length) {
      setWorkspaceZoom(1, false);
      canvasViewport.scrollTo({ left: 0, top: 0 });
      setStatus("Workspace view reset to 100%.");
      return;
    }
    const positions = state.devices.map((device) => ({
      left: device.x / 100 * state.baseWidth,
      top: device.y / 100 * state.baseHeight
    }));
    const minX = Math.min(...positions.map((point) => point.left));
    const minY = Math.min(...positions.map((point) => point.top));
    const maxX = Math.max(...positions.map((point) => point.left + 92));
    const maxY = Math.max(...positions.map((point) => point.top + 88));
    const viewport = canvasViewport;
    const scaleX = (viewport.clientWidth - 48) / Math.max(maxX - minX, 1);
    const scaleY = (viewport.clientHeight - 48) / Math.max(maxY - minY, 1);
    const zoom = Math.max(0.15, Math.min(1, Math.min(scaleX, scaleY)));
    setWorkspaceZoom(zoom, false);
    viewport.scrollLeft = Math.max(0, (minX + maxX) / 2 * zoom - viewport.clientWidth / 2);
    viewport.scrollTop = Math.max(0, (minY + maxY) / 2 * zoom - viewport.clientHeight / 2);
    setStatus("Workspace fitted to show all devices.");
  }
  function addEvent(event) {
    state.events.unshift(event);
    state.events = state.events.slice(0, 100);
    renderEvents();
  }
  function renderEvents() {
    eventsEl.replaceChildren();
    $("#eventCount").textContent = state.events.length + (state.events.length === 1 ? " event" : " events");
    $("#stepButton").disabled = state.pendingEvents.length === 0;
    if (!state.events.length) {
      const row = document.createElement("tr"), cell = document.createElement("td");
      cell.colSpan = 8; cell.className = "event-placeholder"; cell.textContent = "No packets yet. Select a source and destination, then add a PDU.";
      row.appendChild(cell); eventsEl.appendChild(row); return;
    }
    state.events.forEach((event) => {
      const row = document.createElement("tr");
      if (event.status === "Success" || event.status === "Complete") row.className = "success";
      if (event.status === "Failed") row.className = "failure";
      const fireCell = document.createElement("td");
      if (event.type === "ICMP") {
        const fire = document.createElement("button"); fire.type = "button"; fire.className = "fire-event"; fire.dataset.action = "fire"; fire.dataset.id = event.id; fire.textContent = "Repeat";
        fireCell.appendChild(fire);
      } else fireCell.textContent = "—";
      const values = [event.status, event.source, event.destination, event.type, String(event.time), String(event.count)];
      row.appendChild(fireCell);
      values.forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; row.appendChild(cell); });
      const deleteCell = document.createElement("td"), remove = document.createElement("button");
      remove.type = "button"; remove.className = "fire-event"; remove.dataset.action = "delete"; remove.dataset.id = event.id; remove.textContent = "×"; remove.setAttribute("aria-label", "Delete event");
      deleteCell.appendChild(remove); row.appendChild(deleteCell); eventsEl.appendChild(row);
    });
  }
  function renderCapture() {
    const body = $("#captureRows");
    if (!body) return;
    const filter = ($("#captureFilter")?.value || "").trim().toLowerCase();
    const frames = state.frames.filter((frame) => !filter ||
      [frame.proto, frame.sourceName, frame.destName, frame.srcIp, frame.dstIp, frame.info].join(" ").toLowerCase().includes(filter));
    $("#captureCount").textContent = frames.length + " of " + state.frames.length + " frames";
    body.replaceChildren();
    if (!frames.length) {
      const row = document.createElement("tr"), cell = document.createElement("td");
      cell.colSpan = 7; cell.className = "event-placeholder";
      cell.textContent = state.frames.length ? "No frames match this filter." : "No frames captured yet. Send a PDU or configure a protocol.";
      row.appendChild(cell); body.appendChild(row); return;
    }
    frames.forEach((frame, index) => {
      const row = document.createElement("tr");
      const cells = [
        String(frames.length - index),
        Number(frame.time).toFixed(3),
        frame.sourceName || "",
        frame.destName || "",
        frame.proto || "",
        String(frame.length || 64),
        frame.info || ""
      ];
      cells.forEach((value, cellIndex) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        if (cellIndex === 4) cell.className = "proto";
        if (frame.denied) cell.className = "deny";
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
  }
  function renderCaptureTab() { renderCapture(); }
  function deviceSvg(type) {
    if (isEndDevice(type)) return '<svg viewBox="0 0 48 40" aria-hidden="true"><rect x="5" y="4" width="38" height="25" rx="3" fill="#e8eef5" stroke="#33485e" stroke-width="2"/><path d="M19 30v5m10-5v5m-15 1h30" fill="none" stroke="#33485e" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="24" r="1.5" fill="#53b779"/></svg>';
    if (type === "switch") return '<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M5 11h38v20H5z" rx="3" fill="#d9e3ed" stroke="#33485e" stroke-width="2"/><path d="M11 18h5m4 0h5m4 0h5m4 0h3M11 25h5m4 0h5m4 0h5m4 0h3" stroke="#33485e" stroke-width="2" stroke-linecap="round"/><path d="m17 6 3-3m-3 3 3 3m11-3-3-3m3 3-3 3" fill="none" stroke="#2777c8" stroke-width="2" stroke-linecap="round"/></svg>';
    if (type === "hub") return '<svg viewBox="0 0 48 40" aria-hidden="true"><rect x="5" y="10" width="38" height="22" rx="4" fill="#d9e3ed" stroke="#33485e" stroke-width="2"/><circle cx="13" cy="21" r="2" fill="#2777c8"/><circle cx="21" cy="21" r="2" fill="#2777c8"/><circle cx="29" cy="21" r="2" fill="#2777c8"/><circle cx="37" cy="21" r="2" fill="#2777c8"/><path d="M24 3v6m-4-3h8" stroke="#33485e" stroke-width="2" stroke-linecap="round"/></svg>';
    return '<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M24 3 43 20 24 37 5 20z" fill="#d9e3ed" stroke="#33485e" stroke-width="2"/><path d="M14 17h18m-4-4 4 4-4 4M34 23H16m4 4-4-4 4-4" fill="none" stroke="#2777c8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function updateDeviceDom() {
    invalidateStp();
    canvas.querySelectorAll(".device").forEach((node) => node.remove());
    state.devices.forEach((device) => {
      const node = document.createElement("div");
      const activePacket = state.events.find((event) => event.type === "ICMP" && event.status.startsWith("At ") && event.route?.[event.hopIndex] === device.id);
      node.className = "device" + (state.selected === device.id ? " selected" : "") + (state.connectFrom === device.id ? " pending" : "") + (activePacket ? " packet-current" : "");
      node.dataset.id = device.id;
      node.style.left = device.x + "%";
      node.style.top = device.y + "%";
      const activeIp = Object.values(device.interfaces).find((port) => port.ip);
      node.innerHTML = deviceSvg(device.type) + '<span class="device-name"></span><span class="device-ip"></span>';
      node.querySelector(".device-name").textContent = device.name;
      node.querySelector(".device-ip").textContent = isEndDevice(device.type) ? (activeIp ? activeIp.ip + "/" + activeIp.prefix : "Unconfigured") : deviceTypeLabel[device.type];
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.setAttribute("aria-label", device.name + ", " + deviceTypeLabel[device.type] + (activeIp ? ", " + activeIp.ip : ""));
      node.addEventListener("pointerdown", (event) => startDrag(event, device, node));
      node.addEventListener("click", (event) => {
        event.stopPropagation();
        if (state.connectMode) { chooseConnectionDevice(device); return; }
        selectDevice(device.id);
      });
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (state.connectMode) chooseConnectionDevice(device); else selectDevice(device.id); }
      });
      canvasContent.appendChild(node);
      const maxX = Math.max(0, (state.baseWidth - node.offsetWidth) / state.baseWidth * 100);
      const maxY = Math.max(0, (state.baseHeight - node.offsetHeight) / state.baseHeight * 100);
      device.x = Math.min(maxX, Math.max(0, device.x));
      device.y = Math.min(maxY, Math.max(0, device.y));
      node.style.left = device.x + "%";
      node.style.top = device.y + "%";
    });
    $("#emptyCanvas").hidden = state.devices.length > 0;
    renderLinks();
    updateButtons();
  }
  function interfacePoint(device, port) {
    const nodeFor = (id) => [...canvas.querySelectorAll(".device")].find((node) => node.dataset.id === id);
    const node = nodeFor(device.id);
    const nodeWidth = node?.offsetWidth || 92, nodeHeight = node?.offsetHeight || 78;
    let x = device.x / 100 * state.baseWidth + nodeWidth / 2;
    let y = device.y / 100 * state.baseHeight + nodeHeight / 2;
    const peers = getLinksFor(device.id, port);
    if (peers.length) {
      const link = peers[0], peerId = link.a.deviceId === device.id ? link.b.deviceId : link.a.deviceId;
      const peer = getDevice(peerId);
      if (peer) {
        const peerNode = nodeFor(peer.id);
        const peerWidth = peerNode?.offsetWidth || 92, peerHeight = peerNode?.offsetHeight || 78;
        const px = peer.x / 100 * state.baseWidth + peerWidth / 2, py = peer.y / 100 * state.baseHeight + peerHeight / 2;
        const dx = px - x, dy = py - y, scale = Math.max(Math.abs(dx) / (nodeWidth / 2), Math.abs(dy) / (nodeHeight / 2), 1);
        x += dx / scale; y += dy / scale;
      }
    }
    return { x, y };
  }
  function renderLinks() {
    if (!state.baseWidth || !state.baseHeight) return;
    linkSvg.setAttribute("viewBox", "0 0 " + state.baseWidth + " " + state.baseHeight);
    linkSvg.setAttribute("width", state.baseWidth);
    linkSvg.setAttribute("height", state.baseHeight);
    linkSvg.replaceChildren();
    state.links.forEach((link) => {
      const a = getDevice(link.a.deviceId), b = getDevice(link.b.deviceId);
      if (!a || !b) return;
      const p1 = interfacePoint(a, link.a.port), p2 = interfacePoint(b, link.b.port);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y); line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      line.setAttribute("class", "link-line");
      line.dataset.linkId = link.id;
      if (state.selectedLink === link.id) line.classList.add("selected");
      line.addEventListener("click", (event) => {
        event.stopPropagation();
        state.selectedLink = link.id;
        state.selected = null;
        $(".inspector").classList.remove("open");
        updateDeviceDom();
        setStatus(a.name + " " + link.a.port + " ↔ " + b.name + " " + link.b.port + " selected. Delete selected removes this cable.");
      });
      linkSvg.appendChild(line);
    });
  }
  function startDrag(event, device, node) {
    if (event.button !== 0 || state.connectMode) return;
    event.stopPropagation();
    selectDevice(device.id);
    const zoom = state.zoom;
    const startX = event.clientX, startY = event.clientY, initialX = device.x, initialY = device.y;
    node.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const maxX = Math.max(0, (state.baseWidth - node.offsetWidth) / state.baseWidth * 100);
      const maxY = Math.max(0, (state.baseHeight - node.offsetHeight) / state.baseHeight * 100);
      device.x = Math.min(maxX, Math.max(0, initialX + (moveEvent.clientX - startX) / zoom / state.baseWidth * 100));
      device.y = Math.min(maxY, Math.max(0, initialY + (moveEvent.clientY - startY) / zoom / state.baseHeight * 100));
      node.style.left = device.x + "%"; node.style.top = device.y + "%"; renderLinks();
    };
    const finish = () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", finish);
      node.removeEventListener("pointercancel", finish);
      persist(false);
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", finish, { once: true });
    node.addEventListener("pointercancel", finish, { once: true });
  }
  function updateButtons() {
    updatePduDestinations();
    const source = getDevice(state.selected);
    const canOriginatePdu = source && isEndDevice(source.type) && Object.values(source.interfaces).some((port) => port.up && ipToInt(port.ip) !== null);
    $("#pduDestination").disabled = !canOriginatePdu;
    $("#deleteButton").disabled = !state.selected && !state.selectedLink;
    $("#deleteButton").textContent = state.selectedLink ? "Delete cable" : "Delete device";
    $("#pingButton").disabled = !canOriginatePdu || !$("#pduDestination").value;
    $("#connectToolbar").classList.toggle("tool-active", state.connectMode);
    $("#connectToolbar").setAttribute("aria-pressed", String(state.connectMode));
    canvas.classList.toggle("connect-mode", state.connectMode);
  }
  function selectDevice(id) {
    state.selected = id;
    state.selectedLink = null;
    state.cliMode = "user"; state.cliInterface = null;
    $(".inspector").classList.add("open");
    canvas.querySelectorAll(".device").forEach((node) => node.classList.toggle("selected", node.dataset.id === id));
    updateButtons();
    populateConfiguration();
    $("#devicePanelTitle").textContent = (getDevice(id)?.name || "Device") + " configuration";
    switchPanel("config");
    renderCliHeader();
  }
  function updatePduDestinations() {
    const select = $("#pduDestination");
    const previous = select.value;
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = ""; placeholder.textContent = "Select a destination"; select.appendChild(placeholder);
    const source = getDevice(state.selected);
    state.devices.filter((device) => isEndDevice(device.type) && device.id !== source?.id && Object.values(device.interfaces).some((port) => port.up && ipToInt(port.ip) !== null))
      .forEach((device) => {
        const port = Object.values(device.interfaces).find((item) => item.up && item.ip);
        const option = document.createElement("option");
        option.value = port.ip; option.textContent = device.name + " · " + port.ip; select.appendChild(option);
      });
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
  }
  function findTopologyPath(source, destinationIp) {
    const sourcePort = Object.entries(source.interfaces).find(([, port]) => port.up && port.ip);
    const destination = state.devices.find((device) => isEndDevice(device.type) && Object.values(device.interfaces).some((port) => port.up && port.ip === destinationIp));
    const destinationPort = destination && Object.entries(destination.interfaces).find(([, port]) => port.up && port.ip === destinationIp);
    if (!sourcePort || !destination || !destinationPort) return [source.id];
    const firstPeer = getLinkPeer(source.id, sourcePort[0]);
    const initialVlan = firstPeer?.device?.type === "switch" ? firstPeer.device.interfaces[firstPeer.port].vlan : 1;
    const queue = [{ id: source.id, vlan: initialVlan, path: [source.id] }];
    const seen = new Set();
    while (queue.length) {
      const current = queue.shift();
      const key = current.id + ":" + current.vlan;
      if (seen.has(key)) continue;
      seen.add(key);
      const currentDevice = getDevice(current.id);
      if (!currentDevice) continue;
      for (const [portName, config] of Object.entries(currentDevice.interfaces)) {
        if (!config.up) continue;
        if (currentDevice.type === "switch" && config.vlan !== current.vlan) continue;
        const peer = getLinkPeer(current.id, portName);
        if (!peer?.device || !peer.device.interfaces[peer.port]?.up) continue;
        const next = peer.device;
        if (next.id === destination.id && peer.port === destinationPort[0]) return current.path.concat(next.id);
        if (next.type === "switch" && currentDevice.type !== "router" && next.interfaces[peer.port].vlan !== current.vlan) continue;
        if (!["switch", "hub", "router"].includes(next.type)) continue;
        const nextVlan = next.type === "switch" ? next.interfaces[peer.port].vlan : current.vlan;
        if (!seen.has(next.id + ":" + nextVlan)) queue.push({ id: next.id, vlan: nextVlan, path: current.path.concat(next.id) });
      }
    }
    return [source.id];
  }
  function populateConfiguration() {
    const device = getDevice(state.selected);
    $("#configForm").hidden = !device;
    $("#configIntro").hidden = !!device;
    $("#configCheckResult").hidden = true;
    if (!device) return;
    $("#deviceName").value = device.name;
    const ports = Object.keys(device.interfaces);
    const select = $("#interfaceSelect");
    const selectedPort = select.value;
    select.replaceChildren(...ports.map((port) => { const option = document.createElement("option"); option.value = port; option.textContent = port; return option; }));
    select.value = device.interfaces[selectedPort] ? selectedPort : ports[0];
    $("#interfaceField").hidden = isEndDevice(device.type);
    $("#gatewayField").hidden = !isEndDevice(device.type);
    $("#switchFields").hidden = device.type !== "switch";
    const port = device.interfaces[select.value || ports[0]];
    $("#addressField").hidden = device.type === "hub";
    $("#deviceIp").value = port.ip;
    $("#devicePrefix").value = port.prefix;
    $("#deviceVlan").value = port.vlan;
    $("#devicePortMode").value = port.mode || "access";
    $("#trunkFields").hidden = port.mode !== "trunk";
    $("#deviceAllowed").value = Array.isArray(port.allowed) ? port.allowed.join(",") : "";
    $("#deviceNative").value = port.native || 1;
    $("#powerButton").textContent = port.up ? "Shut down interface" : "Enable interface";
    $("#powerButton").disabled = isEndDevice(device.type);
    $("#deviceGateway").value = device.gateway || "";
  }
  function checkSelectedConfiguration() {
    const device = getDevice(state.selected);
    if (!device) return;
    const checks = [];
    const check = (label, ok, detail) => checks.push({ label, ok, detail });
    const ports = Object.entries(device.interfaces);
    const configuredPorts = ports.filter(([, port]) => port.ip);
    check("Device name", !!device.name.trim(), device.name || "Name is empty.");
    if (device.type !== "hub") {
      if (isEndDevice(device.type) && !configuredPorts.length) {
        check("IPv4 address", false, "Configure an IPv4 address and prefix.");
      }
      configuredPorts.forEach(([portName, port]) => {
        check(portName + " IPv4/prefix", ipToInt(port.ip) !== null && validPrefix(port.prefix), port.ip + "/" + port.prefix);
        const duplicate = state.devices.some((candidate) => candidate.id !== device.id &&
          Object.values(candidate.interfaces).some((otherPort) => otherPort.ip && otherPort.ip === port.ip));
        check(portName + " unique address", !duplicate, duplicate ? port.ip + " is also configured on another device." : "No duplicate address found.");
      });
    }
    const selectedPortName = $("#interfaceSelect").value;
    const selectedPort = device.interfaces[selectedPortName];
    if (selectedPort) {
      const peer = getLinkPeer(device.id, selectedPortName);
      check(selectedPortName + " cable", !!peer?.device, peer?.device ? "Connected to " + peer.device.name + " " + peer.port + "." : "This interface has no cable.");
      check(selectedPortName + " interface state", !!selectedPort.up, selectedPort.up ? "Interface is enabled." : "Interface is shut down.");
    }
    if (device.type === "switch" && selectedPort) {
      const peer = getLinkPeer(device.id, selectedPortName);
      if (peer?.device && isEndDevice(peer.device.type)) {
        const hostPort = peer.device.interfaces[peer.port];
        const vlanMatches = selectedPort.vlan >= 1 && selectedPort.vlan <= 4094;
        check("Access VLAN", vlanMatches, "Port is assigned to VLAN " + selectedPort.vlan + ".");
        check("Host link", !!hostPort.up, hostPort.up ? peer.device.name + " interface is enabled." : peer.device.name + " interface is disabled.");
      }
    }
    if (isEndDevice(device.type)) {
      const hostPort = configuredPorts[0]?.[1];
      if (device.gateway) {
        const gatewayValid = ipToInt(device.gateway) !== null;
        const gatewayInSubnet = gatewayValid && hostPort && sameSubnet(hostPort.ip, hostPort.prefix, device.gateway, 32);
        check("Default gateway address", gatewayValid, gatewayValid ? device.gateway : "Enter a valid IPv4 address.");
        check("Gateway subnet", !!gatewayInSubnet, gatewayInSubnet ? "Gateway is in the host subnet." : "Gateway should be in the host's local subnet.");
        const reachableRouter = state.devices.some((router) => router.type === "router" && Object.entries(router.interfaces).some(([routerPortName, routerPort]) =>
          routerPort.up && routerPort.ip === device.gateway && getLinksFor(router.id, routerPortName).length > 0 &&
          getLinkPeer(device.id, Object.keys(device.interfaces)[0])?.device &&
          hasLayer2Path(device.id, Object.keys(device.interfaces)[0], router.id, routerPortName,
            getLinkPeer(device.id, Object.keys(device.interfaces)[0]).device.type === "switch"
              ? getLinkPeer(device.id, Object.keys(device.interfaces)[0]).device.interfaces[getLinkPeer(device.id, Object.keys(device.interfaces)[0]).port].vlan : 1)));
        check("Gateway reachability", reachableRouter, reachableRouter ? "A router interface with this address is connected on the simulated Layer-2 path." : "No matching reachable router interface was found in the topology.");
      }
      const otherHost = state.devices.find((candidate) => isEndDevice(candidate.type) && candidate.id !== device.id &&
        Object.values(candidate.interfaces).some((port) => port.up && port.ip));
      if (otherHost && hostPort) {
        const otherIp = Object.values(otherHost.interfaces).find((port) => port.up && port.ip).ip;
        const ping = canPing(device, otherIp);
        check("Ping to " + otherHost.name, ping.ok, ping.reason);
      }
    }
    const result = $("#configCheckResult");
    const passed = checks.every((item) => item.ok);
    result.replaceChildren();
    const heading = document.createElement("strong");
    heading.textContent = passed ? "Supported checks passed" : "Configuration needs attention";
    result.appendChild(heading);
    const list = document.createElement("ul");
    checks.forEach((item) => {
      const row = document.createElement("li");
      row.textContent = (item.ok ? "PASS — " : "CHECK — ") + item.label + ": " + item.detail;
      list.appendChild(row);
    });
    result.appendChild(list);
    const note = document.createElement("p");
    note.textContent = "This checks modeled browser settings only. It does not verify trunks, STP, OSPF/BGP, ACL/NAT, DHCP/DNS, packet captures, or automation.";
    result.appendChild(note);
    result.className = "guide-result " + (passed ? "status-good" : "status-bad");
    result.hidden = false;
  }
  function ipToInt(ip) {
    if (typeof ip !== "string" || !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) return null;
    const parts = ip.split(".").map(Number);
    if (parts.some((part) => part < 0 || part > 255)) return null;
    return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
  }
  function validPrefix(prefix) { return Number.isInteger(Number(prefix)) && Number(prefix) >= 0 && Number(prefix) <= 32; }
  function maskFor(prefix) { return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0; }
  function intToIp(value) {
    const number = Number(value) >>> 0;
    return [24, 16, 8, 0].map((shift) => (number >>> shift) & 255).join(".");
  }
  function sameSubnet(ipA, prefixA, ipB, prefixB) {
    const a = ipToInt(ipA), b = ipToInt(ipB);
    const prefixAValue = Number(prefixA), prefixBValue = Number(prefixB);
    if (a === null || b === null || !Number.isInteger(prefixAValue) || prefixAValue < 0 || prefixAValue > 32 ||
      !Number.isInteger(prefixBValue) || prefixBValue < 0 || prefixBValue > 32) return false;
    const mask = maskFor(Math.min(prefixAValue, prefixBValue));
    return (a & mask) === (b & mask);
  }
  function prefixForMask(mask) {
    const value = ipToInt(mask);
    if (value === null) return null;
    const binary = value.toString(2).padStart(32, "0");
    if (!/^1*0*$/.test(binary)) return null;
    return (binary.match(/1/g) || []).length;
  }
  function applyConfiguration() {
    const device = getDevice(state.selected);
    if (!device) return;
    const name = $("#deviceName").value.trim();
    if (!name) { setStatus("Device name cannot be empty.", "bad"); return; }
    const portName = $("#interfaceSelect").value;
    const port = device.interfaces[portName];
    const ip = $("#deviceIp").value.trim();
    const prefix = Number($("#devicePrefix").value);
    if (ip && (ipToInt(ip) === null || !validPrefix(prefix))) { setStatus("Enter a valid IPv4 address and prefix from 0 to 32.", "bad"); return; }
    let gateway = device.gateway;
    let vlan = port.vlan;
    let mode = port.mode, allowed = port.allowed, native = port.native;
    if (isEndDevice(device.type)) {
      gateway = $("#deviceGateway").value.trim();
      if (gateway && ipToInt(gateway) === null) { setStatus("Enter a valid IPv4 default gateway.", "bad"); return; }
    } else if (device.type === "switch") {
      vlan = Number($("#deviceVlan").value);
      if (!Number.isInteger(vlan) || vlan < 1 || vlan > 4094) { setStatus("VLAN must be a number from 1 to 4094.", "bad"); return; }
      mode = $("#devicePortMode").value === "trunk" ? "trunk" : "access";
      const allowedRaw = $("#deviceAllowed").value.trim();
      if (mode === "trunk" && allowedRaw && allowedRaw.toLowerCase() !== "all") {
        const ids = allowedRaw.split(/[,\s]+/).map(Number).filter((id) => Number.isInteger(id) && id >= 1 && id <= 4094);
        if (!ids.length) { setStatus("Allowed VLANs must be a comma-separated list of VLAN IDs or empty for all.", "bad"); return; }
        allowed = ids;
      } else {
        allowed = null;
      }
      native = Number($("#deviceNative").value) || 1;
      if (native < 1 || native > 4094) { setStatus("Native VLAN must be a number from 1 to 4094.", "bad"); return; }
    }
    device.name = name;
    if (ip) { port.ip = ip; port.prefix = prefix; } else { port.ip = ""; }
    if (isEndDevice(device.type)) {
      device.gateway = gateway;
      port.up = true;
    } else if (device.type === "switch") {
      port.vlan = vlan;
      port.mode = mode;
      port.allowed = mode === "trunk" ? allowed : null;
      port.native = native || 1;
    }
    updateDeviceDom(); populateConfiguration(); $("#devicePanelTitle").textContent = device.name + " configuration"; persist();
    setStatus("Configuration applied to " + device.name + ".", "good");
  }
  function availablePort(device) {
    return Object.keys(device.interfaces).find((port) => getLinksFor(device.id, port).length === 0);
  }
  function toggleConnectMode() {
    state.connectMode = !state.connectMode;
    state.connectFrom = null;
    updateDeviceDom();
    setStatus(state.connectMode ? "Select the first device to connect." : "Cable tool closed.");
  }
  function chooseConnectionDevice(device) {
    if (!state.connectFrom) {
      state.connectFrom = device.id;
      updateDeviceDom();
      setStatus("Select a second, different device.");
      return;
    }
    const first = getDevice(state.connectFrom);
    if (!first || first.id === device.id) { setStatus("Choose a different device for the other end of the cable.", "bad"); return; }
    const portA = availablePort(first), portB = availablePort(device);
    if (!portA || !portB) { state.connectFrom = null; state.connectMode = false; updateDeviceDom(); setStatus("No free interface is available on one of those devices.", "bad"); return; }
    state.links.push({ id: safeId("link"), a: { deviceId: first.id, port: portA }, b: { deviceId: device.id, port: portB } });
    state.connectFrom = null; state.connectMode = false;
    updateDeviceDom(); updateButtons(); persist(); setStatus("Devices connected.");
  }
  function removeSelected() {
    if (state.selectedLink) {
      const link = state.links.find((item) => item.id === state.selectedLink);
      state.links = state.links.filter((item) => item.id !== state.selectedLink);
      state.selectedLink = null;
      updateDeviceDom(); persist();
      setStatus(link ? "Cable between " + getDevice(link.a.deviceId)?.name + " and " + getDevice(link.b.deviceId)?.name + " deleted." : "Cable deleted.");
      return;
    }
    if (!state.selected) return;
    const device = getDevice(state.selected);
    state.devices = state.devices.filter((item) => item.id !== state.selected);
    state.links = state.links.filter((link) => link.a.deviceId !== state.selected && link.b.deviceId !== state.selected);
    state.selected = null;
    updateDeviceDom(); populateConfiguration(); updateButtons(); persist();
    setStatus((device ? device.name : "Device") + " deleted.");
  }
  function arrangeTopology() {
    const count = state.devices.length;
    if (!count) { setStatus("Add devices before arranging the topology."); return; }
    const columns = Math.max(1, Math.ceil(Math.sqrt(count * (state.baseWidth / Math.max(state.baseHeight, 1)))));
    const rows = Math.ceil(count / columns);
    const maxX = Math.max(0, (state.baseWidth - 92) / state.baseWidth * 100);
    const maxY = Math.max(0, (state.baseHeight - 88) / state.baseHeight * 100);
    const startX = Math.min(4, maxX / 2), endX = Math.max(startX, maxX - Math.min(4, maxX - startX));
    const startY = Math.min(8, maxY / 2), endY = Math.max(startY, maxY - Math.min(8, maxY - startY));
    state.devices.forEach((device, index) => {
      const col = index % columns, row = Math.floor(index / columns);
      device.x = columns === 1 ? maxX / 2 : startX + col / (columns - 1) * (endX - startX);
      device.y = rows === 1 ? maxY / 2 : startY + row / (rows - 1) * (endY - startY);
    });
    updateDeviceDom(); persist(false); setStatus("Topology arranged to fit the workspace.", "good");
    fitWorkspaceView();
    setStatus("Topology arranged and fitted to the workspace.", "good");
  }
  function clientToWorkspacePercent(clientX, clientY) {
    const viewport = canvasViewport || document.querySelector("#canvasViewport") || document.querySelector("#canvas");
    if (!viewport) return { x: 50, y: 50 };
    const rect = viewport.getBoundingClientRect();
    const x = (clientX - rect.left + (viewport.scrollLeft || 0) - (state.offsetX || 0)) / (state.zoom || 1);
    const y = (clientY - rect.top + (viewport.scrollTop || 0) - (state.offsetY || 0)) / (state.zoom || 1);
    return {
      x: Math.max(0, Math.min(100, (x / (state.baseWidth || 1100)) * 100)),
      y: Math.max(0, Math.min(100, (y / (state.baseHeight || 680)) * 100))
    };
  }
  if (typeof window._labAddCount !== "number") window._labAddCount = 0;
  function addDevice(type, px, py) {
    const n = state.devices.length;
    let pos;
    const viewport = canvasViewport || document.querySelector("#canvasViewport") || document.querySelector("#canvas");
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      pos = clientToWorkspacePercent(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      pos = { x: 50, y: 50 };
    }
    if (typeof px === "number" && typeof py === "number") {
      const p2 = clientToWorkspacePercent(px, py);
      if (p2.x !== 50 || p2.y !== 50) {
        pos.x = p2.x; pos.y = p2.y;
      }
    }
    const idx = window._labAddCount++;
    pos.x = pos.x + (idx % 2) * 16 - 8;
    pos.y = pos.y + Math.floor(idx / 2) * 16 - 8;
    pos.x = Math.max(12, Math.min(88, pos.x));
    pos.y = Math.max(12, Math.min(88, pos.y));
    const device = newDevice(type, (deviceTypeLabel[type] || "Device") + (n + 1), pos.x, pos.y);
    state.devices.push(device);
    updateDeviceDom();
    selectDevice(device.id);
    persist(false);
    setStatus(device.name + " added. Drag it to move.", "good");
  }
  function getLinkPeer(deviceId, portName) {
    const link = getLinksFor(deviceId, portName)[0];
    if (!link) return null;
    const endpoint = link.a.deviceId === deviceId && link.a.port === portName ? link.b : link.a;
    return { device: getDevice(endpoint.deviceId), port: endpoint.port };
  }
  // ---- Packet capture -------------------------------------------------
  function logFrame(frame) {
    state.frames.unshift(Object.assign({ id: safeId("f"), time: (state.frames.length + 1) * 0.002, length: 64 }, frame));
    state.frames = state.frames.slice(0, 600);
    renderCapture();
  }
  function sourceMac(device) { return simulatedMac(device.id); }
  function arpEntry(device, ip) {
    const entry = device.arp[ip];
    if (!entry) return null;
    return entry;
  }
  function learnArp(device, ip, peerDevice, peerPort, vlan) {
    if (!ip || !peerDevice) return;
    device.arp[ip] = { mac: sourceMac(peerDevice), port: peerPort, vlan: vlan || 1, deviceId: peerDevice.id };
  }
  function arpFor(device, ip, vlan) {
    if (device.arp[ip]) return device.arp[ip];
    state.devices.forEach((candidate) => {
      Object.entries(candidate.interfaces).forEach(([port, config]) => {
        if (config.up && config.ip === ip) learnArp(device, ip, candidate, port, vlan);
      });
    });
    return device.arp[ip] || null;
  }
  // ---- Spanning tree (IEEE 802.1D, simplified) -------------------------
  let stpCache = null;
  function invalidateStp() { stpCache = null; }
  function bridgeKey(device) {
    const mac = simulatedMac(device.id).replace(/:/g, "");
    return (device.stp?.priority || 32768) * 65536 + (parseInt(mac.slice(-4), 16) || 1);
  }
  function switchLinkGraph() {
    const graph = new Map();
    state.devices.filter((device) => device.type === "switch").forEach((sw) => graph.set(sw.id, []));
    state.links.forEach((link) => {
      const a = getDevice(link.a.deviceId), b = getDevice(link.b.deviceId);
      if (!a || !b || a.type !== "switch" || b.type !== "switch") return;
      if (!a.interfaces[link.a.port]?.up || !b.interfaces[link.b.port]?.up) return;
      graph.get(a.id).push({ id: b.id, port: link.a.port, peerPort: link.b.port, cost: 4 });
      graph.get(b.id).push({ id: a.id, port: link.b.port, peerPort: link.a.port, cost: 4 });
    });
    return graph;
  }
  function stpState() {
    if (stpCache) return stpCache;
    const graph = switchLinkGraph();
    const result = { roots: new Map(), cost: new Map(), bridge: new Map(), parent: new Map(), blocked: new Set(), roles: new Map(), rootId: null };
    state.devices.filter((device) => device.type === "switch").forEach((sw) => {
      result.bridge.set(sw.id, bridgeKey(sw));
      result.roles.set(sw.id, {});
    });
    const seen = new Set();
    [...graph.keys()].forEach((start) => {
      if (seen.has(start)) return;
      const component = [], queue = [start];
      seen.add(start);
      while (queue.length) {
        const id = queue.shift();
        component.push(id);
        graph.get(id).forEach((edge) => { if (!seen.has(edge.id)) { seen.add(edge.id); queue.push(edge.id); } });
      }
      const rootId = component.reduce((best, id) => (result.bridge.get(id) < result.bridge.get(best) ? id : best), component[0]);
      const dist = new Map([[rootId, 0]]), parent = new Map(), order = [rootId];
      while (order.length) {
        const id = order.shift();
        graph.get(id).forEach((edge) => {
          const candidate = dist.get(id) + edge.cost;
          const known = dist.get(edge.id);
          const betterTie = known === candidate && result.bridge.get(id) < (parent.get(edge.id)?.bridge ?? Infinity);
          if (known === undefined || candidate < known || betterTie) {
            dist.set(edge.id, candidate);
            parent.set(edge.id, { id, port: edge.peerPort, bridge: result.bridge.get(id) });
            if (!order.includes(edge.id)) order.push(edge.id);
          }
        });
      }
      component.forEach((id) => {
        result.cost.set(id, dist.get(id));
        result.parent.set(id, parent.get(id) || null);
        result.roots.set(id, rootId);
      });
      component.forEach((id) => { result.roles.get(id).rootPort = parent.get(id)?.port || null; });
      state.links.forEach((link) => {
        const a = getDevice(link.a.deviceId), b = getDevice(link.b.deviceId);
        if (!a || !b || a.type !== "switch" || b.type !== "switch") return;
        if (!component.includes(a.id) || !component.includes(b.id)) return;
        if (!a.interfaces[link.a.port]?.up || !b.interfaces[link.b.port]?.up) return;
        const claimA = [result.cost.get(a.id), result.bridge.get(a.id)];
        const claimB = [result.cost.get(b.id), result.bridge.get(b.id)];
        const aBetter = claimA[0] < claimB[0] || (claimA[0] === claimB[0] && claimA[1] < claimB[1]);
        const winner = aBetter ? { device: a, port: link.a.port } : { device: b, port: link.b.port };
        const loser = aBetter ? { device: b, port: link.b.port } : { device: a, port: link.a.port };
        result.roles.get(winner.device.id)[winner.port] = "Designated";
        if (result.parent.get(loser.device.id)?.port === loser.port) result.roles.get(loser.device.id)[loser.port] = "Root";
        else { result.blocked.add(loser.device.id + ":" + loser.port); result.roles.get(loser.device.id)[loser.port] = "Blocked"; }
      });
      component.forEach((id) => {
        const roles = result.roles.get(id);
        Object.keys(getDevice(id).interfaces).forEach((port) => { if (!roles[port]) roles[port] = "Designated"; });
      });
    });
    stpCache = result;
    return result;
  }
  // ---- Layer 2 forwarding: access ports, trunks, STP -------------------
  function trunkAllows(port, vlan) {
    if (!port) return false;
    if (port.mode !== "trunk") return port.vlan === vlan;
    if (port.allowed && !port.allowed.includes(vlan)) return false;
    return true;
  }
  function portBlockedByStp(device, portName) {
    if (device.type !== "switch") return false;
    const peer = getLinkPeer(device.id, portName);
    if (peer?.device?.type !== "switch") return false;
    return stpState().blocked.has(device.id + ":" + portName);
  }
  function hostVlan(device, portName) {
    const port = device.interfaces[portName];
    if (!port) return 1;
    if (device.type === "router" && portName.includes(".")) return port.vlan || 1;
    const peer = getLinkPeer(device.id, portName);
    if (peer?.device?.type === "switch") {
      const switchPort = peer.device.interfaces[peer.port];
      if (switchPort.mode === "trunk") return switchPort.native || 1;
      return switchPort.vlan || 1;
    }
    return 1;
  }
  function hasLayer2Path(startId, startPort, targetId, targetPort, vlan) {
    const startDevice = getDevice(startId);
    if (!startDevice) return false;
    let currentVlan = vlan;
    let startPhysical = startPort;
    if (startPort.includes(".") && startDevice.interfaces[startPort]) {
      currentVlan = startDevice.interfaces[startPort].vlan || 1;
      startPhysical = startPort.split(".")[0];
    }
    const stp = stpState();
    const queue = [{ deviceId: startId, port: startPhysical, vlan: currentVlan }];
    const seen = new Set();
    while (queue.length) {
      const current = queue.shift(), key = current.deviceId + ":" + current.port + ":" + current.vlan;
      if (seen.has(key)) continue;
      seen.add(key);
      const peer = getLinkPeer(current.deviceId, current.port);
      if (!peer || !peer.device) continue;
      const peerPort = peer.device.interfaces[peer.port];
      if (!peerPort || !peerPort.up) continue;
      const logicalParent = targetPort.includes(".") ? targetPort.split(".")[0] : null;
      if (peer.device.id === targetId && (peer.port === targetPort ||
        (logicalParent && peer.port === logicalParent && (peer.device.interfaces[targetPort]?.vlan || 1) === current.vlan))) return true;
      if (peer.device.type !== "switch" && peer.device.type !== "hub") continue;
      if (peer.device.type === "switch" && !trunkAllows(peerPort, current.vlan)) continue;
      if (stp.blocked.has(peer.device.id + ":" + peer.port)) continue;
      Object.entries(peer.device.interfaces).forEach(([otherPort, config]) => {
        if (otherPort === peer.port || !config.up) return;
        if (peer.device.type === "switch" && !trunkAllows(config, current.vlan)) return;
        if (stp.blocked.has(peer.device.id + ":" + otherPort)) return;
        queue.push({ deviceId: peer.device.id, port: otherPort, vlan: current.vlan });
      });
    }
    return false;
  }
  function routerCanReach(router, targetIp, visited) {
    if (visited.has(router.id)) return false;
    const nextVisited = new Set(visited); nextVisited.add(router.id);
    const interfaces = Object.entries(router.interfaces).filter(([, port]) => port.up && port.ip);
    const targetEndpoint = state.devices.flatMap((device) => Object.entries(device.interfaces).filter(([, port]) => port.up && port.ip === targetIp).map(([portName]) => ({ device, port: portName })));
    if (!targetEndpoint.length) return false;
    if (interfaces.some(([routerPort, config]) => sameSubnet(config.ip, config.prefix, targetIp, 32) &&
      targetEndpoint.some((endpoint) => hasLayer2Path(router.id, routerPort, endpoint.device.id, endpoint.port, config.vlan)))) return true;
    const matchingRoutes = router.routes.filter((route) => sameSubnet(route.network, route.prefix, targetIp, route.prefix));
    const longestPrefix = matchingRoutes.reduce((longest, route) => Math.max(longest, route.prefix), -1);
    const routes = matchingRoutes.filter((route) => route.prefix === longestPrefix);
    for (const route of routes) {
      for (const [outPort, outConfig] of interfaces) {
        if (!sameSubnet(outConfig.ip, outConfig.prefix, route.nextHop, 32)) continue;
        const neighbors = state.devices.filter((device) => device.type === "router" && device.id !== router.id);
        for (const neighbor of neighbors) {
          const neighborPort = Object.entries(neighbor.interfaces).find(([, config]) => config.up && config.ip && sameSubnet(config.ip, config.prefix, route.nextHop, 32));
          if (neighborPort && neighborPort[1].ip === route.nextHop && hasLayer2Path(router.id, outPort, neighbor.id, neighborPort[0], outConfig.vlan) &&
            routerCanReach(neighbor, targetIp, nextVisited)) return true;
        }
      }
    }
    return false;
  }
  function canPing(source, destinationIp) {
    if (!isEndDevice(source.type)) return { ok: false, reason: "Select a PC, laptop, or server to originate a ping." };
    const sourcePort = Object.entries(source.interfaces).find(([, port]) => port.up && port.ip);
    if (!sourcePort || ipToInt(sourcePort[1].ip) === null) return { ok: false, reason: "Source PC has no valid IPv4 address." };
    const destination = state.devices.find((device) => Object.values(device.interfaces).some((port) => port.up && port.ip === destinationIp));
    if (!destination) return { ok: false, reason: "No configured PC uses " + destinationIp + "." };
    const destPort = Object.entries(destination.interfaces).find(([, port]) => port.up && port.ip === destinationIp);
    const sourceIp = sourcePort[1].ip;
    if (sameSubnet(sourceIp, sourcePort[1].prefix, destinationIp, destPort[1].prefix)) {
      const sourceSwitch = getLinkPeer(source.id, sourcePort[0]);
      const vlan = sourceSwitch && sourceSwitch.device.type === "switch" ? sourceSwitch.device.interfaces[sourceSwitch.port].vlan : 1;
      return hasLayer2Path(source.id, sourcePort[0], destination.id, destPort[0], vlan)
        ? { ok: true, reason: "Same subnet and Layer-2 path is available." }
        : { ok: false, reason: "No Layer-2 path. Check cables and switch access VLANs." };
    }
    const destinationIsRouter = destination.type === "router";
    if (!source.gateway || !sameSubnet(sourceIp, sourcePort[1].prefix, source.gateway, 32)) return { ok: false, reason: "Source PC needs a reachable default gateway for this remote subnet." };
    if (!destinationIsRouter && (!destination.gateway || !sameSubnet(destinationIp, destPort[1].prefix, destination.gateway, 32))) return { ok: false, reason: "Destination PC needs a default gateway in its subnet." };
    const sourcePeer = getLinkPeer(source.id, sourcePort[0]);
    const destinationPeer = getLinkPeer(destination.id, destPort[0]);
    const sourceVlan = sourcePeer && sourcePeer.device.type === "switch" ? sourcePeer.device.interfaces[sourcePeer.port].vlan : 1;
    const destinationVlan = destinationPeer && destinationPeer.device.type === "switch" ? destinationPeer.device.interfaces[destinationPeer.port].vlan : 1;
    const sourceEdge = state.devices.filter((device) => device.type === "router" && Object.entries(device.interfaces).some(([port, cfg]) =>
      cfg.up && cfg.ip === source.gateway && hasLayer2Path(source.id, sourcePort[0], device.id, port, sourceVlan)));
    const destinationEdge = destinationIsRouter ? [destination] : state.devices.filter((device) => device.type === "router" && Object.entries(device.interfaces).some(([port, cfg]) =>
      cfg.up && cfg.ip === destination.gateway && hasLayer2Path(destination.id, destPort[0], device.id, port, destinationVlan)));
    const routed = sourceEdge.some((router) => routerCanReach(router, destinationIp, new Set())) &&
      destinationEdge.some((router) => routerCanReach(router, sourceIp, new Set()));
    return routed ? { ok: true, reason: "Router interfaces provide a simulated route in both directions." }
      : { ok: false, reason: "No complete route in both directions. Check router interfaces, routes, gateways, and links." };
  }
  function canRouterPing(source, destinationIp) {
    const sourcePort = Object.entries(source.interfaces).find(([, port]) => port.up && port.ip);
    if (!sourcePort) return { ok: false, reason: "Source router has no up interface with an IPv4 address." };
    const destination = state.devices.find((device) => device.id !== source.id &&
      Object.values(device.interfaces).some((port) => port.up && port.ip === destinationIp));
    if (!destination) return { ok: false, reason: "No device uses " + destinationIp + "." };
    return routerCanReach(source, destinationIp, new Set())
      ? { ok: true, reason: "Router interface, connected network, or static route reaches the destination." }
      : { ok: false, reason: "No route to host. Check interfaces, static routes, and links." };
  }
  function ospfAreaFor(device, port) {
    if (!device.ospf || !port || !port.ip) return null;
    const address = ipToInt(port.ip);
    if (address === null) return null;
    const entry = (device.ospf.networks || []).find((network) => {
      const net = ipToInt(network.net), wildcard = ipToInt(network.wildcard || "0.0.0.255");
      if (net === null || wildcard === null) return false;
      return ((address & ~wildcard) >>> 0) === ((net & ~wildcard) >>> 0);
    });
    return entry ? String(entry.area || "0") : null;
  }
  function logIcmpFrame(source, destinationIp, ok) {
    const sourcePort = Object.values(source.interfaces).find((port) => port.up && port.ip);
    const destination = state.devices.find((device) => isEndDevice(device.type) &&
      Object.values(device.interfaces).some((port) => port.up && port.ip === destinationIp));
    logFrame({
      proto: "ICMP",
      sourceName: source.name,
      destName: destination ? destination.name : destinationIp,
      srcIp: sourcePort?.ip || "",
      dstIp: destinationIp,
      length: 98,
      denied: !ok,
      info: ok ? "Echo (ping) request / reply" : "Echo (ping) request — no reply"
    });
  }
  function resolveArp(device, ip) {
    if (!ip || ipToInt(ip) === null || device.arp[ip]) return device.arp[ip] || null;
    const owner = state.devices.find((candidate) => candidate.id !== device.id &&
      Object.values(candidate.interfaces).some((port) => port.up && port.ip === ip));
    if (!owner) return null;
    const ownerPort = Object.entries(owner.interfaces).find(([, port]) => port.up && port.ip === ip);
    learnArp(device, ip, owner, ownerPort ? ownerPort[0] : "", 1);
    const senderIp = Object.values(device.interfaces).find((port) => port.up && port.ip)?.ip || "";
    logFrame({
      proto: "ARP",
      sourceName: device.name,
      destName: owner.name,
      srcIp: senderIp,
      dstIp: ip,
      length: 42,
      info: "Who has " + ip + "? Tell " + (senderIp || device.name)
    });
    return device.arp[ip];
  }
  function recordTraffic(source, destinationIp, ok) {
    const sourcePort = Object.values(source.interfaces).find((port) => port.up && port.ip);
    const destination = state.devices.find((device) => isEndDevice(device.type) &&
      Object.values(device.interfaces).some((port) => port.up && port.ip === destinationIp));
    const destinationPort = destination && Object.values(destination.interfaces).find((port) => port.up && port.ip === destinationIp);
    if (sourcePort) {
      if (destination && destinationPort && sameSubnet(sourcePort.ip, sourcePort.prefix, destinationIp, destinationPort.prefix)) {
        resolveArp(source, destinationIp);
        resolveArp(destination, sourcePort.ip);
      } else {
        if (source.gateway) resolveArp(source, source.gateway);
        if (destination && destination.gateway) resolveArp(destination, destination.gateway);
      }
    }
    logIcmpFrame(source, destinationIp, ok);
  }
  function pingFrom(source, destinationIp, allowQueue) {
    const result = source.type === "router" ? canRouterPing(source, destinationIp) : canPing(source, destinationIp);
    if (allowQueue && state.mode === "simulation") {
      const event = { id: safeId("pdu"), sourceId: source.id, type: "ICMP", status: "Queued", source: source.name, destination: destinationIp, time: 0, count: state.events.length + 1, route: result.ok ? findTopologyPath(source, destinationIp) : [source.id], hopIndex: 0 };
      state.pendingEvents.push(event.id);
      addEvent(event);
      setStatus("Simple PDU queued. Capture / Forward to inspect and deliver it.");
      return { ok: true, queued: true, reason: "PDU queued for simulation." };
    }
    const message = (result.ok ? "Reply from " : "Request timed out: ") + destinationIp + (result.ok ? " — " + result.reason : ". " + result.reason);
    addEvent({ id: safeId("pdu"), sourceId: source.id, type: "ICMP", status: result.ok ? "Success" : "Failed", source: source.name, destination: destinationIp, time: "0.001", count: state.events.length + 1 });
    setStatus(message, result.ok ? "good" : "bad");
    recordTraffic(source, destinationIp, result.ok);
    return result;
  }
  function renderCliHeader() {
    const device = getDevice(state.selected);
    if (!device) return;
    $("#cliScreen").textContent = cliPrompt(device);
  }
  function appendCli(text) {
    const screen = $("#cliScreen");
    screen.textContent += text;
    screen.scrollTop = screen.scrollHeight;
  }
  function simulatedMac(deviceId) {
    let hash = 0;
    for (const character of deviceId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    const bytes = [2, (hash >>> 24) & 255, (hash >>> 16) & 255, (hash >>> 8) & 255, hash & 255, (hash * 17) & 255];
    return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join(":");
  }
  function learnedMacEntries(switchDevice) {
    const learned = new Map();
    state.events.filter((event) => event.type === "ICMP" && event.status === "Success").forEach((event) => {
      const source = getDevice(event.sourceId);
      const destination = state.devices.find((candidate) => isEndDevice(candidate.type) &&
        Object.values(candidate.interfaces).some((port) => port.up && port.ip === event.destination));
      if (!source || !destination) return;
      const sourcePort = Object.entries(source.interfaces).find(([, port]) => port.up && port.ip);
      const destinationPort = Object.entries(destination.interfaces).find(([, port]) => port.up && port.ip === event.destination);
      if (!sourcePort || !destinationPort) return;
      const sourcePeer = getLinkPeer(source.id, sourcePort[0]);
      const destinationPeer = getLinkPeer(destination.id, destinationPort[0]);
      if (sourcePeer?.device?.id !== switchDevice.id || destinationPeer?.device?.id !== switchDevice.id) return;
      const vlan = switchDevice.interfaces[sourcePeer.port].vlan;
      if (switchDevice.interfaces[destinationPeer.port].vlan !== vlan ||
        !hasLayer2Path(source.id, sourcePort[0], destination.id, destinationPort[0], vlan)) return;
      learned.set(source.id, { vlan, mac: simulatedMac(source.id), port: sourcePeer.port });
      learned.set(destination.id, { vlan, mac: simulatedMac(destination.id), port: destinationPeer.port });
    });
    return [...learned.values()];
  }
  function cliPrompt(device) {
    if (isEndDevice(device.type)) return device.name + "> ";
    if (state.cliMode === "router-config" || state.cliMode === "bgp-config") return device.name + "(config-router)# ";
    const suffix = state.cliMode === "user" ? ">" : state.cliMode === "privileged" ? "#" : state.cliInterface ? "(config-if)#" : "(config)#";
    return device.name + suffix + " ";
  }
  function interfaceLongName(name) {
    if (/^G/i.test(name)) return name.replace(/^G/i, "GigabitEthernet");
    if (/^F/i.test(name)) return name.replace(/^F/i, "FastEthernet");
    return name;
  }
  function findPortName(device, wanted) {
    const value = String(wanted || "").toLowerCase();
    const short = value.replace(/^gigabitethernet/, "g").replace(/^fastethernet/, "f");
    return Object.keys(device.interfaces).find((port) => port.toLowerCase() === value ||
      port.toLowerCase() === short || interfaceLongName(port).toLowerCase() === value);
  }
  function maskString(prefix) {
    const mask = maskFor(Number(prefix));
    return [24, 16, 8, 0].map((shift) => (mask >>> shift) & 255).join(".");
  }
  function ciscoMac(mac) {
    const hex = String(mac || "").replace(/[^0-9a-f]/gi, "").toLowerCase();
    return hex.length >= 12 ? hex.slice(0, 4) + "." + hex.slice(4, 8) + "." + hex.slice(8, 12) : mac;
  }
  function expandCli(input) {
    const s = input.toLowerCase().replace(/\s+/g, " ").trim();
    const exact = {
      "en": "enable", "enab": "enable",
      "conf t": "configure terminal", "config t": "configure terminal", "configure t": "configure terminal",
      "sh": "show", "sho": "show",
      "wr": "write memory", "wr mem": "write memory", "write mem": "write memory",
      "copy run start": "write memory", "copy running-config startup-config": "write memory",
      "no shut": "no shutdown"
    };
    if (exact[s]) return exact[s];
    let match = s.match(/^(?:int|intf|inter|interf|interfa|interfac|interface) (.+)$/);
    if (match) return "interface " + match[1];
    match = s.match(/^(?:sh|sho|show) (.*)$/);
    if (match) {
      const shows = {
        "run": "running-config", "runn": "running-config", "running": "running-config", "running-config": "running-config",
        "start": "startup-config", "startup": "startup-config", "startup-config": "startup-config",
        "ver": "version", "vers": "version", "version": "version",
        "ip int br": "ip interface brief", "ip int brief": "ip interface brief", "ip interface br": "ip interface brief", "ip interface brief": "ip interface brief",
        "ip ro": "ip route", "ip rou": "ip route", "ip route": "ip route",
        "ip arp": "ip arp", "arp": "arp",
        "mac": "mac address-table", "mac add": "mac address-table", "mac address-table": "mac address-table",
        "vlan br": "vlan brief", "vlan brief": "vlan brief",
        "int tr": "interfaces trunk", "int trunk": "interfaces trunk", "interfaces tr": "interfaces trunk", "interfaces trunk": "interfaces trunk",
        "span": "spanning-tree", "spanning": "spanning-tree", "spanning-tree": "spanning-tree",
        "ip ospf nei": "ip ospf neighbor", "ip ospf neighbor": "ip ospf neighbor",
        "bgp sum": "bgp summary", "bgp summary": "bgp summary"
      };
      if (shows[match[1]]) return "show " + shows[match[1]];
      if (/^(?:ip )?ospf nei/.test(match[1])) return "show ip ospf neighbor";
      if (/^bgp sum/.test(match[1])) return "show bgp summary";
      if (/^mac add/.test(match[1])) return "show mac address-table";
    }
    return s;
  }
  function cliError(output, device, raw, offset) {
    const caret = Math.max(0, cliPrompt(device).length + (offset || 0));
    output(" ".repeat(caret) + "^");
    output("% Invalid input detected at '^' marker.");
  }
  function runCli(command) {
    const device = getDevice(state.selected), raw = command.trim();
    if (!device) { appendCli("\nSelect a device on the topology first.\n"); return; }
    if (!raw) return;
    appendCli("\n" + cliPrompt(device) + raw + "\n");
    const inConfig = state.cliMode === "config" || state.cliMode === "router-config" || state.cliMode === "bgp-config";
    const doMatch = inConfig ? raw.match(/^do\s+(.+)$/i) : null;
    const normalized = expandCli(doMatch ? doMatch[1] : raw);
    const wasDo = Boolean(doMatch);
    const lower = normalized;
    const args = lower.split(/\s+/);
    const output = (text) => appendCli(text + "\n");
    const selectedPort = () => device.interfaces[state.cliInterface];
    if (lower === "help" || lower === "?") {
      if (device.type === "hub") { output("Hub-PT is an unmanaged Layer-1 device and has no CLI."); return; }
      output(isEndDevice(device.type)
        ? "Commands: ipconfig [/all], ipconfig <ip> <mask> [gateway], ping <host>, tracert <host>, arp -a, nslookup <name>, dig <name>, dns add <name> <IPv4>, ip address <IPv4> <prefix>, ip default-gateway <IPv4>, write memory"
        : "Commands: enable, disable, configure terminal, hostname <name>, interface <name>, ip address <IPv4> <prefix|mask>, no ip address, no shutdown, shutdown, switchport mode access|trunk, switchport access vlan <id>, switchport trunk allowed vlan <list|all>, switchport trunk native vlan <id>, encapsulation dot1q <vlan>, ip route <network> <prefix|mask> <next-hop>, no ip route, router ospf <id>, network <net> <wildcard> area <id>, passive-interface <name>, router bgp <asn>, neighbor <ip> remote-as <asn>, network <net> mask <mask>, show ip interface brief, show ip route, show ip ospf neighbor, show bgp summary, show vlan brief, show interfaces trunk, show spanning-tree, show mac address-table, show arp, show version, show running-config, show startup-config, ping <IPv4>, exit, end, write memory");
      return;
    }
    if (device.type === "hub") { output("Hub-PT is an unmanaged Layer-1 device and has no CLI."); return; }
    if (isEndDevice(device.type)) {
      const portName = Object.keys(device.interfaces)[0], port = device.interfaces[portName];
      const dnsRecord = (name) => state.devices
        .flatMap((candidate) => (candidate.dns || []).map((item) => ({ name: item.name, ip: item.ip, owner: candidate })))
        .find((item) => String(item.name).toLowerCase() === String(name).toLowerCase());
      if (lower === "ipconfig") {
        output(interfaceLongName(portName) + " Connection:(default port)");
        output("");
        output("   IP Address......................: " + (port.ip || "0.0.0.0"));
        output("   Subnet Mask.....................: " + maskString(port.prefix));
        output("   Default Gateway.................: " + (device.gateway || "0.0.0.0"));
      } else if (lower === "ipconfig /all") {
        output(interfaceLongName(portName) + " Connection:(default port)");
        output("");
        output("   Physical Address................: " + ciscoMac(simulatedMac(device.id)));
        output("   IP Address......................: " + (port.ip || "0.0.0.0"));
        output("   Subnet Mask.....................: " + maskString(port.prefix));
        output("   Default Gateway.................: " + (device.gateway || "0.0.0.0"));
        output("   DNS Servers.....................: " + (device.dnsServer || "0.0.0.0"));
      } else if (lower === "ipconfig /release") {
        port.ip = ""; device.gateway = "";
        updateDeviceDom(); populateConfiguration(); persist();
      } else if (args[0] === "ipconfig" && args.length > 2) {
        const prefix = args[2].includes(".") ? prefixForMask(args[2]) : Number(args[2]);
        if (ipToInt(args[1]) === null || !validPrefix(prefix)) cliError(output, device, raw);
        else {
          port.ip = args[1]; port.prefix = prefix;
          if (args[3] && ipToInt(args[3]) !== null) device.gateway = args[3];
          updateDeviceDom(); populateConfiguration(); persist();
        }
      } else if (args[0] === "ip" && args[1] === "address") {
        const prefix = args[3] && args[3].includes(".") ? prefixForMask(args[3]) : Number(args[3]);
        if (ipToInt(args[2]) === null || !validPrefix(prefix)) cliError(output, device, raw);
        else { port.ip = args[2]; port.prefix = prefix; updateDeviceDom(); populateConfiguration(); persist(); }
      } else if (args[0] === "ip" && args[1] === "default-gateway") {
        if (ipToInt(args[2]) === null) cliError(output, device, raw);
        else { device.gateway = args[2]; populateConfiguration(); persist(); }
      } else if (args[0] === "ping") {
        if (ipToInt(args[1]) === null) output("Ping request could not find host " + (args[1] || "") + ". Please check the name and try again.");
        else {
          const result = pingFrom(device, args[1], false);
          output("Pinging " + args[1] + " with 32 bytes of data:");
          output("");
          for (let attempt = 0; attempt < 4; attempt += 1) {
            output(result.ok ? "Reply from " + args[1] + ": bytes=32 time<1ms TTL=128" : "Request timed out.");
          }
          output("");
          output("Ping statistics for " + args[1] + ":");
          output("    Packets: Sent = 4, Received = " + (result.ok ? 4 : 0) + ", Lost = " + (result.ok ? 0 : 4) + " (" + (result.ok ? 0 : 100) + "% loss),");
        }
      } else if (args[0] === "tracert") {
        if (ipToInt(args[1]) === null) output("Unable to resolve target system name " + (args[1] || "") + ".");
        else {
          const result = pingFrom(device, args[1], false);
          output("Tracing route to " + args[1] + " over a maximum of 30 hops:");
          output("");
          if (!result.ok) output("  1     *        *        *     Request timed out.");
          else {
            if (device.gateway && device.gateway !== args[1]) output("  1    <1 ms    <1 ms    <1 ms  " + device.gateway);
            output("  " + (device.gateway && device.gateway !== args[1] ? "2" : "1") + "    <1 ms    <1 ms    <1 ms  " + args[1]);
          }
          output("");
          output("Trace complete.");
        }
      } else if (lower === "arp -a" || lower === "show arp" || lower === "show ip arp") {
        const entries = Object.entries(device.arp);
        output("Internet Address      Physical Address      Type");
        if (!entries.length) output("No ARP Entries Found.");
        entries.forEach(([ip, entry]) => output(ip.padEnd(22) + ciscoMac(entry.mac).padEnd(22) + "dynamic"));
      } else if (args[0] === "nslookup") {
        const name = args[1] || "";
        const record = dnsRecord(name);
        const server = record?.owner || state.devices.find((candidate) => (candidate.dns || []).length);
        const serverPort = server && Object.values(server.interfaces).find((item) => item.ip);
        output("Server:  " + (server ? server.name : "Unknown"));
        output("Address:  " + (serverPort?.ip || "0.0.0.0"));
        output("");
        if (!name) return;
        if (record) {
          output("Non-authoritative answer:");
          output("Name:    " + name);
          output("Address:  " + record.ip);
        } else output("*** UnKnown can't find " + name + ": Non-existent domain");
      } else if (args[0] === "dig") {
        const name = (args[1] || "").toLowerCase();
        if (!name) output("Usage: dig <name>");
        else {
          const record = dnsRecord(name);
          output(record ? ";; ANSWER SECTION:\n" + name + " 60 IN A " + record.ip : ";; no records found for " + name + ". Add one on the DNS server with: dns add <name> <IPv4>");
        }
      } else if (args[0] === "dns" && args[1] === "add") {
        if (!args[2] || ipToInt(args[3]) === null) output("Usage: dns add <name> <IPv4>");
        else { device.dns.push({ name: args[2], ip: args[3] }); persist(); }
      } else if (lower === "write memory") {
        persist(); output("Building configuration...\n[OK]");
      } else cliError(output, device, raw);
      return;
    }
    if (lower === "enable") {
      if (state.cliMode === "user") state.cliMode = "privileged";
      else if (state.cliMode !== "privileged") cliError(output, device, raw);
      return;
    }
    if (lower === "disable") {
      if (state.cliMode === "privileged") state.cliMode = "user";
      else cliError(output, device, raw);
      return;
    }
    if (lower === "configure terminal") {
      if (state.cliMode !== "privileged") { cliError(output, device, raw); return; }
      state.cliMode = "config"; state.cliInterface = null;
      output("Enter configuration commands, one per line.  End with CNTL/Z.");
      return;
    }
    if (lower === "end") {
      if (!inConfig) { cliError(output, device, raw); return; }
      state.cliMode = "privileged"; state.cliInterface = null;
      return;
    }
    if (lower === "exit") {
      if (state.cliMode === "router-config" || state.cliMode === "bgp-config") state.cliMode = "config";
      else if (state.cliInterface) state.cliInterface = null;
      else if (state.cliMode === "config") state.cliMode = "privileged";
      else state.cliMode = "user";
      return;
    }
    if (args[0] === "interface") {
      if (state.cliMode !== "config") { cliError(output, device, raw); return; }
      const wanted = (args[1] || "").toLowerCase();
      let name = findPortName(device, wanted);
      if (!name && device.type === "router" && /^g0\/[0-2]\.\d+$/.test(wanted)) {
        const parent = wanted.split(".")[0].toUpperCase();
        const vlan = Number(wanted.split(".")[1]);
        if (!device.interfaces[parent]) output("% Invalid input detected at '^' marker.");
        else if (!Number.isInteger(vlan) || vlan < 1 || vlan > 4094) output("% Invalid input detected at '^' marker.");
        else {
          name = parent + "." + vlan;
          if (!device.interfaces[name]) {
            device.interfaces[name] = { up: true, ip: "", prefix: 24, vlan, mode: "access", allowed: null, native: 1, helper: "", mtu: 1500, aclIn: null, aclOut: null, ospfPassive: false, parent };
            device.interfaces[parent].mode = "trunk";
          }
        }
      }
      if (!name) output("% Invalid input detected at '^' marker.");
      else state.cliInterface = name;
      return;
    }
    if (args[0] === "hostname" && state.cliMode === "config" && args[1]) { device.name = raw.split(/\s+/).slice(1).join(" ").slice(0, 24); updateDeviceDom(); populateConfiguration(); persist(); return; }
    if (/^(show|ping|tracert|nslookup)\b/.test(lower) && inConfig && !wasDo) { cliError(output, device, raw); return; }
    if (lower === "show ip interface brief") {
      output("Interface                  IP-Address      OK? Method Status                Protocol");
      Object.entries(device.interfaces).forEach(([name, port]) => {
        const hasIp = Boolean(port.ip);
        const status = port.up ? "up" : "administratively down";
        const protocol = port.up && (hasIp || device.type === "switch") ? "up" : "down";
        output(interfaceLongName(name).padEnd(27) + (port.ip || "unassigned").padEnd(16) +
          (hasIp ? "YES" : "NO").padEnd(4) + (hasIp ? "manual" : "unset").padEnd(7) + status.padEnd(22) + protocol);
      });
      return;
    }
    if (lower === "show ip route") {
      output("Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP");
      output("       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area");
      output("       E1 - OSPF external type 1, E2 - OSPF external type 2");
      output("       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2");
      output("       ia - IS-IS inter area, * - candidate default, U - per-user static route");
      output("       o - ODR, P - periodic downloaded static route, H - NHRP");
      output("       l - LISP, a - application route, + - replicated route");
      output("Gateway of last resort is not set");
      output("");
      Object.entries(device.interfaces).filter(([, port]) => port.up && port.ip).forEach(([name, port]) => {
        const network = intToIp(ipToInt(port.ip) & maskFor(port.prefix));
        output("C    " + network + "/" + port.prefix + " is directly connected, " + interfaceLongName(name));
        output("L    " + port.ip + "/32 is directly connected, " + interfaceLongName(name));
      });
      device.routes.forEach((route) => output("S    " + route.network + "/" + route.prefix + " [1/0] via " + route.nextHop));
      return;
    }
    if (lower === "show version") {
      const switchModel = device.type === "switch";
      output("Cisco IOS Software, " + (switchModel ? "C2960" : "ISR4300") + " Software (" +
        (switchModel ? "C2960-LANBASEK9-M" : "UNIVERSALK9-M") + "), Version 15.2(2)E9, RELEASE SOFTWARE (fc1)");
      output("Technical Support: http://www.cisco.com/techsupport");
      output("Copyright (c) 1986-2019 by Cisco Systems, Inc.");
      output("Compiled Mon 14-Jan-19 12:00 by prod_rel_team");
      output("");
      output(device.name + " uptime is 0 minutes");
      output("System returned to ROM by power-on");
      output("System image file is \"flash:" + (switchModel ? "c2960-lanbasek9-mz.152-2.E9.bin" : "isr4300-universalk9.15.02.02.S.156-1.S.bin") + "\"");
      output("");
      output("cisco " + (switchModel ? "WS-C2960-24TT-L (PowerPC405) processor (revision B0)" : "ISR4331/K9 (1RU) processor (revision 1.0)"));
      output("Processor board ID FDO1234ABCD");
      output("");
      if (switchModel) {
        output("24 FastEthernet interfaces");
        output("2 Gigabit Ethernet interfaces");
      } else {
        output("3 Gigabit Ethernet interfaces");
      }
      output("The password-recovery mechanism is enabled.");
      output("");
      output("Configuration register is 0xF");
      return;
    }
    if (lower === "show startup-config") {
      if (state.cliMode === "user") { cliError(output, device, raw); return; }
      output("Building configuration...");
      output("");
      output("Current configuration : 1024 bytes");
      output("!");
      output("version 15.2");
      output("hostname " + device.name);
      output("!");
      output("end");
      return;
    }
    if (lower === "show running-config") {
      if (state.cliMode === "user") { cliError(output, device, raw); return; }
      output("Building configuration...");
      output("");
      output("Current configuration : 1024 bytes");
      output("!");
      output("version 15.2");
      output("service timestamps debug datetime msec");
      output("service timestamps log datetime msec");
      output("no service password-encryption");
      output("!");
      output("hostname " + device.name);
      output("!");
      output("boot-start-marker");
      output("boot-end-marker");
      output("!");
      Object.entries(device.interfaces).forEach(([name, port]) => {
        output("interface " + interfaceLongName(name));
        if (port.ip) output(" ip address " + port.ip + " " + maskString(port.prefix));
        if (device.type === "switch") {
          if (port.mode === "trunk") {
            output(" switchport mode trunk");
            if (port.allowed) output(" switchport trunk allowed vlan " + port.allowed.join(","));
            if ((port.native || 1) !== 1) output(" switchport trunk native vlan " + port.native);
          } else output(" switchport access vlan " + (port.vlan || 1));
        }
        if (name.includes(".")) output(" encapsulation dot1Q " + (port.vlan || 1));
        if (port.helper) output(" ip helper-address " + port.helper);
        if ((port.mtu || 1500) !== 1500) output(" ip mtu " + port.mtu);
        if (port.ospfCost) output(" ip ospf cost " + port.ospfCost);
        if (device.type !== "switch") output(port.up ? " no shutdown" : " shutdown");
        output("!");
      });
      device.routes.forEach((route) => output("ip route " + route.network + " " + maskString(route.prefix) + " " + route.nextHop));
      if (device.routes.length) output("!");
      if (device.ospf) {
        output("router ospf " + device.ospf.process);
        if (device.ospf.routerId) output(" router-id " + device.ospf.routerId);
        device.ospf.networks.forEach((item) => output(" network " + item.net + " " + item.wildcard + " area " + item.area));
        Object.entries(device.interfaces).filter(([, port]) => port.ospfPassive).forEach(([name]) =>
          output(" passive-interface " + interfaceLongName(name)));
        output("!");
      }
      if (device.bgp) {
        output("router bgp " + device.bgp.asn);
        device.bgp.neighbors.forEach((item) => output(" neighbor " + item.ip + " remote-as " + item.remoteAs));
        device.bgp.networks.forEach((item) => output(" network " + item.net + " mask " + item.mask));
        output("!");
      }
      output("ip classless");
      output("!");
      output("line con 0");
      output("line vty 0 4");
      output(" login");
      output("!");
      output("end");
      return;
    }
    if (lower === "write memory") {
      if (state.cliMode === "user") { cliError(output, device, raw); return; }
      persist(); output("Building configuration...\n[OK]");
      return;
    }
    if (lower === "show vlan brief" && device.type === "switch") {
      const vlans = new Map();
      const trunks = [];
      Object.entries(device.interfaces).forEach(([name, port]) => {
        if (port.mode === "trunk") { trunks.push(name + (port.allowed ? " (" + port.allowed.join(",") + ")" : " (all)")); return; }
        if (!vlans.has(port.vlan)) vlans.set(port.vlan, []);
        vlans.get(port.vlan).push(name);
      });
      output("VLAN  Name                 Status    Ports");
      [...vlans.entries()].sort((a, b) => a[0] - b[0]).forEach(([vlan, ports]) => output(String(vlan).padEnd(6) + ("VLAN" + vlan).padEnd(21) + "active    " + ports.join(", ")));
      if (trunks.length) output("Trunk ports: " + trunks.join(", "));
      return;
    }
    if (lower === "show interfaces trunk" && device.type === "switch") {
      const trunks = Object.entries(device.interfaces).filter(([, port]) => port.mode === "trunk");
      if (!trunks.length) { output("No trunking interfaces. Use switchport mode trunk under an interface."); return; }
      output("Port        Mode         Encapsulation  Status        Native vlan");
      trunks.forEach(([name, port]) => output(name.padEnd(12) + "on".padEnd(13) + "802.1q".padEnd(15) + (port.up ? "trunking" : "not-trunking").padEnd(14) + String(port.native || 1)));
      output("");
      output("Port        Vlans allowed on trunk");
      trunks.forEach(([name, port]) => output(name.padEnd(12) + (port.allowed ? port.allowed.join(",") : "1-4094")));
      return;
    }
    if (lower === "show spanning-tree" && device.type === "switch") {
      const stp = stpState();
      const rootId = stp.roots.get(device.id) || device.id;
      const rootDevice = getDevice(rootId);
      output("VLAN0001");
      output("  Spanning tree enabled protocol ieee");
      output("  Root ID    Priority    " + ((rootDevice.stp.priority || 32768) + 1));
      output("             Address     " + simulatedMac(rootId));
      if (rootId === device.id) output("             This bridge is the root");
      else output("             Cost        " + stp.cost.get(device.id) + "  Port " + (stp.roles.get(device.id).rootPort || "-"));
      output("  Bridge ID  Priority    " + ((device.stp.priority || 32768) + 1) + "  (priority " + (device.stp.priority || 32768) + " sys-id-ext 1)");
      output("             Address     " + simulatedMac(device.id));
      output("");
      output("Interface   Role Sts Cost      Type");
      const roles = stp.roles.get(device.id) || {};
      Object.entries(device.interfaces).forEach(([name, port]) => {
        const role = roles[name] || "Designated";
        const short = role === "Root" ? "Root" : role === "Blocked" ? "Altn" : "Desg";
        const state = role === "Blocked" ? "BLK" : "FWD";
        output(name.padEnd(12) + short.padEnd(5) + state.padEnd(4) + "4".padEnd(10) + "P2p");
      });
      return;
    }
    if (lower === "show arp" || lower === "show ip arp" || lower === "arp -a") {
      const entries = Object.entries(device.arp);
      output("Protocol  Address          Age (min)  Hardware Addr   Type   Interface");
      if (!entries.length) output("No ARP entries found.");
      entries.forEach(([ip, entry]) => output("Internet  " + ip.padEnd(17) + "0".padStart(9) + "   " +
        ciscoMac(entry.mac).padEnd(16) + "ARPA"));
      return;
    }
    if (lower === "show mac address-table" && device.type === "switch") {
      const entries = learnedMacEntries(device);
      output("          Mac Address Table");
      output("-------------------------------------------");
      output("");
      output("Vlan    Mac Address       Type        Ports");
      output("----    -----------       --------    -----");
      entries.forEach((entry) => output(String(entry.vlan).padStart(4) + "    " +
        ciscoMac(entry.mac).padEnd(16) + "DYNAMIC     " + entry.port));
      output("");
      output("Total Mac Addresses for this criterion: " + entries.length);
      return;
    }
    if (lower === "show ip ospf neighbor" && device.type === "router") {
      if (!device.ospf) { output("OSPF is not configured. Use 'router ospf <id>' to enable."); return; }
      const neighbors = [];
      state.links.forEach((link) => {
        const a = getDevice(link.a.deviceId), b = getDevice(link.b.deviceId);
        if (!a || !b || a.type !== "router" || b.type !== "router") return;
        if (a.id !== device.id && b.id !== device.id) return;
        const local = a.id === device.id ? { device: a, port: link.a.port } : { device: b, port: link.b.port };
        const remote = a.id === device.id ? { device: b, port: link.b.port } : { device: a, port: link.a.port };
        const localPort = local.device.interfaces[local.port], remotePort = remote.device.interfaces[remote.port];
        if (!localPort || !remotePort || !localPort.up || !remotePort.up || localPort.ospfPassive) return;
        if (!remote.device.ospf) return;
        const localArea = ospfAreaFor(local.device, localPort), remoteArea = ospfAreaFor(remote.device, remotePort);
        if (localArea === null || remoteArea === null || localArea !== remoteArea) return;
        if ((localPort.mtu || 1500) !== (remotePort.mtu || 1500)) return;
        neighbors.push({ id: remote.device.ospf.routerId || remotePort.ip || remote.device.name, address: remotePort.ip || "-", interface: local.port });
      });
      output("Neighbor ID     Pri   State           Dead Time   Address         Interface");
      if (!neighbors.length) { output("No OSPF neighbors found on this simulation."); return; }
      neighbors.forEach((n) => output(String(n.id).padEnd(16) + "1".padEnd(6) + "FULL/DR".padEnd(16) + "00:00:38".padEnd(13) + String(n.address).padEnd(16) + interfaceLongName(n.interface)));
      return;
    }
    if (lower === "show bgp summary" && device.type === "router") {
      if (!device.bgp) { output("BGP is not configured. Use 'router bgp <asn>' to enable."); return; }
      output("BGP router identifier " + Object.values(device.interfaces).find((p) => p.ip)?.ip + ", local AS number " + device.bgp.asn);
      output("Neighbor        V    AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd");
      if (!device.bgp.neighbors.length) output("No BGP neighbors configured.");
      device.bgp.neighbors.forEach((n) => {
        const remote = state.devices.find((d) => d.type === "router" && d.id !== device.id &&
          Object.values(d.interfaces).some((p) => p.up && p.ip === n.ip));
        const established = !!remote && !!remote.bgp && Number(remote.bgp.asn) === Number(n.remoteAs) &&
          remote.bgp.neighbors.some((m) => Number(m.remoteAs) === Number(device.bgp.asn));
        output(String(n.ip).padEnd(16) + "4    " + String(n.remoteAs).padEnd(8) + "0       0        1    0    0 00:01:00 " + (established ? "Established " + remote.bgp.networks.length : "Idle"));
      });
      return;
    }
    if (args[0] === "ping") {
      if (ipToInt(args[1]) === null) output("Usage: ping <IPv4>");
      else {
        const result = pingFrom(device, args[1], false);
        output("Type escape sequence to abort.");
        output("Sending 5, 100-byte ICMP Echos to " + args[1] + ", timeout is 2 seconds:");
        output(result.ok ? "!!!!!" : ".....");
        output("Success rate is " + (result.ok ? 100 : 0) + " percent (" + (result.ok ? 5 : 0) + "/5), round-trip min/avg/max = 0/1/1 ms");
      }
      return;
    }
    if (state.cliInterface) {
      const port = selectedPort();
      const longName = interfaceLongName(state.cliInterface);
      if (args[0] === "no" && args[1] === "ip" && args[2] === "address") {
        port.ip = "";
      } else if (args[0] === "ip" && args[1] === "address") {
        let prefix = Number(args[3]);
        if (args[3] && args[3].includes(".")) prefix = prefixForMask(args[3]);
        if (ipToInt(args[2]) === null || !validPrefix(prefix)) cliError(output, device, raw);
        else { port.ip = args[2]; port.prefix = prefix; }
      } else if (lower === "no shutdown") {
        const wasDown = !port.up;
        port.up = true;
        if (wasDown && device.type !== "switch") {
          output("%LINK-3-UPDOWN: Interface " + longName + ", changed state to up");
          output("%LINEPROTO-5-UPDOWN: Line protocol on Interface " + longName + ", changed state to up");
        }
      } else if (lower === "shutdown") {
        const wasUp = port.up;
        port.up = false;
        if (wasUp && device.type !== "switch") {
          output("%LINK-5-CHANGED: Interface " + longName + ", changed state to administratively down");
          output("%LINEPROTO-5-UPDOWN: Line protocol on Interface " + longName + ", changed state to down");
        }
      } else if (args[0] === "switchport" && device.type === "switch") {
        if (args[1] === "mode" && (args[2] === "access" || args[2] === "trunk")) port.mode = args[2];
        else if (args[1] === "access" && args[2] === "vlan") {
          const vlan = Number(args[3]);
          if (!Number.isInteger(vlan) || vlan < 1 || vlan > 4094) cliError(output, device, raw);
          else port.vlan = vlan;
        } else if (args[1] === "trunk" && args[2] === "allowed" && args[3] === "vlan") {
          const list = args.slice(4).join(",");
          if (!list || list === "all" || list === "none") port.allowed = list === "none" ? [] : null;
          else {
            const ids = list.split(/[,\s]+/).map(Number).filter((id) => Number.isInteger(id) && id >= 1 && id <= 4094);
            if (!ids.length) cliError(output, device, raw);
            else port.allowed = ids;
          }
        } else if (args[1] === "trunk" && args[2] === "native" && args[3] === "vlan") {
          const vlan = Number(args[4]);
          if (!Number.isInteger(vlan) || vlan < 1 || vlan > 4094) cliError(output, device, raw);
          else port.native = vlan;
        } else cliError(output, device, raw);
      } else if (args[0] === "encapsulation" && args[1] === "dot1q" && device.type === "router") {
        const vlan = Number(args[2]);
        if (!Number.isInteger(vlan) || vlan < 1 || vlan > 4094) cliError(output, device, raw);
        else port.vlan = vlan;
      } else if (args[0] === "ip" && args[1] === "helper-address") {
        if (ipToInt(args[2]) === null) cliError(output, device, raw);
        else port.helper = args[2];
      } else if (args[0] === "ip" && args[1] === "mtu") {
        const mtu = Number(args[2]);
        if (!Number.isInteger(mtu) || mtu < 576 || mtu > 9000) cliError(output, device, raw);
        else port.mtu = mtu;
      } else if (args[0] === "ip" && args[1] === "ospf" && args[2] === "cost") {
        const cost = Number(args[3]);
        if (!Number.isInteger(cost) || cost < 1 || cost > 65535) cliError(output, device, raw);
        else port.ospfCost = cost;
      } else cliError(output, device, raw);
      updateDeviceDom(); populateConfiguration(); persist(); return;
    }
    if (args[0] === "router" && args[1] === "ospf" && state.cliMode === "config") {
      const process = Number(args[2]) || 1;
      if (!device.ospf || device.ospf.process !== process) {
        device.ospf = { process, networks: [], area: "0", routerId: Object.values(device.interfaces).find((port) => port.ip)?.ip || "1.1.1.1" };
      }
      state.cliMode = "router-config";
      state.ospfProcess = process;
      return;
    }
    if (args[0] === "no" && args[1] === "router" && args[2] === "ospf" && state.cliMode === "config") {
      device.ospf = null; persist(); return;
    }
    if (args[0] === "router" && args[1] === "bgp" && state.cliMode === "config") {
      const asn = Number(args[2]);
      if (!Number.isInteger(asn) || asn < 1) cliError(output, device, raw);
      else {
        if (!device.bgp || device.bgp.asn !== asn) device.bgp = { asn, neighbors: [], networks: [] };
        state.cliMode = "bgp-config"; state.bgpAsn = asn;
      }
      return;
    }
    if (args[0] === "no" && args[1] === "router" && args[2] === "bgp" && state.cliMode === "config") {
      device.bgp = null; persist(); return;
    }
    if (state.cliMode === "router-config") {
      if (args[0] === "network") {
        const net = args[1], wildcard = args[2] || "0.0.0.255", area = args[3] === "area" ? args[4] : "0";
        if (ipToInt(net) === null || ipToInt(wildcard) === null) { cliError(output, device, raw); return; }
        if (!device.ospf.networks.some((item) => item.net === net && item.wildcard === wildcard && String(item.area) === String(area))) {
          device.ospf.networks.push({ net, wildcard, area });
        }
        persist(); return;
      }
      if (args[0] === "router-id") {
        if (ipToInt(args[1]) === null) { cliError(output, device, raw); return; }
        device.ospf.routerId = args[1]; persist(); return;
      }
      if (args[0] === "passive-interface") {
        const name = findPortName(device, args[1]);
        if (!name) { cliError(output, device, raw); return; }
        device.interfaces[name].ospfPassive = true; persist(); return;
      }
      if (args[0] === "no" && args[1] === "passive-interface") {
        const name = findPortName(device, args[2]);
        if (!name) { cliError(output, device, raw); return; }
        device.interfaces[name].ospfPassive = false; persist(); return;
      }
    }
    if (state.cliMode === "bgp-config") {
      if (args[0] === "neighbor" && args[2] === "remote-as") {
        const ip = args[1], remoteAs = Number(args[3]);
        if (ipToInt(ip) === null || !Number.isInteger(remoteAs)) { cliError(output, device, raw); return; }
        const existing = device.bgp.neighbors.find((neighbor) => neighbor.ip === ip);
        if (existing) existing.remoteAs = remoteAs;
        else device.bgp.neighbors.push({ ip, remoteAs });
        persist(); return;
      }
      if (args[0] === "network") {
        const mask = args[3] || "255.255.255.0";
        if (ipToInt(args[1]) === null || ipToInt(mask) === null) { cliError(output, device, raw); return; }
        if (!device.bgp.networks.some((item) => item.net === args[1] && item.mask === mask)) {
          device.bgp.networks.push({ net: args[1], mask, prepended: 0 });
        }
        persist(); return;
      }
    }
    if (args[0] === "ip" && args[1] === "route" && state.cliMode === "config") {
      let prefix = Number(args[3]); if (args[3] && args[3].includes(".")) prefix = prefixForMask(args[3]);
      if (ipToInt(args[2]) === null || !validPrefix(prefix) || ipToInt(args[4]) === null) cliError(output, device, raw);
      else {
        device.routes = device.routes.filter((route) => route.network !== args[2] || route.prefix !== prefix);
        device.routes.push({ network: args[2], prefix, nextHop: args[4] });
        persist();
      }
      return;
    }
    if (args[0] === "no" && args[1] === "ip" && args[2] === "route" && state.cliMode === "config") {
      let prefix = Number(args[4]); if (args[4] && args[4].includes(".")) prefix = prefixForMask(args[4]);
      device.routes = device.routes.filter((route) => route.network !== args[3] || route.prefix !== prefix);
      persist(); return;
    }
    cliError(output, device, raw);
  }
  function guideEbookHref(lab) {
    return "./Networking-Ebook.html#ch-16-s" + Number(lab.id.slice(4));
  }
  function populateGuideList() {
    const list = $("#guideList");
    if (!list) return;
    list.replaceChildren();
    const simulated = labs.filter((lab) => lab.support !== "external");
    const external = labs.filter((lab) => lab.support === "external");
    simulated.forEach((lab) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "guide-card" + (state.activeGuide === lab.id ? " guide-current" : "");
      const title = document.createElement("strong"), summary = document.createElement("span"), badge = document.createElement("em");
      title.textContent = lab.title;
      badge.className = "guide-badge";
      badge.textContent = lab.support === "partial" ? "Partly simulated" : "Simulated here";
      title.appendChild(badge);
      summary.textContent = lab.tool;
      button.append(title, summary);
      button.setAttribute("aria-pressed", String(state.activeGuide === lab.id));
      button.addEventListener("click", () => loadGuideTopology(lab.id));
      list.appendChild(button);
    });
    if (external.length) {
      const heading = document.createElement("p");
      heading.className = "guide-group-title";
      heading.textContent = "Needs external tools — open in the ebook";
      list.appendChild(heading);
      external.forEach((lab) => {
        const link = document.createElement("a");
        link.className = "guide-card guide-external";
        link.href = guideEbookHref(lab);
        const title = document.createElement("strong"), summary = document.createElement("span");
        title.textContent = lab.title;
        summary.textContent = lab.tool;
        link.append(title, summary);
        list.appendChild(link);
      });
    } else {
      const note = document.createElement("p");
      note.className = "guide-group-title";
      note.textContent = "All labs run in this browser";
      list.appendChild(note);
    }
    const active = labs.find((lab) => lab.id === state.activeGuide);
    $("#guideDetail").hidden = !active;
    if (!active) return;
    $("#guideTitle").textContent = active.title;
    $("#guideGoal").textContent = active.goal;
    $("#guideTool").textContent = active.tool;
    $("#guideProof").textContent = active.proof;
    $("#guideScope").textContent = active.scope || "";
    $("#guideScopeField").hidden = !active.scope;
    $("#guideEbookLink").href = guideEbookHref(active);
  }
  function loadGuideTopology(id) {
    const lab = labs.find((item) => item.id === id);
    if (!lab) return;
    if (lab.support === "external") {
      state.activeGuide = id;
      $(".inspector").classList.add("open");
      populateGuideList();
      switchPanel("guide");
      setStatus(lab.title + " is not simulated in this browser lab. Open the ebook section to run it with " + lab.tool + ".", "bad");
      return;
    }
    const layouts = {
      "lab-01": { nodes: [["pc", "PC0"], ["switch", "Switch0"], ["pc", "PC1"]], links: [[0, "F0", 1, "F0/1"], [1, "F0/2", 2, "F0"]] },
      "lab-02": { nodes: [["pc", "Source PC"], ["switch", "Access Switch"], ["router", "Gateway Router"], ["switch", "Remote Switch"], ["server", "Remote Host"]], links: [[0, "F0", 1, "F0/1"], [1, "F0/2", 2, "G0/0"], [2, "G0/1", 3, "F0/1"], [3, "F0/2", 4, "F0"]] },
      "lab-03": { nodes: [["pc", "Address Drill PC"], ["server", "ipcalc Reference"]], links: [] },
      "lab-04": { nodes: [["pc", "VLAN 10 PC"], ["switch", "Access Switch A"], ["router", "Router-on-a-Stick"], ["switch", "Access Switch B"], ["pc", "VLAN 20 PC"]], links: [[0, "F0", 1, "F0/1"], [1, "F0/2", 2, "G0/0"], [2, "G0/1", 3, "F0/1"], [3, "F0/2", 4, "F0"]] },
      "lab-05": { nodes: [["pc", "VLAN 10 PC"], ["switch", "Switch A"], ["switch", "Switch B"], ["pc", "VLAN 10 PC 2"]], links: [[0, "F0", 1, "F0/1"], [1, "F0/2", 2, "F0/1"], [2, "F0/2", 3, "F0"]] },
      "lab-06": { nodes: [["switch", "Switch A"], ["switch", "Switch B"], ["switch", "Switch C"]], links: [[0, "F0/1", 1, "F0/1"], [1, "F0/2", 2, "F0/1"], [2, "F0/2", 0, "F0/2"]] },
      "lab-07": { nodes: [["pc", "Loopback Host A"], ["router", "R1"], ["router", "R2"], ["router", "R3"], ["pc", "Loopback Host B"]], links: [[0, "F0", 1, "G0/0"], [1, "G0/1", 2, "G0/0"], [2, "G0/1", 3, "G0/0"], [3, "G0/1", 1, "G0/2"], [3, "G0/2", 4, "F0"]] },
      "lab-08": { nodes: [["router", "R1"], ["router", "R2"], ["router", "R3"], ["pc", "Test Host"]], links: [[0, "G0/0", 1, "G0/0"], [1, "G0/1", 2, "G0/0"], [2, "G0/1", 0, "G0/1"], [2, "G0/2", 3, "F0"]] },
      "lab-09": { nodes: [["pc", "AS 65001 Host"], ["router", "AS 65001"], ["router", "AS 65002"], ["pc", "AS 65002 Host"]], links: [[0, "F0", 1, "G0/0"], [1, "G0/1", 2, "G0/0"], [2, "G0/1", 3, "F0"]] },
      "lab-10": { nodes: [["router", "R1"], ["router", "R2"], ["router", "R3"], ["pc", "Prefix A"], ["pc", "Prefix B"]], links: [[0, "G0/0", 1, "G0/0"], [1, "G0/1", 2, "G0/0"], [2, "G0/1", 0, "G0/1"], [0, "G0/2", 3, "F0"], [2, "G0/2", 4, "F0"]] },
      "lab-11": { nodes: [["pc", "Inside Host A"], ["pc", "Inside Host B"], ["switch", "Inside Switch"], ["router", "NAT Router"], ["server", "Outside Web Server"]], links: [[0, "F0", 2, "F0/1"], [1, "F0", 2, "F0/2"], [2, "F0/3", 3, "G0/0"], [3, "G0/1", 4, "F0"]] },
      "lab-12": { nodes: [["pc", "DHCP Client"], ["switch", "Client LAN"], ["router", "DHCP Relay Router"], ["server", "DHCP + DNS Server"]], links: [[0, "F0", 1, "F0/1"], [1, "F0/2", 2, "G0/0"], [2, "G0/1", 3, "F0"]] },
      "lab-13": { nodes: [["pc", "Capture Client"], ["switch", "Capture Switch"], ["router", "Protocol Peer"], ["server", "DNS / Web Server"]], links: [[0, "F0", 1, "F0/1"], [1, "F0/2", 2, "G0/0"], [2, "G0/1", 3, "F0"]] },
      "lab-14": { nodes: [["pc", "Automation Controller"], ["switch", "Access Switch"], ["router", "Router 1"], ["router", "Router 2"], ["server", "Backup Target"]], links: [[0, "F0", 1, "F0/1"], [1, "F0/2", 2, "G0/0"], [1, "F0/3", 3, "G0/0"], [2, "G0/1", 4, "F0"]] },
      "lab-15": { nodes: [["pc", "Automation Controller"], ["switch", "Managed Switch"], ["router", "Managed Router"], ["server", "Verification Host"]], links: [[0, "F0", 1, "F0/1"], [1, "F0/2", 2, "G0/0"], [2, "G0/1", 3, "F0"]] }
    };
    const layout = layouts[id];
    if (!layout) {
      setStatus("No workspace starter topology is defined for this lab.", "bad");
      return;
    }
    const canvasWidth = state.baseWidth;
    const canvasHeight = state.baseHeight;
    const columns = Math.min(layout.nodes.length, Math.max(1, Math.floor((canvasWidth + 53) / 145)));
    const rows = Math.ceil(layout.nodes.length / columns);
    const maxX = (canvasWidth - 92) / canvasWidth * 100;
    const maxY = (canvasHeight - 78) / canvasHeight * 100;
    const startX = Math.min(5, maxX / 2);
    const endX = Math.max(startX, maxX - Math.min(5, maxX - startX));
    const startY = Math.min(8, maxY / 2);
    const endY = Math.max(startY, maxY - Math.min(8, maxY - startY));
    const devices = layout.nodes.map(([type, name], index) => {
      const device = newDevice(type, name, 0, 0);
      const column = index % columns, row = Math.floor(index / columns);
      device.x = columns === 1 ? maxX / 2 : startX + column / (columns - 1) * (endX - startX);
      device.y = rows === 1 ? maxY / 2 : startY + row / (rows - 1) * (endY - startY);
      return device;
    });
    const links = layout.links.map(([aIndex, aPort, bIndex, bPort]) => ({
      id: safeId("link"),
      a: { deviceId: devices[aIndex].id, port: aPort },
      b: { deviceId: devices[bIndex].id, port: bPort }
    }));
    state.devices = devices;
    state.links = links;
    state.selected = null;
    state.selectedLink = null;
    state.connectMode = false;
    state.connectFrom = null;
    state.events = [];
    state.pendingEvents = [];
    state.frames = [];
    state.activeGuide = id;
    $(".inspector").classList.add("open");
    updateDeviceDom();
    populateConfiguration();
    populateGuideList();
    renderEvents();
    renderCapture();
    persist(false);
    switchPanel("guide");
    fitWorkspaceView();
    setStatus(lab.title + " starter topology loaded. " + (lab.scope || "Configure the devices and run the listed checks."), "good");
  }
  function switchPanel(name) {
    const tab = $("#tab-" + name);
    if (!tab) return;
    document.querySelectorAll(".tab-button[role='tab']").forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
    document.querySelectorAll(".panel").forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute("aria-controls"); });
  }
  function setSimulationMode(mode) {
    state.mode = mode === "simulation" ? "simulation" : "realtime";
    $("#realtimeButton").setAttribute("aria-pressed", String(state.mode === "realtime"));
    $("#simulationButton").setAttribute("aria-pressed", String(state.mode === "simulation"));
    renderEvents();
    setStatus(state.mode === "realtime" ? "Realtime mode: packets are delivered immediately." : "Simulation mode: queue a PDU, then capture / forward it step by step.");
  }
  function hasEnabledLinkBetween(deviceIdA, deviceIdB) {
    return state.links.some((link) => {
      const forward = link.a.deviceId === deviceIdA && link.b.deviceId === deviceIdB;
      const reverse = link.a.deviceId === deviceIdB && link.b.deviceId === deviceIdA;
      if (!forward && !reverse) return false;
      const [a, b] = forward ? [link.a, link.b] : [link.b, link.a];
      return !!getDevice(a.deviceId)?.interfaces[a.port]?.up && !!getDevice(b.deviceId)?.interfaces[b.port]?.up;
    });
  }
  function stepSimulation() {
    const eventId = state.pendingEvents[0];
    const event = state.events.find((item) => item.id === eventId);
    if (!event) { state.pendingEvents.shift(); renderEvents(); return; }
    const route = Array.isArray(event.route) && event.route.length ? event.route : [event.sourceId];
    if (event.hopIndex < route.length - 1) {
      event.hopIndex++;
      const hop = getDevice(route[event.hopIndex]);
      if (!hop) {
        event.status = "Failed";
        state.pendingEvents.shift();
        renderEvents(); updateDeviceDom();
        setStatus("Simulated packet dropped: a device on the saved path no longer exists.", "bad");
        return;
      }
      const current = getDevice(route[event.hopIndex - 1]);
      if (!current || !hasEnabledLinkBetween(current.id, hop.id)) {
        event.status = "Failed";
        state.pendingEvents.shift();
        renderEvents(); updateDeviceDom();
        setStatus("Simulated packet dropped: the next link is missing or an interface is disabled.", "bad");
        return;
      }
      event.status = "At " + hop.name;
      event.time = (event.hopIndex * 0.001).toFixed(3);
      renderEvents(); updateDeviceDom();
      setStatus("Packet forwarded to " + hop.name + " (" + event.hopIndex + "/" + (route.length - 1) + ").", "good");
      return;
    }
    const source = getDevice(event.sourceId);
    const result = source ? canPing(source, event.destination) : { ok: false, reason: "Source device no longer exists." };
    event.status = result.ok ? "Success" : "Failed";
    event.time = (Math.max(1, event.hopIndex) * 0.001).toFixed(3);
    state.pendingEvents.shift();
    renderEvents(); updateDeviceDom();
    setStatus(result.ok ? "Simulated packet delivered to " + event.destination + "." : "Simulated packet dropped: " + result.reason, result.ok ? "good" : "bad");
    if (source) recordTraffic(source, event.destination, result.ok);
  }
  function repeatEvent(event) {
    const source = getDevice(event.sourceId);
    if (!source) { setStatus("Cannot repeat this PDU: its source device no longer exists.", "bad"); return; }
    state.pendingEvents = state.pendingEvents.filter((id) => id !== event.id);
    event.count++;
    event.time = 0;
    const result = canPing(source, event.destination);
    event.route = result.ok ? findTopologyPath(source, event.destination) : [source.id];
    event.hopIndex = 0;
    if (state.mode === "simulation") {
      event.status = "Queued";
      state.pendingEvents.push(event.id);
      renderEvents(); updateDeviceDom();
      setStatus("PDU queued again. Capture / Forward to inspect each hop.");
      return;
    }
    event.status = result.ok ? "Success" : "Failed";
    event.time = "0.001";
    renderEvents(); updateDeviceDom();
    setStatus((result.ok ? "Reply received from " : "Request timed out: ") + event.destination + ". " + result.reason, result.ok ? "good" : "bad");
    recordTraffic(source, event.destination, result.ok);
  }
  function getDeviceFrom(devices, id) { return devices.find((device) => device.id === id); }
  function validateTopology(data) {
    if (!data || !Array.isArray(data.devices) || !Array.isArray(data.links)) throw new Error("The file must contain devices and links arrays.");
    if (data.devices.length > 100 || data.links.length > 500) throw new Error("The topology exceeds the supported limit of 100 devices or 500 cables.");
    const ids = new Set(), linkIds = new Set(), ports = new Set();
    data.devices.forEach((device) => {
      if (!device || typeof device.id !== "string" || !device.id.trim() || device.id.length > 64 || ids.has(device.id) ||
        !supportedDeviceTypes.includes(device.type) || typeof device.name !== "string" || !device.name.trim() ||
        device.name.length > 24 || !device.interfaces || typeof device.interfaces !== "object" || Array.isArray(device.interfaces) ||
        !Number.isFinite(device.x) || device.x < 0 || device.x > 100 || !Number.isFinite(device.y) || device.y < 0 || device.y > 100 ||
        typeof device.gateway !== "string" || (device.gateway && ipToInt(device.gateway) === null) || !Array.isArray(device.routes)) {
        throw new Error("The file contains an invalid device.");
      }
      ids.add(device.id);
      const expectedPorts = interfacesFor(device.type);
      const hasAllRequiredPorts = expectedPorts.every((port) => Object.hasOwn(device.interfaces, port));
      const hasInvalidExtraPorts = Object.keys(device.interfaces).some((port) =>
        !expectedPorts.includes(port) && !(device.type === "router" && /^G0\/[0-2]\.\d+$/.test(port)));
      if (!hasAllRequiredPorts || hasInvalidExtraPorts) {
        throw new Error("The file contains an invalid interface list for " + device.name + ".");
      }
      Object.entries(device.interfaces).forEach(([name, config]) => {
        if (!name || !config || typeof config !== "object" || typeof config.up !== "boolean" ||
          typeof config.ip !== "string" || (config.ip && ipToInt(config.ip) === null) || !Number.isInteger(config.prefix) || !validPrefix(config.prefix) ||
          !Number.isInteger(config.vlan) || config.vlan < 1 || config.vlan > 4094) {
          throw new Error("The file contains an invalid interface.");
        }
      });
      device.routes.forEach((route) => {
        if (!route || ipToInt(route.network) === null || !Number.isInteger(route.prefix) || !validPrefix(route.prefix) || ipToInt(route.nextHop) === null) {
          throw new Error("The file contains an invalid static route.");
        }
      });
    });
    data.links.forEach((link) => {
      if (!link || typeof link.id !== "string" || !link.id.trim() || linkIds.has(link.id) || !link.a || !link.b ||
        typeof link.a.deviceId !== "string" || typeof link.b.deviceId !== "string" ||
        typeof link.a.port !== "string" || typeof link.b.port !== "string" ||
        link.a.deviceId === link.b.deviceId || !ids.has(link.a.deviceId) || !ids.has(link.b.deviceId)) {
        throw new Error("The file contains a link to a missing or invalid device.");
      }
      linkIds.add(link.id);
      const a = getDeviceFrom(data.devices, link.a.deviceId), b = getDeviceFrom(data.devices, link.b.deviceId);
      if (!a.interfaces[link.a.port] || !b.interfaces[link.b.port]) throw new Error("The file contains a link to a missing interface.");
      [link.a, link.b].forEach((end) => {
        const key = end.deviceId + ":" + end.port;
        if (ports.has(key)) throw new Error("An interface is connected to more than one cable.");
        ports.add(key);
      });
    });
    return data;
  }
  function exportTopology() {
    try {
      const data = { version: 1, devices: state.devices, links: state.links, activeGuide: state.activeGuide };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob), anchor = document.createElement("a");
      anchor.href = url; anchor.download = "network-lab-topology.json"; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Topology exported as JSON.", "good");
    } catch (error) { setStatus("Could not export topology: " + error.message, "bad"); }
  }
  async function importTopology(file) {
    if (!file) return;
    try {
      const data = validateTopology(JSON.parse(await file.text()));
      state.devices = data.devices; state.links = data.links;
      normalizeTopology();
      state.selected = null; state.selectedLink = null; state.connectMode = false; state.connectFrom = null;
      state.activeGuide = labs.some((lab) => lab.id === data.activeGuide) ? data.activeGuide : null;
      updateDeviceDom(); populateConfiguration(); populateGuideList(); persist(false);
      setStatus("Topology imported from " + file.name + ".", "good");
    } catch (error) { setStatus("Could not import topology: " + error.message, "bad"); }
  }
  function resetWorkspace() {
    state.devices = []; state.links = []; state.selected = null; state.selectedLink = null; state.activeGuide = null; state.connectMode = false; state.connectFrom = null; state.events = []; state.pendingEvents = []; state.frames = [];
    let storageError = "";
    try { localStorage.removeItem(storageKey); } catch (error) { storageError = error.message; }
    $(".inspector").classList.remove("open"); renderEvents(); renderCapture(); populateGuideList(); updateDeviceDom(); populateConfiguration(); setStatus("Topology cleared.");
    if (storageError) setStatus("Topology cleared, but saved browser data could not be removed: " + storageError, "bad");
  }
  function persist(showMessage) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ devices: state.devices, links: state.links, activeGuide: state.activeGuide }));
      if (showMessage !== false) setStatus("Lab saved in this browser.", "good");
    } catch (error) {
      setStatus("Could not save lab in browser storage: " + error.message, "bad");
    }
  }
  function loadSaved() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return false;
      const data = validateTopology(JSON.parse(saved));
      state.devices = data.devices; state.links = data.links; state.activeGuide = labs.some((lab) => lab.id === data.activeGuide) ? data.activeGuide : null;
      normalizeTopology();
      return true;
    } catch (error) {
      setStatus("Saved lab could not be loaded: " + error.message, "bad");
      return false;
    }
  }
  const bindAddButtons = () => {
    document.querySelectorAll(".device-add, [data-add]").forEach((button) => {
      if (button._labAddBound) return;
      button._labAddBound = true;
      const getMouse = (event) => {
        const x = event.clientX || (event.touches && event.touches[0] && event.touches[0].clientX);
        const y = event.clientY || (event.touches && event.touches[0] && event.touches[0].clientY);
        if (typeof x === "number") { window._lastLabMouseX = x; }
        if (typeof y === "number") { window._lastLabMouseY = y; }
      };
      const handler = (event) => {
        getMouse(event);
        event.preventDefault();
        event.stopPropagation();
        const type = button.dataset.add || button.getAttribute("data-add");
        if (!type) return;
        try {
          addDevice(type);
        } catch (err) {
          console.error("addDevice failed", err);
          if (typeof setStatus === "function") setStatus("Failed to add device: " + err.message, "bad");
        }
      };
      button.addEventListener("click", handler, true);
      button.addEventListener("mousedown", (event) => { getMouse(event); event.preventDefault(); }, true);
      button.addEventListener("touchstart", (event) => { getMouse(event); event.preventDefault(); }, { passive: false, capture: true });
    });
  };
  bindAddButtons();
  setInterval(bindAddButtons, 1000);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindAddButtons, { once: true });
  }
  window.addEventListener("load", bindAddButtons, { once: true });
  $("#connectToolbar").addEventListener("click", toggleConnectMode);
  $("#deleteButton").addEventListener("click", removeSelected);
  $(".menubar").addEventListener("click", (event) => {
    const action = event.target.closest("[data-menu-action]")?.dataset.menuAction;
    if (!action) return;
    document.querySelectorAll(".menubar details").forEach((menu) => { menu.open = false; });
    const actions = {
      save: () => persist(),
      import: () => $("#importFile").click(),
      export: exportTopology,
      reset: resetWorkspace,
      delete: removeSelected,
      "clear-events": () => $("#clearEventsButton").click(),
      realtime: () => setSimulationMode("realtime"),
      simulation: () => setSimulationMode("simulation"),
      arrange: () => $("#fitButton").click(),
      "close-panel": () => $(".inspector").classList.remove("open"),
      connect: toggleConnectMode,
      pdu: () => $("#pingButton").click(),
      cli: () => { $(".inspector").classList.add("open"); switchPanel("cli"); $("#cliInput").focus(); }
    };
    actions[action]?.();
  });
  $("#canvas").addEventListener("click", (event) => {
    if (state.suppressCanvasClick) { state.suppressCanvasClick = false; return; }
    if (event.target.closest(".device, .link-line")) return;
    if (state.connectMode) { setStatus("Select a device to connect."); return; }
    if (state.selected || state.selectedLink) { state.selected = null; state.selectedLink = null; populateConfiguration(); updateDeviceDom(); }
  });
  $("#applyConfig").addEventListener("click", applyConfiguration);
  $("#checkConfig").addEventListener("click", checkSelectedConfiguration);
  $("#interfaceSelect").addEventListener("change", () => { populateConfiguration(); $("#devicePortMode")?.dispatchEvent(new Event("change")); });
  $("#devicePortMode")?.addEventListener("change", (e) => { $("#trunkFields").hidden = e.target.value !== "trunk"; });
  $("#powerButton").addEventListener("click", () => {
    const device = getDevice(state.selected), port = device && device.interfaces[$("#interfaceSelect").value];
    if (!device || !port || isEndDevice(device.type)) return;
    port.up = !port.up; populateConfiguration(); updateDeviceDom(); persist();
    setStatus($("#interfaceSelect").value + (port.up ? " enabled." : " shut down."));
  });
  $("#pingButton").addEventListener("click", () => {
    const source = getDevice(state.selected);
    if (!source || !isEndDevice(source.type)) return;
    const destinationIp = $("#pduDestination").value;
    if (!destinationIp) { setStatus("Choose a configured destination before sending a PDU.", "bad"); return; }
    pingFrom(source, destinationIp, true);
  });
  $("#pduDestination").addEventListener("change", updateButtons);
  $("#cliForm").addEventListener("submit", (event) => { event.preventDefault(); const input = $("#cliInput"); runCli(input.value); input.value = ""; });
  $("#clearCaptureButton").addEventListener("click", () => { state.frames = []; renderCapture(); setStatus("Packet capture cleared."); });
  $("#captureFilter").addEventListener("input", renderCapture);
  document.querySelectorAll(".tab-button").forEach((button) => button.addEventListener("click", () => {
    switchPanel(button.id.replace("tab-", ""));
    if (button.id === "tab-capture") { renderCapture(); renderCaptureTab(); }
  }));
  $("#closeInspector").addEventListener("click", () => $(".inspector").classList.remove("open"));
  $("#cliToolbar").addEventListener("click", () => { $(".inspector").classList.add("open"); switchPanel("cli"); $("#cliInput").focus(); });
  $("#realtimeButton").addEventListener("click", () => setSimulationMode("realtime"));
  $("#simulationButton").addEventListener("click", () => setSimulationMode("simulation"));
  $("#stepButton").addEventListener("click", stepSimulation);
  $("#zoomOutButton").addEventListener("click", () => setWorkspaceZoom(state.zoom - 0.1));
  $("#zoomInButton").addEventListener("click", () => setWorkspaceZoom(state.zoom + 0.1));
  $("#fitViewButton").addEventListener("click", fitWorkspaceView);
  $("#clearEventsButton").addEventListener("click", () => { state.events = []; state.pendingEvents = []; renderEvents(); updateDeviceDom(); setStatus("Simulation event list cleared."); });
  $("#events").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = state.events.find((entry) => entry.id === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === "delete") {
      state.events = state.events.filter((entry) => entry.id !== item.id);
      state.pendingEvents = state.pendingEvents.filter((id) => id !== item.id);
      renderEvents(); updateDeviceDom(); return;
    }
    if (button.dataset.action === "fire") {
      repeatEvent(item);
    }
  });
  $("#importFile").addEventListener("change", (event) => { importTopology(event.target.files[0]); event.target.value = ""; });
  $("#fitButton").addEventListener("click", arrangeTopology);
  if (canvasViewport) {
    canvasViewport.addEventListener("mousemove", (event) => { window._lastLabMouseX = event.clientX; window._lastLabMouseY = event.clientY; });
  }
  canvasViewport.addEventListener("pointerdown", (event) => {
    const forcePan = state.spacePanning || event.button === 1;
    if (state.connectMode || (!forcePan && event.button !== 0) || (!forcePan && event.target.closest(".device, .link-line"))) return;
    event.preventDefault();
    const startX = event.clientX, startY = event.clientY;
    const scrollX = canvasViewport.scrollLeft, scrollY = canvasViewport.scrollTop;
    let moved = false;
    canvasViewport.classList.add("is-panning");
    canvasViewport.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const dx = moveEvent.clientX - startX, dy = moveEvent.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      canvasViewport.scrollLeft = scrollX - dx;
      canvasViewport.scrollTop = scrollY - dy;
    };
    const finish = () => {
      canvasViewport.classList.remove("is-panning");
      canvasViewport.removeEventListener("pointermove", move);
      canvasViewport.removeEventListener("pointerup", finish);
      canvasViewport.removeEventListener("pointercancel", finish);
      if (moved) {
        state.suppressCanvasClick = true;
        window.setTimeout(() => { state.suppressCanvasClick = false; }, 0);
      }
    };
    canvasViewport.addEventListener("pointermove", move);
    canvasViewport.addEventListener("pointerup", finish, { once: true });
    canvasViewport.addEventListener("pointercancel", finish, { once: true });
  });
  document.addEventListener("keydown", (event) => {
    const active = document.activeElement;
    const typing = active && (["INPUT", "SELECT", "TEXTAREA"].includes(active.tagName) || active.isContentEditable);
    if (event.key === "Escape") { $(".inspector").classList.remove("open"); return; }
    if (event.key === "Delete" && !typing) { removeSelected(); return; }
    if (event.code === "Space" && !typing) { state.spacePanning = true; event.preventDefault(); return; }
    if (!typing && (event.key === "+" || event.key === "=")) { setWorkspaceZoom(state.zoom + 0.1); return; }
    if (!typing && event.key === "-") { setWorkspaceZoom(state.zoom - 0.1); return; }
    if (!typing && event.key === "0") { fitWorkspaceView(); return; }
  });
  document.addEventListener("keyup", (event) => {
    if (event.code === "Space") state.spacePanning = false;
  });
  window.addEventListener("resize", resizeWorkspace);
  resizeWorkspace();
  const restored = loadSaved();
  updateDeviceDom(); populateConfiguration(); populateGuideList(); renderEvents();
  if (restored) {
    fitWorkspaceView();
    setStatus("Saved lab restored from this browser.");
  }
})();
