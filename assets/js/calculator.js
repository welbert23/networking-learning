/* Standalone calculator page: remembers the last address you typed. */
(function () {
  "use strict";

  var root = document.getElementById("ipcalc");
  if (!root) return;

  var KEY = "nfg-ipcalc-state";
  var octets = Array.prototype.slice.call(root.querySelectorAll("#v4octets input"));
  var v4prefix = root.querySelector("#v4prefix");
  var v6addr = root.querySelector("#v6addr");
  var v6prefix = root.querySelector("#v6prefix");

  function readState() {
    return {
      v4: octets.map(function (input) { return input.value; }),
      v4prefix: v4prefix ? v4prefix.value : null,
      v6: v6addr ? v6addr.value : null,
      v6prefix: v6prefix ? v6prefix.value : null
    };
  }

  function restore() {
    var raw;
    try { raw = localStorage.getItem(KEY); } catch (err) { return; }
    if (!raw) return;
    var state;
    try { state = JSON.parse(raw); } catch (err) { return; }

    var changed = false;
    if (Array.isArray(state.v4) && state.v4.length === octets.length) {
      octets.forEach(function (input, index) {
        var value = String(state.v4[index] || "");
        if (input.value !== value) { input.value = value; changed = true; }
      });
    }
    if (v4prefix && state.v4prefix != null) {
      v4prefix.value = state.v4prefix;
      changed = true;
    }
    if (v6addr && state.v6 != null) {
      v6addr.value = state.v6;
      changed = true;
    }
    if (v6prefix && state.v6prefix != null) {
      v6prefix.value = state.v6prefix;
      changed = true;
    }
    if (changed) {
      octets.concat([v4prefix, v6addr, v6prefix]).forEach(function (input) {
        if (!input) return;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  }

  var saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(readState())); } catch (err) { /* ignore */ }
    }, 400);
  }

  restore();
  root.addEventListener("input", scheduleSave);
  root.addEventListener("click", function (event) {
    if (event.target.closest("button")) scheduleSave();
  });
})();
