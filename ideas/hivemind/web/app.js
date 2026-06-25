// Hivemind dashboard — vanilla JS, no build step.
// Connects to /events (SSE), renders presence + a live color-coded feed, and
// runs "Has anyone on the team…?" search against /api/search.

"use strict";

const MAX_FEED_NODES = 400; // cap DOM growth on long-running demos
const KIND_LABEL = {
  user: "prompt",
  assistant: "reply",
  tool_use: "tool",
  tool_result: "result",
  title: "title",
  session_start: "start",
  session_end: "end",
  system: "system",
};

// ---- element refs ----
const els = {
  feed: document.getElementById("feed"),
  feedCount: document.getElementById("feed-count"),
  jumpLatest: document.getElementById("jump-latest"),
  presenceList: document.getElementById("presence-list"),
  presenceCount: document.getElementById("presence-count"),
  connDot: document.getElementById("conn-dot"),
  connLabel: document.getElementById("conn-label"),
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  searchClear: document.getElementById("search-clear"),
  searchOverlay: document.getElementById("search-overlay"),
  searchResults: document.getElementById("search-results"),
  searchResultsTitle: document.getElementById("search-results-title"),
  searchClose: document.getElementById("search-close"),
  statEvents: document.getElementById("stat-events"),
  statSessions: document.getElementById("stat-sessions"),
  statActors: document.getElementById("stat-actors"),
  statBus: document.getElementById("stat-bus"),
  statStore: document.getElementById("stat-store"),
};

let feedCount = 0;
let autoScroll = true; // stick to bottom unless the user scrolled up
const seenIds = new Set(); // de-dupe against snapshot + live overlap

// ---------- helpers ----------
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function relTime(ts) {
  const d = Date.now() - ts;
  if (!Number.isFinite(d) || ts <= 0) return "";
  if (d < 1000) return "now";
  const s = Math.floor(d / 1000);
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const days = Math.floor(h / 24);
  return days + "d ago";
}

