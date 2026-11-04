(function () {
  var root = document.getElementById("ipcalc");
  if (!root || root.dataset.init === "1") return;
  root.dataset.init = "1";

  var $ = function (sel, el) { return (el || root).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };

  /* ---------------- tabs ---------------- */
  var tabs = $$(".ipc-tabs button");
  var panels = $$("section[data-panel]");
  tabs.forEach(function (b) {
    b.addEventListener("click", function () {
      tabs.forEach(function (x) { x.classList.toggle("active", x === b); });
      panels.forEach(function (p) { p.hidden = p.dataset.panel !== b.dataset.tab; });
    });
  });

  /* ---------------- helpers ---------------- */
  function pad(n, w) { var s = String(n); while (s.length < w) s = "0" + s; return s; }
  function bin8(n) { return pad((n >>> 0).toString(2), 8); }
  function bin16(n) { return pad((n >>> 0).toString(2), 16); }
  function ipToInt(str) {
    var p = String(str).trim().split(".");
    if (p.length !== 4) return null;
    var out = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(p[i])) return null;
      var v = Number(p[i]);
      if (v > 255) return null;
      out = (out * 256) + v;
    }
    return out >>> 0;
  }
  function intToIp(n) {
    n = n >>> 0;
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }
  function bin32(n) {
    n = n >>> 0;
    return [bin8(n >>> 24), bin8((n >>> 16) & 255), bin8((n >>> 8) & 255), bin8(n & 255)].join(".");
  }
  function card(k, v, hero) {
    return '<div class="ipc-card' + (hero ? " hero" : "") + '"><div class="k">' + k + '</div><div class="v">' + v + "</div></div>";
  }
  function bitsGrid(n, prefix) {
    var html = '<div class="ipc-bits">';
    for (var o = 0; o < 4; o++) {
      var oct = (n >>> (8 * (3 - o))) & 255;
      var b = bin8(oct);
      html += '<div class="ipc-octet"><div class="lbl">' + oct + "</div><div class=\"ipc-bitrow\">";
      for (var i = 0; i < 8; i++) {
        var bitPos = o * 8 + i;
        var cls = bitPos < prefix ? "net" : "host";
        if (b[i] === "1") cls += " one";
        html += '<span class="ipc-bit ' + cls + '">' + b[i] + "</span>";
      }
      html += "</div></div>";
    }
    html += "</div>";
    return html;
  }

  /* ---------------- IPv4 ---------------- */
  var v4inputs = $$("#v4octets input");
  var v4prefix = $("#v4prefix");
  var v4warn = $("#v4warn");

  function specialV4(ip) {
    var a = (ip >>> 24) & 255, b = (ip >>> 16) & 255;
    if (a === 0) return "This network (0.0.0.0/8) — invalid as a host address";
    if (a === 10) return "Private — RFC 1918";
    if (a === 127) return "Loopback";
    if (a === 169 && b === 254) return "Link-local / APIPA — DHCP did not answer";
    if (a === 172 && b >= 16 && b <= 31) return "Private — RFC 1918";
    if (a === 192 && b === 168) return "Private — RFC 1918";
    if (a === 100 && b >= 64 && b <= 127) return "CGNAT — RFC 6598";
    if (a === 192 && b === 0) return "IETF protocol assignment / documentation";
    if (a === 198 && (b === 18 || b === 19)) return "Benchmarking — RFC 2544";
    if (a === 198 && b === 51) return "Documentation — RFC 5737";
    if (a === 203 && b === 0) return "Documentation — RFC 5737";
    if (a >= 224 && a <= 239) return "Multicast";
    if (a >= 240) return "Reserved (includes 255.255.255.255 broadcast)";
    return "Public — globally routable";
  }
  function classV4(ip) {
    var a = (ip >>> 24) & 255;
    if (a >= 1 && a <= 126) return "A (1–126, /8 default)";
    if (a === 127) return "A — reserved for loopback";
    if (a >= 128 && a <= 191) return "B (128–191, /16 default)";
    if (a >= 192 && a <= 223) return "C (192–223, /24 default)";
    if (a >= 224 && a <= 239) return "D — multicast";
    return "E — reserved";
  }

  function renderV4() {
    var parts = v4inputs.map(function (i) { return i.value.trim(); });
    var ip = ipToInt(parts.join("."));
    var p = parseInt(v4prefix.value, 10);
    var msgs = [];
    if (ip === null) msgs.push("Address must be four numbers, each 0–255.");
    if (isNaN(p) || p < 0 || p > 32) msgs.push("Prefix must be between 0 and 32.");
    if (msgs.length) {
      v4warn.hidden = false; v4warn.textContent = msgs.join(" ");
      $("#v4results").innerHTML = ""; $("#v4and").innerHTML = ""; $("#v4weights").innerHTML = "";
      return;
    }
    v4warn.hidden = true;

    var mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
    var wild = (~mask) >>> 0;
    var net = (ip & mask) >>> 0;
    var bcast = (net | wild) >>> 0;
    var hostBits = 32 - p;
    var total = Math.pow(2, hostBits);
    var usable;
    if (p === 32) usable = 1;
    else if (p === 31) usable = 2;
    else usable = total - 2;
    var first = p >= 31 ? net : (net + 1) >>> 0;
    var last = p >= 31 ? bcast : (bcast - 1) >>> 0;

    var block = (p % 8 === 0) ? 256 : Math.pow(2, 8 - (p % 8));
    var interesting = Math.min(3, Math.floor(p / 8));

    var mappedFull = "0000:0000:0000:0000:0000:ffff:" +
      pad(((ip >>> 24) & 255).toString(16), 2) + pad(((ip >>> 16) & 255).toString(16), 2) + ":" +
      pad(((ip >>> 8) & 255).toString(16), 2) + pad((ip & 255).toString(16), 2);
    var mappedShort = "::ffff:" + intToIp(ip);

    var flags = [];
    if (ip === net) flags.push("the network address");
    if (ip === bcast) flags.push("the broadcast address");
    if (p <= 30 && ip !== net && ip !== bcast) flags.push("a usable host address");
    if (p === 31) flags.push("a /31 point-to-point address (RFC 3021)");
    if (p === 32) flags.push("a /32 host route");

    var usableRange;
    if (p === 32) usableRange = intToIp(ip) + " (single host)";
    else if (p === 31) usableRange = intToIp(net) + " – " + intToIp(bcast) + " (both usable, RFC 3021)";
    else usableRange = intToIp(first) + " – " + intToIp(last);

    var mappedBin = "0000000000000000:0000000000000000:0000000000000000:0000000000000000:0000000000000000:1111111111111111:" +
      bin16(((ip >>> 24) << 8) | ((ip >>> 16) & 255)) + ":" +
      bin16((((ip >>> 8) & 255) << 8) | (ip & 255));

    var html = "";
    html += card("Network address", intToIp(net), true);
    html += card("Broadcast address", intToIp(bcast));
    html += card("Usable host range", usableRange);
    html += card("First usable host", intToIp(first));
    html += card("Last usable host", intToIp(last));
    html += card("Usable hosts", usable.toLocaleString());
    html += card("Total addresses", total.toLocaleString());
    html += card("Subnet mask", intToIp(mask));
    html += card("Wildcard mask", intToIp(wild));
    html += card("CIDR", intToIp(ip) + "/" + p);
    html += card("Block size", block + (p < 32 ? " (octet " + (interesting + 1) + ")" : ""));
    html += card("Network / host bits", p + " / " + hostBits);
    html += card("Class", classV4(ip));
    html += card("Address type", specialV4(ip));
    html += card("This address is", flags.join(", "));
    html += '<div class="ipc-card ipc-acl-card"><div class="k">WEB ACL · INBOUND</div><div class="v"><code>' +
      "permit tcp " + intToIp(net) + " " + intToIp(wild) + " any eq 80" +
      "<br>permit tcp " + intToIp(net) + " " + intToIp(wild) + " any eq 443" +
      "</code><small>Other traffic is denied.</small></div></div>";
    html += card("IPv4-mapped IPv6", mappedFull + "<br>" + mappedShort);
    html += card("Mapped address, 128 bits", mappedBin);
    $("#v4results").innerHTML = html;

    var andHtml = '<div class="ipc-scroll"><table class="ipc-table"><thead><tr><th>Step</th><th>Binary (32 bits)</th></tr></thead><tbody>';
    andHtml += '<tr><td>Address</td><td class="mono">' + bin32(ip) + "</td></tr>";
    andHtml += '<tr><td>Mask</td><td class="mono">' + bin32(mask) + "</td></tr>";
    andHtml += '<tr><td><strong>AND → network</strong></td><td class="mono"><strong>' + bin32(net) + "</strong></td></tr>";
    andHtml += '<tr><td>NOT mask</td><td class="mono">' + bin32(wild) + "</td></tr>";
    andHtml += '<tr><td>Network OR wildcard → broadcast</td><td class="mono">' + bin32(bcast) + "</td></tr>";
    andHtml += "</tbody></table></div>";
    andHtml += bitsGrid(ip, p);
    andHtml += '<div class="ipc-legend"><span><i style="background:var(--ipc-net);border:1px solid #93c5fd"></i>network bits (' + p + ")</span>" +
      '<span><i style="background:var(--ipc-host);border:1px solid #fcd34d"></i>host bits (' + hostBits + ")</span></div>";
    $("#v4and").innerHTML = andHtml;

    var w = '<div class="ipc-bits">';
    for (var o = 0; o < 4; o++) {
      var oct = (ip >>> (8 * (3 - o))) & 255;
      var bits = bin8(oct);
      var sum = [];
      for (var i = 0; i < 8; i++) if (bits[i] === "1") sum.push([128, 64, 32, 16, 8, 4, 2, 1][i]);
      w += '<div class="ipc-octet"><div class="lbl">' + bits + "</div><div class=\"ipc-bitrow\">";
      for (var k = 0; k < 8; k++) {
        w += '<span class="ipc-bit ' + (bits[k] === "1" ? "net one" : "") + '">' + [128, 64, 32, 16, 8, 4, 2, 1][k] + "</span>";
      }
      w += '</div><div class="lbl" style="margin-top:4px">' + oct + " = " + (sum.length ? sum.join(" + ") : "0") + "</div></div>";
    }
    w += "</div>";
    $("#v4weights").innerHTML = w;
  }

  v4inputs.forEach(function (inp) {
    inp.addEventListener("input", function () {
      inp.value = inp.value.replace(/[^\d]/g, "").slice(0, 3);
      if (inp.value.length === 3 || Number(inp.value) > 25) {
        var idx = v4inputs.indexOf(inp);
        if (idx < 3) v4inputs[idx + 1].focus();
      }
      renderV4();
    });
    inp.addEventListener("keydown", function (e) {
      var idx = v4inputs.indexOf(inp);
      if (e.key === "." && idx < 3) { e.preventDefault(); v4inputs[idx + 1].focus(); }
      if (e.key === "Backspace" && inp.value === "" && idx > 0) v4inputs[idx - 1].focus();
      if (e.key === "ArrowRight" && idx < 3) v4inputs[idx + 1].focus();
      if (e.key === "ArrowLeft" && idx > 0) v4inputs[idx - 1].focus();
    });
  });
  v4prefix.addEventListener("input", function () {
    var v = parseInt(v4prefix.value, 10);
    if (!isNaN(v)) { v = Math.max(0, Math.min(32, v)); }
    renderV4();
  });
  $$("[data-p]").forEach(function (b) {
    b.addEventListener("click", function () { v4prefix.value = b.dataset.p; renderV4(); });
  });

  /* ---------------- IPv6 ---------------- */
  function parseV6(input) {
    var s = String(input).trim();
    if (!s) return { error: "Enter an IPv6 address." };
    s = s.replace(/^\[|\]$/g, "").split("%")[0];
    var v4 = s.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (v4) {
      var o = v4[1].split(".").map(Number);
      if (o.some(function (x) { return x > 255; })) return { error: "Embedded IPv4 octet is above 255." };
      var g1 = ((o[0] << 8) | o[1]).toString(16);
      var g2 = ((o[2] << 8) | o[3]).toString(16);
      s = s.slice(0, v4.index) + g1 + ":" + g2;
    }
    var halves = s.split("::");
    if (halves.length > 2) return { error: "Only one :: is allowed." };
    var head = halves[0] ? halves[0].split(":") : [];
    var tail = halves.length === 2 ? (halves[1] ? halves[1].split(":") : []) : [];
    var groups;
    if (halves.length === 2) {
      var missing = 8 - head.length - tail.length;
      if (missing < 1) return { error: ":: must stand for at least one zero group." };
      groups = head.concat(new Array(missing).fill("0"), tail);
    } else {
      groups = head;
    }
    if (groups.length !== 8) return { error: "An IPv6 address needs exactly 8 groups (found " + groups.length + ")." };
    var nums = [];
    for (var i = 0; i < 8; i++) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(groups[i])) return { error: 'Group "' + groups[i] + '" is not 1–4 hex digits.' };
      nums.push(parseInt(groups[i], 16));
    }
    var val = 0n;
    nums.forEach(function (n) { val = (val << 16n) | BigInt(n); });
    return { groups: nums, value: val };
  }

  function compressV6(nums) {
    var best = -1, bestLen = 0, cur = -1, curLen = 0;
    for (var i = 0; i < 8; i++) {
      if (nums[i] === 0) {
        if (cur === -1) { cur = i; curLen = 0; }
        curLen++;
        if (curLen > bestLen) { bestLen = curLen; best = cur; }
      } else { cur = -1; curLen = 0; }
    }
    var hex = nums.map(function (n) { return n.toString(16); });
    if (bestLen < 2) return hex.join(":");
    var left = hex.slice(0, best).join(":");
    var right = hex.slice(best + bestLen).join(":");
    return left + "::" + right;
  }
  function expandV6(nums) {
    return nums.map(function (n) { return pad(n.toString(16), 4); }).join(":");
  }
  function v6FromBigInt(v) {
    var out = [];
    for (var i = 7; i >= 0; i--) out[i] = Number((v >> BigInt(16 * (7 - i))) & 0xffffn);
    return out;
  }
  function v6StartsWith(val, prefixStr, bits) {
    var target = parseV6(prefixStr);
    if (target.error) return false;
    var shift = BigInt(128 - bits);
    return (val >> shift) === (target.value >> shift);
  }
  function typeV6(nums, val) {
    if (val === 0n) return "Unspecified (::)";
    if (expandV6(nums) === "0000:0000:0000:0000:0000:0000:0000:0001") return "Loopback (::1)";
    if (v6StartsWith(val, "fe80::", 10)) return "Link-local (fe80::/10) — single link only";
    if (v6StartsWith(val, "fec0::", 10)) return "Site-local (fec0::/10) — deprecated";
    if (v6StartsWith(val, "fc00::", 7)) return "Unique local (fc00::/7) — private";
    if (v6StartsWith(val, "ff00::", 8)) return "Multicast (ff00::/8)";
    if (v6StartsWith(val, "2001:db8::", 32)) return "Documentation (2001:db8::/32) — examples only";
    if (v6StartsWith(val, "2002::", 16)) return "6to4 (2002::/16) — deprecated";
    if (v6StartsWith(val, "2001::", 32)) return "Teredo (2001::/32)";
    if (v6StartsWith(val, "::ffff:0:0", 96)) return "IPv4-mapped (::ffff:0:0/96)";
    if (v6StartsWith(val, "64:ff9b::", 96)) return "NAT64 (64:ff9b::/96)";
    if (v6StartsWith(val, "2000::", 3)) return "Global unicast (2000::/3)";
    return "Reserved / other";
  }
  function humanBig(n) {
    var s = n.toString();
    if (s.length <= 18) return Number(s).toLocaleString();
    var exp = s.length - 1;
    var mant = Number(s[0] + "." + s.slice(1, 3));
    return "≈ " + mant + " × 10^" + exp;
  }

  var v6addr = $("#v6addr");
  var v6prefix = $("#v6prefix");
  var v6warn = $("#v6warn");

  function renderV6() {
    var res = parseV6(v6addr.value);
    var p = parseInt(v6prefix.value, 10);
    if (res.error || isNaN(p) || p < 0 || p > 128) {
      v6warn.hidden = false;
      v6warn.textContent = res.error || "Prefix must be between 0 and 128.";
      $("#v6results").innerHTML = ""; $("#v6hextets").innerHTML = ""; $("#v6bits").innerHTML = "";
      return;
    }
    v6warn.hidden = true;

    var hostBits = 128 - p;
    var fullMask = (1n << 128n) - 1n;
    var hostMask = hostBits === 0 ? 0n : (1n << BigInt(hostBits)) - 1n;
    var mask = fullMask ^ hostMask;
    var net = res.value & mask;
    var last = net | hostMask;
    var total = 1n << BigInt(hostBits);

    var netNums = v6FromBigInt(net);
    var lastNums = v6FromBigInt(last);

    var html = "";
    html += card("Expanded form", expandV6(res.groups));
    html += card("Compressed form", compressV6(res.groups), true);
    html += card("Network", compressV6(netNums) + "/" + p);
    html += card("Last address", compressV6(lastNums));
    html += card("Addresses in this prefix", humanBig(total));
    html += card("Exact count", total.toString());
    html += card("Prefix / host bits", p + " / " + hostBits);
    html += card("Address type", typeV6(res.groups, res.value));
    html += card("Interface ID", res.groups.slice(4).map(function (n) { return pad(n.toString(16), 4); }).join(":"));
    html += card("Zone", v6addr.value.indexOf("%") >= 0 ? v6addr.value.split("%")[1] : "none");
    $("#v6results").innerHTML = html;

    var h = '<div class="ipc-scroll"><table class="ipc-table"><thead><tr><th>#</th><th>Hex</th><th>Decimal</th><th>16-bit binary</th><th>Part</th></tr></thead><tbody>';
    res.groups.forEach(function (n, i) {
      var part = i < 4 ? "network / routing prefix" : "interface ID";
      h += "<tr><td>" + (i + 1) + "</td><td class=\"mono\">" + pad(n.toString(16), 4) + "</td><td class=\"mono\">" + n +
        "</td><td class=\"mono\">" + bin16(n) + "</td><td>" + part + "</td></tr>";
    });
    h += "</tbody></table></div>";
    $("#v6hextets").innerHTML = h;

    var b = "";
    var allBits = res.groups.map(bin16).join("");
    for (var i = 0; i < 8; i++) {
      var chunk = allBits.slice(i * 16, i * 16 + 16);
      var cls = i * 16 < p ? "net" : "host";
      b += '<div class="ipc-octet" style="margin-right:14px;margin-bottom:10px"><div class="lbl">' + pad(i + 1, 2) + '</div><div class="ipc-bitrow">';
      for (var k = 0; k < 16; k++) {
        b += '<span class="ipc-bit ' + (cls === "net" ? "net" : "host") + (chunk[k] === "1" ? " one" : "") + '">' + chunk[k] + "</span>";
      }
      b += "</div></div>";
    }
    $("#v6bits").innerHTML = '<div class="ipc-bits">' + b + "</div>" +
      '<div class="ipc-legend"><span><i style="background:var(--ipc-net);border:1px solid #93c5fd"></i>prefix (' + p + ")</span>" +
      '<span><i style="background:var(--ipc-host);border:1px solid #fcd34d"></i>host (' + hostBits + ")</span></div>";
  }

  v6addr.addEventListener("input", renderV6);
  v6prefix.addEventListener("input", renderV6);
  $$("[data-p6]").forEach(function (b) {
    b.addEventListener("click", function () { v6prefix.value = b.dataset.p6; renderV6(); });
  });

  /* ---------------- practice ---------------- */
  var pq = { ip: 0, p: 0 };
  var fields = {
    net: $("#pq-net"), bcast: $("#pq-bcast"), first: $("#pq-first"),
    last: $("#pq-last"), hosts: $("#pq-hosts")
  };

  function newProblem() {
    pq.p = [8, 16, 20, 22, 24, 25, 26, 27, 28, 29, 30][Math.floor(Math.random() * 11)];
    pq.ip = Math.floor(Math.random() * 4294967296) >>> 0;
    $("#pq-question").textContent = intToIp(pq.ip) + " / " + pq.p;
    Object.keys(fields).forEach(function (k) { fields[k].value = ""; fields[k].classList.remove("ipc-bad"); });
    $("#pq-result").innerHTML = "";
    $("#pq-solution").hidden = true;
    fields.net.focus();
  }

  function answer() {
    var p = pq.p;
    var mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
    var net = (pq.ip & mask) >>> 0;
    var bcast = (net | ((~mask) >>> 0)) >>> 0;
    var first = p >= 31 ? net : (net + 1) >>> 0;
    var last = p >= 31 ? bcast : (bcast - 1) >>> 0;
    var hosts = p === 32 ? 1 : p === 31 ? 2 : Math.pow(2, 32 - p) - 2;
    return { net: intToIp(net), bcast: intToIp(bcast), first: intToIp(first), last: intToIp(last), hosts: String(hosts) };
  }

  $("#pq-new").addEventListener("click", newProblem);

  $("#pq-check").addEventListener("click", function () {
    var a = answer();
    var names = { net: "Network", bcast: "Broadcast", first: "First host", last: "Last host", hosts: "Usable hosts" };
    var html = "", allOk = true;
    Object.keys(fields).forEach(function (k) {
      var given = fields[k].value.trim().toLowerCase();
      var ok = given === a[k].toLowerCase();
      if (!ok) allOk = false;
      fields[k].classList.toggle("ipc-bad", !ok && given !== "");
      html += '<div class="row"><span class="name">' + names[k] + "</span>" +
        '<span class="val">' + (ok ? '<span class="ipc-ok">✓ correct</span>' :
          '<span class="ipc-bad">✗ ' + (given === "" ? "blank" : given) + "</span> → " + a[k]) + "</span></div>";
    });
    html = '<div style="margin-bottom:8px;font-weight:700" class="' + (allOk ? "ipc-ok" : "ipc-bad") + '">' +
      (allOk ? "All correct. Move on." : "Keep going — the fixes are on the right.") + "</div>" + html;
    $("#pq-result").innerHTML = html;
  });

  $("#pq-show").addEventListener("click", function () {
    var a = answer();
    var block = pq.p % 8 === 0 ? 256 : Math.pow(2, 8 - (pq.p % 8));
    var mask = pq.p === 0 ? 0 : (0xFFFFFFFF << (32 - pq.p)) >>> 0;
    var net = (pq.ip & mask) >>> 0;
    var html = "<strong>How to get there</strong><br>" +
      "Prefix /" + pq.p + " → mask <code>" + intToIp(mask) + "</code>, host bits " + (32 - pq.p) + ".<br>" +
      "Block size = 256 − " + ((mask >>> (8 * (3 - Math.min(3, Math.floor(pq.p / 8))))) & 255) + " = <code>" + block + "</code>.<br>" +
      "Network = highest multiple of " + block + " at or below the address → <code>" + a.net + "</code>.<br>" +
      "Broadcast = next block − 1 → <code>" + a.bcast + "</code>.<br>" +
      "Usable = <code>" + a.first + "</code> – <code>" + a.last + "</code> (" + a.hosts + " hosts).";
    $("#pq-solution").innerHTML = html;
    $("#pq-solution").hidden = false;
  });

  ["pq-net", "pq-bcast", "pq-first", "pq-last", "pq-hosts"].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter") document.getElementById("pq-check").click(); });
  });

  /* ---------------- helpers for the extra tools ---------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parseCidr4(s) {
    var m = String(s).trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d{1,2})$/);
    if (!m) return null;
    var ip = ipToInt(m[1]);
    var p = parseInt(m[2], 10);
    if (ip === null || isNaN(p) || p < 0 || p > 32) return null;
    var mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
    return { ip: ip, prefix: p, mask: mask, network: (ip & mask) >>> 0 };
  }
  function prefixForHosts(h) {
    if (h <= 2) return 30;
    var bits = Math.ceil(Math.log2(h + 2));
    return Math.max(0, Math.min(30, 32 - bits));
  }

  /* ---------------- VLSM planner ---------------- */
  var vlsmBase = $("#vlsm-base");
  var vlsmRows = $("#vlsm-rows");
  var vlsmWarn = $("#vlsm-warn");

  function addVlsmRow(name, hosts) {
    var row = document.createElement("div");
    row.className = "ipc-vlsm-row";

    var nin = document.createElement("input");
    nin.className = "ipc-vlsm-name";
    nin.placeholder = "Subnet name";
    nin.value = name || "";

    var hin = document.createElement("input");
    hin.className = "ipc-vlsm-hosts";
    hin.type = "number";
    hin.min = "1";
    hin.step = "1";
    hin.placeholder = "Hosts";
    hin.value = hosts ? String(hosts) : "";

    nin.addEventListener("input", runVlsm);
    hin.addEventListener("input", runVlsm);

    var del = document.createElement("button");
    del.className = "ipc-vlsm-del";
    del.type = "button";
    del.textContent = "×";
    del.title = "Remove";
    del.addEventListener("click", function () { row.remove(); runVlsm(); });

    row.appendChild(nin);
    row.appendChild(hin);
    row.appendChild(del);
    vlsmRows.appendChild(row);
  }

  function runVlsm() {
    var base = parseCidr4(vlsmBase.value);
    var out = $("#vlsm-out");
    if (!base) {
      vlsmWarn.hidden = false;
      vlsmWarn.textContent = "Base network must look like 10.0.0.0/24.";
      out.innerHTML = "";
      return;
    }
    var reqs = [];
    $$(".ipc-vlsm-row", vlsmRows).forEach(function (r) {
      var h = parseInt(r.querySelector(".ipc-vlsm-hosts").value, 10);
      var n = r.querySelector(".ipc-vlsm-name").value.trim();
      if (!isNaN(h) && h > 0) reqs.push({ name: n || "Subnet", hosts: h });
    });
    if (!reqs.length) {
      vlsmWarn.hidden = false;
      vlsmWarn.textContent = "Add at least one subnet with a host count.";
      out.innerHTML = "";
      return;
    }

    reqs.sort(function (a, b) { return b.hosts - a.hosts; });

    var cur = base.network;
    var end = base.network + Math.pow(2, 32 - base.prefix);
    var rows = [];
    var failed = null;
    var used = 0;
    var spareTotal = 0;

    for (var i = 0; i < reqs.length; i++) {
      var r = reqs[i];
      var need = prefixForHosts(r.hosts);
      if (need < base.prefix) { failed = { name: r.name, hosts: r.hosts, big: true }; break; }
      var p = need;
      var size = Math.pow(2, 32 - p);
      var start = Math.ceil(cur / size) * size;
      if (start + size > end) { failed = r; break; }
      var mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
      rows.push({
        name: r.name,
        hosts: r.hosts,
        prefix: p,
        size: size,
        network: start,
        bcast: start + size - 1,
        first: start + 1,
        last: start + size - 2,
        mask: mask,
        spare: size - 2 - r.hosts
      });
      cur = start + size;
      used += size;
      spareTotal += size - 2 - r.hosts;
    }

    vlsmWarn.hidden = !failed;
    if (failed) {
      if (failed.big) {
        vlsmWarn.textContent = failed.name + " needs " + failed.hosts + " hosts (/" +
          prefixForHosts(failed.hosts) + "), which does not fit: it is larger than the base network " +
          intToIp(base.network) + "/" + base.prefix + ".";
      } else {
        vlsmWarn.textContent = failed.name + " needs " + failed.hosts + " hosts (/" +
          prefixForHosts(failed.hosts) + "), which does not fit in " +
          intToIp(base.network) + "/" + base.prefix + ". Free addresses left: " + (end - cur) + ".";
      }
    }
    if (!rows.length) { out.innerHTML = ""; return; }

    var html = '<div class="ipc-scroll"><table class="ipc-table"><thead><tr>' +
      "<th>#</th><th>Name</th><th>Needed</th><th>Prefix</th><th>Network</th><th>Mask</th>" +
      '<th>Usable range</th><th>Broadcast</th>' +
      '<th title="Usable addresses left over inside each allocated subnet. They cannot be moved to another subnet.">Unused hosts</th></tr></thead><tbody>';
    rows.forEach(function (r, i) {
      html += "<tr><td>" + (i + 1) + "</td><td>" + esc(r.name) +
        '</td><td class="mono">' + r.hosts +
        '</td><td class="mono">/' + r.prefix +
        '</td><td class="mono">' + intToIp(r.network) +
        '</td><td class="mono">' + intToIp(r.mask) +
        '</td><td class="mono">' + intToIp(r.first) + " – " + intToIp(r.last) +
        '</td><td class="mono">' + intToIp(r.bcast) +
        '</td><td class="mono">' + r.spare + "</td></tr>";
    });
    if (failed) {
      html += '<tr class="ipc-vlsm-fail"><td>—</td><td>' + esc(failed.name) +
        '</td><td class="mono">' + failed.hosts +
        '</td><td class="mono">/' + prefixForHosts(failed.hosts) +
        '</td><td class="mono" colspan="5">Does not fit in ' +
        intToIp(base.network) + "/" + base.prefix + "</td></tr>";
    }
    html += "</tbody></table></div>";

    var free = end - cur;
    html += '<div class="ipc-results" style="margin-top:14px">' +
      card("Subnets allocated", String(rows.length)) +
      card("Addresses used", used.toLocaleString()) +
      card("Unallocated addresses", free.toLocaleString()) +
      card("Unused hosts (in subnets)", spareTotal.toLocaleString()) +
      "</div>";
    if (free > 0) {
      html += '<p class="ipc-note" style="margin-top:10px">Next free address: <strong>' +
        intToIp(cur) + "</strong>. The remainder is " + free + " addresses.</p>";
    }
    if (spareTotal > 0) {
      html += '<p class="ipc-note" style="margin-top:6px">Unused hosts are spare capacity inside the subnets above. ' +
        (free === 0
          ? "Every address in the base network is already allocated, so that spare space cannot be moved to another subnet."
          : "Only the " + free + " unallocated addresses can be used for new subnets.") +
        "</p>";
    }
    out.innerHTML = html;
  }

  vlsmBase.addEventListener("input", runVlsm);
  $("#vlsm-add").addEventListener("click", function () { addVlsmRow("", ""); });
  $("#vlsm-run").addEventListener("click", runVlsm);

  /* ---------------- IPv6 splitter ---------------- */
  var splitBase = $("#split-base");
  var splitLen = $("#split-len");
  var splitWarn = $("#split-warn");

  function runSplit() {
    var m = String(splitBase.value).trim().match(/^(.+)\/(\d{1,3})$/);
    var target = parseInt(splitLen.value, 10);
    if (!m) {
      splitWarn.hidden = false;
      splitWarn.textContent = "Base prefix must look like 2001:db8:1234::/48.";
      $("#split-summary").innerHTML = "";
      $("#split-out").innerHTML = "";
      return;
    }
    var parsed = parseV6(m[1]);
    var p = parseInt(m[2], 10);
    if (parsed.error || isNaN(p) || p < 0 || p > 128) {
      splitWarn.hidden = false;
      splitWarn.textContent = parsed.error || "Base prefix must be between 0 and 128.";
      $("#split-summary").innerHTML = "";
      $("#split-out").innerHTML = "";
      return;
    }
    if (isNaN(target) || target < 0 || target > 128) {
      splitWarn.hidden = false;
      splitWarn.textContent = "Target prefix must be between 0 and 128.";
      return;
    }
    if (target <= p) {
      splitWarn.hidden = false;
      splitWarn.textContent = "Target prefix must be longer than /" + p + ". Use /" + (p + 1) + " or bigger.";
      $("#split-summary").innerHTML = "";
      $("#split-out").innerHTML = "";
      return;
    }
    splitWarn.hidden = true;

    var hb = 128 - p;
    var mask = p === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(hb)) - 1n);
    var net = parsed.value & mask;
    var count = 1n << BigInt(target - p);
    var step = 1n << BigInt(128 - target);
    var shown = count > 256n ? 256n : count;

    $("#split-summary").innerHTML =
      card("Base", compressV6(v6FromBigInt(net)) + "/" + p, true) +
      card("Each subnet", "/" + target) +
      card("Number of subnets", humanBig(count)) +
      card("Addresses per subnet", humanBig(step));

    var html = '<div class="ipc-scroll"><table class="ipc-table"><thead><tr>' +
      "<th>#</th><th>Prefix</th><th>First address</th><th>Last address</th></tr></thead><tbody>";
    for (var i = 0n; i < shown; i++) {
      var start = net + i * step;
      var last = start + step - 1n;
      html += "<tr><td>" + i.toString() + '</td><td class="mono">' +
        compressV6(v6FromBigInt(start)) + "/" + target +
        '</td><td class="mono">' + compressV6(v6FromBigInt(start)) +
        '</td><td class="mono">' + compressV6(v6FromBigInt(last)) + "</td></tr>";
    }
    html += "</tbody></table></div>";
    if (count > shown) {
      html += '<p class="ipc-note" style="margin-top:10px">Showing the first ' + shown.toString() +
        " of " + count.toString() + " subnets. Every further subnet adds 1 to the last subnet bit.</p>";
    }
    $("#split-out").innerHTML = html;
  }

  splitBase.addEventListener("input", runSplit);
  splitLen.addEventListener("input", runSplit);
  $("#split-run").addEventListener("click", runSplit);

  /* ---------------- EUI-64 ---------------- */
  var euiMac = $("#eui-mac");

  function renderEui() {
    var out = $("#eui-out");
    var hex = euiMac.value.replace(/[^0-9a-fA-F]/g, "");
    if (hex.length !== 12) {
      out.innerHTML = card("EUI-64", "Enter a MAC address with 12 hex digits.");
      return;
    }
    var o = hex.match(/../g).map(function (x) { return parseInt(x, 16); });
    o[0] = o[0] ^ 0x02;
    var g = [
      (o[0] << 8) | o[1],
      (o[2] << 8) | 0xff,
      (0xfe << 8) | o[3],
      (o[4] << 8) | o[5]
    ];
    var euiStr = g.map(function (n) { return pad(n.toString(16), 4); }).join(":");
    var ll = compressV6([0xfe80, 0, 0, 0].concat(g));

    var html = card("Modified EUI-64", euiStr, true) + card("Link-local address", ll + "/64");

    var p = parseInt(v6prefix.value, 10);
    var cur = parseV6(v6addr.value);
    if (!cur.error && !isNaN(p) && p <= 64) {
      var hb = 128 - p;
      var mk = p === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(hb)) - 1n);
      var netV = cur.value & mk;
      var euiVal = 0n;
      g.forEach(function (n) { euiVal = (euiVal << 16n) | BigInt(n); });
      html += card("SLAAC address in this prefix", compressV6(v6FromBigInt(netV | euiVal)) + "/" + p);
    }
    out.innerHTML = html;
  }

  euiMac.addEventListener("input", renderEui);
  v6addr.addEventListener("input", renderEui);
  v6prefix.addEventListener("input", renderEui);

  /* ---------------- overlap checker ---------------- */
  function parseAnyPrefix(s) {
    s = String(s).trim();
    var m = s.match(/^(.+)\/(\d{1,3})$/);
    if (!m) return null;
    var p = parseInt(m[2], 10);
    if (s.indexOf(":") >= 0) {
      if (p < 0 || p > 128) return null;
      var v = parseV6(m[1]);
      if (v.error) return null;
      var hb = 128 - p;
      var mask = p === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(hb)) - 1n);
      var net = v.value & mask;
      return { bits: 128, prefix: p, net: net, last: net | ((1n << BigInt(hb)) - 1n) };
    }
    var ip = ipToInt(m[1]);
    if (ip === null || p < 0 || p > 32) return null;
    var m32 = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
    var n32 = (ip & m32) >>> 0;
    return { bits: 32, prefix: p, net: BigInt(n32), last: BigInt((n32 | ((~m32) >>> 0)) >>> 0) };
  }

  function runOverlap() {
    var a = parseAnyPrefix($("#ov-a").value);
    var b = parseAnyPrefix($("#ov-b").value);
    var out = $("#ov-out");
    if (!a || !b) {
      out.innerHTML = '<span class="ipc-bad">Use a valid prefix, for example 10.0.0.0/8 or 2001:db8::/32.</span>';
      return;
    }
    if (a.bits !== b.bits) {
      out.innerHTML = '<span class="ipc-bad">Compare IPv4 with IPv4, or IPv6 with IPv6 - not one of each.</span>';
      return;
    }
    var label = $("#ov-a").value.trim() + " and " + $("#ov-b").value.trim();
    var overlap = a.net <= b.last && b.net <= a.last;
    var msg;
    if (!overlap) {
      msg = '<span class="ipc-ok">Disjoint.</span> No address is in both prefixes. They can be summarised separately.';
    } else if (a.net === b.net && a.last === b.last) {
      msg = '<span class="ipc-ok">Identical.</span> Same network and same size.';
    } else if (a.net <= b.net && a.last >= b.last) {
      msg = '<span class="ipc-ok">B is inside A.</span> ' + label.split(" and ")[1] +
        " is a subnet of " + label.split(" and ")[0] + ", so they overlap fully.";
    } else if (b.net <= a.net && b.last >= a.last) {
      msg = '<span class="ipc-ok">A is inside B.</span> ' + label.split(" and ")[0] +
        " is a subnet of " + label.split(" and ")[1] + ", so they overlap fully.";
    } else {
      msg = '<span class="ipc-bad">Overlapping.</span> The prefixes share addresses but neither contains the other.';
    }
    out.innerHTML = msg;
  }

  $("#ov-run").addEventListener("click", runOverlap);
  ["ov-a", "ov-b"].forEach(function (id) {
    document.getElementById(id).addEventListener("keydown", function (e) {
      if (e.key === "Enter") runOverlap();
    });
  });

  /* ---------------- reference tables ---------------- */
  (function buildRef() {
    var rows = "";
    for (var p = 0; p <= 32; p++) {
      var mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
      var wild = (~mask) >>> 0;
      var hosts = p === 32 ? 1 : p === 31 ? 2 : Math.pow(2, 32 - p) - 2;
      var block = p % 8 === 0 ? 256 : Math.pow(2, 8 - (p % 8));
      var nets24 = p >= 24 ? Math.pow(2, p - 24) : "—";
      rows += "<tr><td class=\"mono\">/" + p + "</td><td class=\"mono\">" + intToIp(mask) + "</td><td class=\"mono\">" + intToIp(wild) +
        "</td><td class=\"mono\">" + block + "</td><td class=\"mono\">" + hosts.toLocaleString() + "</td><td class=\"mono\">" + nets24 + "</td></tr>";
    }
    $("#ref-subnets").innerHTML = '<div class="ipc-scroll"><table class="ipc-table"><thead><tr>' +
      "<th>Prefix</th><th>Mask</th><th>Wildcard</th><th>Block</th><th>Usable hosts</th><th>/24s per block</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>";

    var hex = "";
    for (var i = 0; i < 16; i++) {
      hex += "<tr><td class=\"mono\">" + i + "</td><td class=\"mono\">" + i.toString(16).toUpperCase() +
        "</td><td class=\"mono\">" + pad(i.toString(2), 4) + "</td></tr>";
    }
    $("#ref-hex").innerHTML = '<div class="ipc-scroll"><table class="ipc-table"><thead><tr>' +
      "<th>Decimal</th><th>Hex</th><th>Binary</th></tr></thead><tbody>" + hex + "</tbody></table></div>";
  })();

  /* ---------------- boot ---------------- */
  addVlsmRow("Sales", 50);
  addVlsmRow("IT", 20);
  addVlsmRow("Voice", 10);
  addVlsmRow("P2P link", 2);
  runVlsm();
  runSplit();
  renderEui();
  runOverlap();
  renderV4();
  renderV6();
  newProblem();
})();
