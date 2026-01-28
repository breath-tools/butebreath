/* ButeBreath timer worker
   SPDX-License-Identifier: GPL-3.0
   Purpose: keep a stable timer off the UI thread to avoid RAF throttling drift.

   Incoming:
     {cmd:'start', token:number, mode:'countdown'|'stopwatch', plannedSec:number}
     {cmd:'stop', token:number}

   Outgoing:
     {type:'progress', token:number, elapsedSec:number}
     {type:'complete', token:number}   // countdown only
*/

let timeoutId = null;
let running = false;

let token = 0;
let mode = "countdown";
let plannedSec = 0;

let tStartMs = 0;
let lastSentMs = 0;

function nowMs() {
  // performance.now() exists in dedicated workers
  return (self.performance && self.performance.now) ? self.performance.now() : Date.now();
}

function post(obj) {
  try { self.postMessage(obj); } catch (e) { console.error(e); }
}

function stop() {
  running = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function tick() {
  if (!running) return;
  
  const now = nowMs();
  const elapsedSec = Math.max(0, (now - tStartMs) / 1000);

  // Throttle progress messages (UI only needs coarse sync; RAF handles smoothness).
  if (!lastSentMs || (now - lastSentMs) >= 400) {
    lastSentMs = now;
    post({ type: "progress", token, elapsedSec });
  }

  if (mode === "countdown" && plannedSec > 0 && elapsedSec >= plannedSec) {
    post({ type: "complete", token });
    stop();
    return;
  }

  // Schedule next tick to avoid cumulative drift
  // Calculate how long until next 200ms boundary
  const elapsed = now - tStartMs;
  const nextTickMs = Math.max(50, 200 - (elapsed % 200));
  timeoutId = setTimeout(tick, nextTickMs);
}

self.onmessage = (ev) => {
  const msg = ev && ev.data ? ev.data : null;
  if (!msg || typeof msg !== "object") return;

  if (msg.cmd === "start") {
    stop();
    token = Number(msg.token || 0);
    mode = (msg.mode === "stopwatch") ? "stopwatch" : "countdown";
    plannedSec = Math.max(0, Number(msg.plannedSec || 0));
    tStartMs = nowMs();
    lastSentMs = 0;
    running = true;

    // Immediate first progress so UI aligns startPerfMs quickly.
    post({ type: "progress", token, elapsedSec: 0 });

    // Start the tick loop with setTimeout instead of setInterval
    timeoutId = setTimeout(tick, 200);
    return;
  }

  if (msg.cmd === "stop") {
    if (msg.token != null && Number(msg.token) !== Number(token)) return;
    stop();
  }
};