// Deterministic colour per actor for avatars.
function actorColor(name) {
  let h = 0;
  const str = String(name || "?");
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 62%)`;
}

function initials(name) {
  const parts = String(name || "?").trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ---------- feed rendering ----------
function eventNode(e) {
  const kind = e.kind || "system";
  const node = document.createElement("div");
  node.className = "event k-" + kind + (kind === "tool_result" ? " is-result" : "");
  node.dataset.ts = e.ts;
  node.dataset.id = e.id;

  const kindLabel = KIND_LABEL[kind] || kind;
  const toolHtml = e.tool ? `<span class="ev-tool">${esc(e.tool)}</span>` : "";

  node.innerHTML = `
    <div class="ev-body">
      <div class="ev-line">
        <span class="ev-actor">${esc(e.actor)}</span>
        <span class="ev-kind">${esc(kindLabel)}</span>
        ${toolHtml}
        <span class="ev-dot">·</span>
        <span class="ev-proj">${esc(e.project || "")}</span>
        <span class="ev-time" data-ts="${e.ts}">${esc(relTime(e.ts))}</span>
      </div>
      <div class="ev-text">${esc(e.text)}</div>
    </div>`;
  return node;
}

function nearBottom() {
  const f = els.feed;
  return f.scrollHeight - f.scrollTop - f.clientHeight < 80;
}

function clearEmpty(container) {
  const empty = container.querySelector(".empty");
  if (empty) empty.remove();
}

function appendEvent(e, { animate = true } = {}) {
  if (!e || !e.id) return;
  if (seenIds.has(e.id)) return;
  seenIds.add(e.id);

  clearEmpty(els.feed);
  const node = eventNode(e);
  if (!animate) node.style.animation = "none";
  els.feed.appendChild(node);
  feedCount++;
  els.feedCount.textContent = feedCount;

  // trim old nodes
  while (els.feed.children.length > MAX_FEED_NODES) {
    els.feed.removeChild(els.feed.firstChild);
  }

  if (autoScroll) {
    scrollToBottom();
  } else {
    els.jumpLatest.hidden = false;
  }
}

function scrollToBottom() {
  els.feed.scrollTop = els.feed.scrollHeight;
  els.jumpLatest.hidden = true;
}

function renderFeedSnapshot(feed) {
  els.feed.innerHTML = "";
  seenIds.clear();
  feedCount = 0;
  // snapshot is newest-first; render oldest-first so newest ends up at the bottom
  const ordered = feed.slice().sort((a, b) => a.ts - b.ts);
  if (ordered.length === 0) {
    els.feed.innerHTML = `<div class="empty">Waiting for the hive to wake up…</div>`;
    els.feedCount.textContent = "0";
    return;
  }
  for (const e of ordered) appendEvent(e, { animate: false });
  // jump to bottom after layout settles
  requestAnimationFrame(scrollToBottom);
}

els.feed.addEventListener("scroll", () => {
  autoScroll = nearBottom();
  if (autoScroll) els.jumpLatest.hidden = true;
});
els.jumpLatest.addEventListener("click", () => {
  autoScroll = true;
  scrollToBottom();
});

// ---------- presence rendering ----------
function presenceCard(p) {
  const card = document.createElement("div");
  card.className = "pcard" + (p.status === "active" ? "" : " idle");

  const color = actorColor(p.actor);
  const title = p.title && p.title.trim() ? esc(p.title) : null;
  const branch = p.gitBranch
    ? `<span class="chip branch">⎇ ${esc(p.gitBranch)}</span>`
    : "";
  const model = p.model ? `<span class="chip model">${esc(shortModel(p.model))}</span>` : "";

  card.innerHTML = `
    <div class="pcard-top">
      <span class="avatar" style="background:${color}">${esc(initials(p.actor))}</span>
      <span class="pcard-name">${esc(p.actor)}</span>
      <span class="status-dot ${p.status === "active" ? "active" : ""}"></span>
    </div>
    <div class="pcard-title ${title ? "" : "untitled"}">${title || "untitled session"}</div>
    <div class="pcard-meta">
      <span class="chip">${esc(p.project || "—")}</span>
      ${branch}
      ${model}
      <span class="pcard-last" data-ts="${p.lastTs}">${esc(relTime(p.lastTs))}</span>
    </div>`;
  return card;
}

function shortModel(m) {
  // claude-opus-4-8 → opus-4-8 ; keep it readable in a chip
  return String(m).replace(/^claude-/, "").replace(/-(\d{8})$/, "");
}

let lastPresenceSig = "";
function presenceSig(rows) {
  return rows
    .map((r) => `${r.actor}|${r.sessionId}|${r.status}|${r.eventCount}|${r.title || ""}|${r.project || ""}|${r.model || ""}|${r.gitBranch || ""}`)
    .join("\n");
}

function renderPresence(rows) {
  const list = els.presenceList;
  if (!rows || rows.length === 0) {
    lastPresenceSig = "";
    list.innerHTML = `<div class="empty">No teammates yet. Waiting for activity…</div>`;
    els.presenceCount.textContent = "0";
    return;
  }
  // Skip the rebuild when nothing meaningful changed (keeps hover/scroll stable;
  // avoids the constant innerHTML churn from throttled presence broadcasts).
  const sig = presenceSig(rows);
  if (sig === lastPresenceSig) return;
  lastPresenceSig = sig;

  const active = rows.filter((r) => r.status === "active").length;
  els.presenceCount.textContent = String(active || rows.length);
  list.innerHTML = "";
  for (const p of rows) list.appendChild(presenceCard(p));
}

// ---------- stats ----------
function renderStats(s) {
  if (!s) return;
  els.statEvents.textContent = s.events ?? 0;
  els.statSessions.textContent = s.sessions ?? 0;
  els.statActors.textContent = s.actors ?? 0;
  if (s.bus) els.statBus.textContent = "bus: " + s.bus;
  if (s.store) els.statStore.textContent = "store: " + s.store;
}

// ---------- relative-time refresher ----------
setInterval(() => {
  document.querySelectorAll("[data-ts]").forEach((el) => {
    // Only update leaf time labels — never containers (e.g. the .event node also
    // carries data-ts; overwriting its textContent would wipe the whole event).
    if (el.childElementCount > 0) return;
    const ts = Number(el.dataset.ts);
    if (ts) el.textContent = relTime(ts);
  });
}, 5000);

// ---------- SSE connection ----------
function setConn(state) {
  els.connDot.className = "conn-dot " + state;
  els.connLabel.textContent =
    state === "live" ? "live" : state === "down" ? "reconnecting…" : "connecting…";
}

let evtSource = null;
function connect() {
  setConn("");
  evtSource = new EventSource("/events");

  evtSource.onopen = () => setConn("live");

  evtSource.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    handleMessage(msg);
  };

  evtSource.onerror = () => {
    setConn("down");
    // EventSource auto-reconnects; if the browser gave up, force a fresh one.
    if (evtSource && evtSource.readyState === EventSource.CLOSED) {
      try { evtSource.close(); } catch {}
      setTimeout(connect, 2000);
    }
  };
}

function handleMessage(msg) {
  if (!msg || !msg.type) return;
  switch (msg.type) {
    case "snapshot":
      renderFeedSnapshot(msg.feed || []);
      renderPresence(msg.presence || []);
      renderStats(msg.stats);
      setConn("live");
      break;
    case "event":
      if (msg.event) appendEvent(msg.event);
      break;
    case "presence":
      renderPresence(msg.presence || []);
      break;
    case "stats":
      renderStats(msg.stats);
      break;
  }
}

// ---------- search ----------
let searchTimer = null;

function highlight(snippet, query) {
  const safe = esc(snippet);
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (terms.length === 0) return safe;
  try {
    const re = new RegExp("(" + terms.join("|") + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  } catch {
    return safe;
  }
}

function hitNode(hit, query) {
  const e = hit.event || {};
  const node = document.createElement("div");
  node.className = "hit";
  const pct = Math.round((hit.score || 0) * 100);
  node.innerHTML = `
    <div class="hit-top">
      <span class="hit-actor">${esc(e.actor)}</span>
      <span class="hit-dot">·</span>
      <span>${esc(e.project || "")}</span>
      ${e.tool ? `<span class="ev-tool">${esc(e.tool)}</span>` : ""}
      <span>·</span>
      <span data-ts="${e.ts}">${esc(relTime(e.ts))}</span>
      <span class="hit-score">${pct}%</span>
    </div>
    <div class="hit-snippet">${highlight(hit.snippet || e.text || "", query)}</div>
    <div class="hit-bar" style="width:${Math.max(6, pct)}%"></div>`;
  return node;
}

async function runSearch(query) {
  const q = query.trim();
  if (!q) {
    closeSearch();
    return;
  }
  openSearch();
  els.searchResultsTitle.textContent = `Searching “${q}”…`;
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`);
    const hits = await res.json();
    els.searchResults.innerHTML = "";
    if (!Array.isArray(hits) || hits.length === 0) {
      els.searchResultsTitle.textContent = `No one has touched “${q}” yet`;
      els.searchResults.innerHTML = `<div class="empty">Nothing in the hive matches that — yet.</div>`;
      return;
    }
    els.searchResultsTitle.textContent = `${hits.length} match${hits.length === 1 ? "" : "es"} for “${q}”`;
    for (const h of hits) els.searchResults.appendChild(hitNode(h, q));
  } catch (err) {
    els.searchResultsTitle.textContent = "Search failed";
    els.searchResults.innerHTML = `<div class="empty">Could not reach the server.</div>`;
  }
}

function openSearch() {
  els.searchOverlay.hidden = false;
}
function closeSearch() {
  els.searchOverlay.hidden = true;
  els.searchResults.innerHTML = "";
}

els.searchInput.addEventListener("input", () => {
  const v = els.searchInput.value;
  els.searchClear.hidden = v.length === 0;
  clearTimeout(searchTimer);
  if (!v.trim()) {
    closeSearch();
    return;
  }
  searchTimer = setTimeout(() => runSearch(v), 280); // debounce
});

els.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearTimeout(searchTimer);
  runSearch(els.searchInput.value);
});

els.searchClear.addEventListener("click", () => {
  els.searchInput.value = "";
  els.searchClear.hidden = true;
  closeSearch();
  els.searchInput.focus();
});

els.searchClose.addEventListener("click", closeSearch);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSearch();
  } else if ((e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) &&
             document.activeElement !== els.searchInput) {
    e.preventDefault();
    els.searchInput.focus();
  }
});

// dismiss overlay when clicking outside it
document.addEventListener("click", (e) => {
  if (els.searchOverlay.hidden) return;
  if (!els.searchOverlay.contains(e.target) && !els.searchForm.contains(e.target)) {
    closeSearch();
  }
});

// ---------- go ----------
connect();
