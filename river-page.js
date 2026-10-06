/* River Monitoring & Flood Warning page: live data only, one river at a time.
   Replaces river-monitoring.js, river-gauges.js, river-forecast.js and river-risk.js.
   Needs river-config.js (for the API URLs and refresh time). */

const RP = {
  DEFAULT_RIVER: "Mahaweli Ganga",   // river shown first
  DATA: "https://raw.githubusercontent.com/nuuuwan/lk_irrigation/refs/heads/main/data/",
  FAST_RISE: 0.3,      // m/hr or more = rising fast
  STEADY_BAND: 0.05,   // within +/- this = steady
  RAIN_WATCH: 20,      // mm per day = wet day
  HEAVY_RAIN: 50,      // mm per day = heavy rain
  FLOW_WATCH: 1.5,     // river flow x today = rising
  FLOW_HIGH: 2,        // river flow x today = high
  STALE_HOURS: 24,     // older reading = "no recent data"
  PAST_DAYS: 3         // days of past rain and flow to show
};
const S = { stations: [], events: null, river: null, infos: [], station: null, fc: null, token: 0 };

/* ---------- small helpers ---------- */
function $(id) { return document.getElementById(id); }
function today() { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" }); }
function addDays(s, n) { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function dayMs(s) { return Date.parse(s + "T12:00:00+05:30"); }
function fmtDay(s) { return new Date(s + "T00:00:00+05:30").toLocaleDateString("en-LK", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Colombo" }); }
function fmtTime(d) { return d.toLocaleString("en-LK", { timeZone: "Asia/Colombo", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
function cfg(key, fallback) { try { return RIVER_CONFIG.api[key] || fallback; } catch (e) { return fallback; } }
function pill(cls, text) { return '<span class="pill ' + cls + '">' + text + "</span>"; }
const GREY = '<span class="pill" style="background:#F1F5F9;color:#475569">';
function sum(a) { return a.reduce((s, x) => s + x, 0); }

/* ---------- gauge readings ---------- */
function getReadings(name) {
  const out = [], days = S.events.event_data[name] || {};
  for (const day in days) for (const time in days[day]) {
    out.push({
      when: new Date(day.slice(0, 4) + "-" + day.slice(4, 6) + "-" + day.slice(6, 8) + "T" +
        time.slice(0, 2) + ":" + time.slice(2, 4) + ":" + time.slice(4, 6) + "+05:30"),
      level: days[day][time]
    });
  }
  return out.sort((a, b) => a.when - b.when);
}
function getRate(rs) {
  const last = rs[rs.length - 1];
  for (let i = rs.length - 2; i >= 0; i--) {
    const h = (last.when - rs[i].when) / 3600000;
    if (h >= 1) return (last.level - rs[i].level) / h;
  }
  return null;
}
function makeInfo(st) {
  const rs = getReadings(st.name);
  if (!rs.length) return { st: st, none: true, usable: false };
  const last = rs[rs.length - 1];
  const hasT = st.major_flood_level_m > 0;
  let status = "No thresholds";
  if (hasT) {
    status = "Normal";
    if (last.level >= st.major_flood_level_m) status = "Major flood";
    else if (last.level >= st.minor_flood_level_m) status = "Minor flood";
    else if (last.level >= st.alert_level_m) status = "Alert";
  }
  const stale = Date.now() - last.when > RP.STALE_HOURS * 3600000;
  const faulty = last.level < 0;
  return { st: st, rs: rs, last: last, rate: getRate(rs), status: status, stale: stale, faulty: faulty, usable: !stale && !faulty };
}
function statusPill(i) {
  if (i.none || i.stale) return GREY + "No recent data</span>";
  if (i.faulty) return GREY + "Check gauge</span>";
  if (i.status === "No thresholds") return GREY + "No flood levels</span>";
  if (i.status === "Normal") return pill("ok", "Normal");
  if (i.status === "Major flood") return pill("bd", "Major flood");
  return pill("am", i.status);
}
function trendHTML(i) {
  if (!i.usable || i.rate === null) return "–";
  const a = Math.abs(i.rate).toFixed(2) + " m/hr";
  if (i.rate >= RP.FAST_RISE) return pill("bd", "▲ Rising fast " + a);
  if (i.rate >= RP.STEADY_BAND) return pill("am", "▲ Rising " + a);
  if (i.rate <= -RP.STEADY_BAND) return pill("ok", "▼ Falling " + a);
  return "Steady";
}

/* ---------- forecast (Open-Meteo) ---------- */
async function loadForecast(stations) {
  const fc = { rain: {}, flow: {}, rainOk: false, flowOk: false };
  const lat = stations.map(s => s.lat_lng[0]).join(",");
  const lon = stations.map(s => s.lat_lng[1]).join(",");
  const common = "latitude=" + lat + "&longitude=" + lon + "&past_days=" + RP.PAST_DAYS + "&forecast_days=7";
  const [w, f] = await Promise.allSettled([
    fetch(cfg("weatherApiUrl", "https://api.open-meteo.com/v1/forecast") + "?" + common +
      "&daily=precipitation_sum&timezone=Asia%2FColombo").then(r => r.json()),
    fetch(cfg("floodApiUrl", "https://flood-api.open-meteo.com/v1/flood") + "?" + common +
      "&daily=river_discharge").then(r => r.json())
  ]);
  const list = v => Array.isArray(v) ? v : [v];
  if (w.status === "fulfilled") list(w.value).forEach((o, i) => {
    if (o && o.daily && stations[i]) {
      fc.rain[stations[i].name] = o.daily.time.map((d, k) => ({ d: d, mm: o.daily.precipitation_sum[k] }));
      fc.rainOk = true;
    }
  });
  if (f.status === "fulfilled") list(f.value).forEach((o, i) => {
    if (o && o.daily && stations[i]) {
      fc.flow[stations[i].name] = o.daily.time.map((d, k) => ({ d: d, q: o.daily.river_discharge[k] }));
      if (o.daily.river_discharge.some(x => x !== null)) fc.flowOk = true;
    }
  });
  return fc;
}

/* ---------- overall risk for the selected river ---------- */
function computeRisk(infos, fc) {
  let top = 0;
  const reasons = [];
  const flag = (l, t) => { if (l > top) top = l; reasons.push({ l: l, t: t }); };
  const t0 = today(), end3 = addDays(t0, 3);
  let heavy = null, wet = null;

  for (const name in fc.rain) fc.rain[name].forEach(r => {
    if (r.d >= t0 && r.d < end3 && r.mm !== null) {
      if (r.mm >= RP.HEAVY_RAIN && (!heavy || r.mm > heavy.mm)) heavy = { d: r.d, mm: r.mm, name: name };
      if (r.mm >= RP.RAIN_WATCH && (!wet || r.mm > wet.mm)) wet = { d: r.d, mm: r.mm, name: name };
    }
  });

  const usable = infos.filter(i => i.usable);
  usable.forEach(i => {
    const n = i.st.name, lv = i.last.level.toFixed(2);
    if (i.status === "Major flood" || i.status === "Minor flood") flag(3, n + ": " + i.status + " level (" + lv + " m)");
    else if (i.status === "Alert") flag(2, n + ": alert level reached (" + lv + " m)");
    if (i.rate !== null && i.rate >= RP.FAST_RISE)
      flag(heavy ? 3 : 2, n + " rising fast, " + i.rate.toFixed(2) + " m/hr" + (heavy ? ", and heavy rain is forecast" : ""));
    else if (i.rate !== null && i.rate >= RP.STEADY_BAND)
      flag(wet ? 2 : 1, n + " rising, " + i.rate.toFixed(2) + " m/hr" + (wet ? ", and rain is forecast" : ""));
  });

  if (heavy) flag(2, "Heavy rain forecast near " + heavy.name + ": " + heavy.mm.toFixed(0) + " mm on " + fmtDay(heavy.d));
  else if (wet) flag(1, "Wet day forecast near " + wet.name + ": " + wet.mm.toFixed(0) + " mm on " + fmtDay(wet.d));

  let worst = null;
  for (const name in fc.flow) {
    const arr = fc.flow[name];
    const base = (arr.find(x => x.d === t0) || {}).q;
    if (!(base > 0)) continue;
    arr.forEach(x => {
      if (x.d >= t0 && x.d < end3 && x.q !== null && (!worst || x.q / base > worst.ratio)) worst = { ratio: x.q / base, d: x.d, name: name };
    });
  }
  if (worst && worst.ratio >= RP.FLOW_HIGH) flag(2, "River flow near " + worst.name + " forecast at " + worst.ratio.toFixed(1) + "x today on " + fmtDay(worst.d));
  else if (worst && worst.ratio >= RP.FLOW_WATCH) flag(1, "River flow near " + worst.name + " forecast at " + worst.ratio.toFixed(1) + "x today on " + fmtDay(worst.d));

  if (!usable.length && !fc.rainOk && !fc.flowOk) return { level: "Unknown", reasons: [], skipped: infos.length };
  reasons.sort((a, b) => b.l - a.l);
  return { level: ["Normal", "Watch", "Warning", "Danger"][top], reasons: reasons, skipped: infos.length - usable.length };
}
const RISK_STYLE = {
  Normal:  { bg: "#ECFDF5", bd: "#A7F3D0", fg: "#047857", msg: "No flood risk right now" },
  Watch:   { bg: "#FFFBEB", bd: "#FDE68A", fg: "#B45309", msg: "Keep an eye on river levels" },
  Warning: { bg: "#FFF7ED", bd: "#FDBA74", fg: "#C2410C", msg: "Flood risk is building. Get ready." },
  Danger:  { bg: "#FFF1F2", bd: "#FECDD3", fg: "#BE123C", msg: "Flood danger. Warn farmers now." },
  Unknown: { bg: "#F1F5F9", bd: "#E2E8F0", fg: "#475569", msg: "Not enough data to judge the risk" }
};

/* ---------- charts (plain SVG) ---------- */
function drawChart(id, o) {
  const el = $(id), W = 640, H = 270, L = 46, R = 14, T = 16, B = 30;
  const lines = (o.lines || []).filter(l => l.pts.length), bars = o.bars || [];
  const xs = [], ys = [];
  lines.forEach(l => l.pts.forEach(p => { xs.push(p[0]); ys.push(p[1]); }));
  bars.forEach(b => { xs.push(b.x); ys.push(b.y); });
  if (!xs.length) {
    el.innerHTML = '<text x="' + W / 2 + '" y="' + H / 2 + '" text-anchor="middle" font-size="13" fill="#64748B">' + (o.empty || "No data") + "</text>";
    return;
  }
  let lo = Math.min(0, Math.min(...ys)), hi = Math.max(...ys);
  const hl = (o.hlines || []).slice().sort((a, b) => a.y - b.y);
  const show = [];                                   // only the thresholds up to the next one above the data
  for (const h of hl) { show.push(h); if (h.y > hi) break; }
  show.forEach(h => { if (h.y > hi) hi = h.y; });
  hi = hi * 1.08; if (hi - lo < 1e-6) hi = lo + 1;
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (bars.length) { x0 -= 43200000; x1 += 43200000; }
  if (x1 === x0) x1 = x0 + 1;
  const X = x => L + (x - x0) / (x1 - x0) * (W - L - R);
  const Y = y => T + (hi - y) / (hi - lo) * (H - T - B);
  let s = "";
  for (let i = 0; i <= 4; i++) {
    const v = lo + (hi - lo) * i / 4;
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#EEF2F6"/>' +
      '<text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="10.5" fill="#64748B">' + v.toFixed(hi - lo < 10 ? 1 : 0) + "</text>";
  }
  for (let i = 0; i <= 4; i++) {
    const x = x0 + (x1 - x0) * i / 4;
    s += '<text x="' + X(x) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="10.5" fill="#64748B">' +
      new Date(x).toLocaleDateString("en-LK", { day: "numeric", month: "short", timeZone: "Asia/Colombo" }) + "</text>";
  }
  show.forEach(h => {
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(h.y) + '" y2="' + Y(h.y) + '" stroke="' + h.c + '" stroke-dasharray="5 4" stroke-width="1.4"/>' +
      '<text x="' + (W - R) + '" y="' + (Y(h.y) - 4) + '" text-anchor="end" font-size="10" font-weight="600" fill="' + h.c + '">' + h.t + "</text>";
  });
  if (bars.length) {
    const bw = (W - L - R) / (bars.length) * 0.62;
    bars.forEach(b => {
      const top = Y(b.y), base = Y(0);
      s += '<rect x="' + (X(b.x) - bw / 2) + '" y="' + Math.min(top, base) + '" width="' + bw + '" height="' + Math.max(1, Math.abs(base - top)) +
        '" rx="2" fill="' + b.c + '"><title>' + b.t + "</title></rect>";
    });
  }
  if (o.nowX) s += '<line x1="' + X(o.nowX) + '" x2="' + X(o.nowX) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#94A3B8" stroke-dasharray="3 3"/>' +
    '<text x="' + (X(o.nowX) + 4) + '" y="' + (T + 10) + '" font-size="10" fill="#64748B">Today</text>';
  lines.forEach(l => {
    s += '<polyline fill="none" stroke="' + l.c + '" stroke-width="2.2" stroke-linejoin="round"' + (l.dash ? ' stroke-dasharray="6 4"' : "") +
      ' points="' + l.pts.map(p => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ") + '"/>';
  });
  el.innerHTML = s;
}

/* ---------- drawing the page ---------- */
function curInfo() { return S.infos.find(i => i.st.name === S.station); }

function setStatus(ok, text) {
  $("rv-api-status").innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;background:' + (ok ? "#10B981" : "#E11D48") + '"></span>' + text;
}

function renderGauges() {
  const seg = $("rv-station-seg");
  seg.innerHTML = S.infos.map(i => '<button data-st="' + i.st.name + '"' + (i.st.name === S.station ? ' class="on"' : "") + ">" + i.st.name + "</button>").join("");

  $("rv-gauges-tbody").innerHTML = S.infos.map(i => {
    const sel = i.st.name === S.station ? ' style="background:#F0FDFA"' : "";
    if (i.none) return '<tr data-st="' + i.st.name + '"' + sel + "><td><b>" + i.st.name + '</b></td><td colspan="4">No readings</td></tr>';
    return '<tr data-st="' + i.st.name + '"' + sel + ' style="cursor:pointer"><td><b>' + i.st.name + "</b></td><td>" + i.last.level.toFixed(2) + " m</td><td>" +
      statusPill(i) + "</td><td>" + trendHTML(i) + "</td><td>" + fmtTime(i.last.when) + "</td></tr>";
  }).join("");

  const i = curInfo(), st = i.st;
  if (i.none) { $("rv-stat-level").textContent = "–"; return; }
  const major = st.major_flood_level_m, lv = i.last.level;
  const pct = major > 0 ? Math.max(0, Math.min(100, lv / major * 100)) : 0;
  const col = { "Normal": "#10B981", "Alert": "#F59E0B", "Minor flood": "#EA580C", "Major flood": "#E11D48" }[i.status] || "#94A3B8";
  $("rv-stat-level").textContent = lv.toFixed(2) + " m";
  $("rv-bar-level").style.width = pct + "%";
  $("rv-bar-level").style.background = col;
  $("rv-cap-level").textContent = (major > 0 ? Math.round(pct) + "% of major flood level (" + major.toFixed(1) + " m)" : "No flood levels set for this gauge") +
    (i.stale ? " · no recent data" : i.faulty ? " · check gauge" : "");
  $("rv-stat-trend").innerHTML = trendHTML(i);

  const levels = [["Alert", st.alert_level_m], ["Minor flood", st.minor_flood_level_m], ["Major flood", st.major_flood_level_m]].filter(x => x[1] > 0);
  const next = levels.find(x => lv < x[1]);
  $("rv-stat-next").textContent = !levels.length ? "–" : next ? next[0] + " in " + (next[1] - lv).toFixed(2) + " m" : "Above major flood level";
  $("rv-cap-next").textContent = levels.length ? levels.map(x => x[0].split(" ")[0] + " " + x[1].toFixed(1)).join(" · ") + " m" : "";

  $("rv-title-level").textContent = st.name + " (" + st.river_name + "): river level, last 7 days";
  const since = Date.now() - 7 * 86400000;
  drawChart("rv-chart-level", {
    lines: [{ c: "#0F766E", pts: i.rs.filter(r => r.when >= since).map(r => [+r.when, r.level]) }],
    hlines: levels.map(x => ({ y: x[1], c: { "Alert": "#F59E0B", "Minor flood": "#EA580C", "Major flood": "#E11D48" }[x[0]], t: x[0] + " " + x[1].toFixed(1) + " m" })),
    empty: "No readings in the last 7 days"
  });
}

function renderForecast() {
  const fc = S.fc, name = S.station, t0 = today(), end3 = addDays(t0, 3), back3 = addDays(t0, -RP.PAST_DAYS);
  const loading = fc === null;
  $("rv-title-rain").textContent = "Rain at " + name + " (mm)";
  $("rv-title-flow").textContent = "River flow at " + name + " (m³/s)";

  const rain = loading ? null : fc.rain[name];
  const flow = loading ? null : fc.flow[name];
  const msg = loading ? "Loading forecast..." : "Forecast not available";
  drawChart("rv-chart-rain", {
    bars: rain ? rain.filter(r => r.mm !== null).map(r => ({ x: dayMs(r.d), y: r.mm, c: r.d < t0 ? "#94A3B8" : "#2563EB", t: fmtDay(r.d) + ": " + r.mm.toFixed(1) + " mm" })) : [],
    empty: msg
  });
  drawChart("rv-chart-flow", {
    lines: flow ? [{ c: "#2563EB", pts: flow.filter(x => x.q !== null).map(x => [dayMs(x.d), x.q]) }] : [],
    nowX: dayMs(t0),
    empty: loading ? msg : "No modelled river flow at this location"
  });

  if (rain) {
    const n3 = rain.filter(r => r.d >= t0 && r.d < end3 && r.mm !== null).map(r => r.mm);
    const p3 = rain.filter(r => r.d >= back3 && r.d < t0 && r.mm !== null).map(r => r.mm);
    $("rv-stat-rain").textContent = sum(n3).toFixed(0) + " mm";
    $("rv-cap-rain").textContent = "Past 3 days: " + sum(p3).toFixed(0) + " mm";
  } else {
    $("rv-stat-rain").textContent = "–";
    $("rv-cap-rain").textContent = msg;
  }

  $("rv-rain-tbody").innerHTML = S.infos.map(i => {
    const r = loading ? null : fc.rain[i.st.name];
    if (!r) return "<tr><td><b>" + i.st.name + '</b></td><td colspan="4">' + msg + "</td></tr>";
    const ok = r.filter(x => x.mm !== null);
    const f7 = ok.filter(x => x.d >= t0);
    const wet = f7.reduce((p, x) => (!p || x.mm > p.mm) ? x : p, null);
    return "<tr><td><b>" + i.st.name + "</b></td><td>" + sum(ok.filter(x => x.d < t0).map(x => x.mm)).toFixed(0) + " mm</td><td>" +
      sum(ok.filter(x => x.d >= t0 && x.d < end3).map(x => x.mm)).toFixed(0) + " mm</td><td>" +
      sum(f7.map(x => x.mm)).toFixed(0) + " mm</td><td>" + (wet ? fmtDay(wet.d) + " · " + wet.mm.toFixed(0) + " mm" : "–") + "</td></tr>";
  }).join("");
}

function renderRisk() {
  const fc = S.fc || { rain: {}, flow: {}, rainOk: false, flowOk: false };
  const risk = computeRisk(S.infos, fc), st = RISK_STYLE[risk.level], card = $("rv-risk-card");
  card.style.background = st.bg; card.style.border = "1.5px solid " + st.bd;
  $("rv-risk-level").textContent = risk.level;
  $("rv-risk-level").style.color = st.fg;
  $("rv-risk-msg").textContent = st.msg;
  $("rv-risk-scope").textContent = S.river + " · " + S.infos.length + " gauge" + (S.infos.length === 1 ? "" : "s");

  const ul = $("rv-risk-reasons");
  ul.replaceChildren();
  const add = (text, grey) => { const li = document.createElement("li"); li.textContent = text; if (grey) li.style.color = "#64748B"; ul.appendChild(li); };
  risk.reasons.slice(0, 5).forEach(r => add(r.t));
  if (risk.skipped > 0) add(risk.skipped + " gauge(s) ignored: no recent data or a faulty reading", true);
  if (S.fc === null) add("Checking the forecast...", true);
  else {
    if (!S.fc.rainOk) add("Rain forecast could not be loaded", true);
    if (!S.fc.flowOk) add("River flow forecast not available for this river", true);
  }
}

/* ---------- loading and events ---------- */
async function loadGauges() {
  try {
    const [st, ev] = await Promise.all([
      fetch(RP.DATA + "static/stations.json").then(r => r.json()),
      fetch(RP.DATA + "alert_data.last_28_days.json").then(r => r.json())
    ]);
    S.events = ev;
    S.stations = st.filter(s => ev.event_data[s.name]);
    $("rv-error").style.display = "none";
    setStatus(true, "Live");
    $("rv-updated").textContent = "Updated " + new Date().toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo" });
    return true;
  } catch (e) {
    setStatus(false, "Offline");
    $("rv-error").style.display = "block";
    $("rv-error").textContent = "Could not reach the river data service. Check the internet connection and press Refresh.";
    return false;
  }
}

async function selectRiver(name) {
  S.river = name;
  try { localStorage.setItem("rv-river", name); } catch (e) {}
  const stations = S.stations.filter(s => s.river_name === name);
  S.infos = stations.map(makeInfo);
  const usable = S.infos.filter(i => i.usable && i.st.major_flood_level_m > 0);
  const best = usable.sort((a, b) => b.last.level / b.st.major_flood_level_m - a.last.level / a.st.major_flood_level_m)[0];
  S.station = (best || S.infos[0]).st.name;
  S.fc = null;
  const token = ++S.token;
  renderGauges(); renderForecast(); renderRisk();
  const fc = await loadForecast(stations);
  if (token !== S.token) return;           // the user picked another river meanwhile
  S.fc = fc;
  renderForecast(); renderRisk();
}

async function refreshAll() {
  if (await loadGauges()) selectRiver(S.river);
}

async function startRiverPage() {
  if (!$("page-river")) return;
  if (!(await loadGauges())) return;
  const rivers = [...new Set(S.stations.map(s => s.river_name))].sort();
  $("rv-select").innerHTML = rivers.map(r => '<option value="' + r + '">' + r + " (" + S.stations.filter(s => s.river_name === r).length + ")</option>").join("");
  let first = RP.DEFAULT_RIVER;
  try { first = localStorage.getItem("rv-river") || first; } catch (e) {}
  if (!rivers.includes(first)) first = rivers[0];
  $("rv-select").value = first;
  selectRiver(first);

  $("rv-select").addEventListener("change", e => selectRiver(e.target.value));
  $("rv-refresh-btn").addEventListener("click", refreshAll);
  function pick(e) {
    const el = e.target.closest("[data-st]");
    if (!el) return;
    S.station = el.getAttribute("data-st");
    renderGauges(); renderForecast();
  }
  $("rv-station-seg").addEventListener("click", pick);
  $("rv-gauges-tbody").addEventListener("click", pick);
  setInterval(refreshAll, cfg("refreshIntervalMinutes", 30) * 60 * 1000);
}

document.addEventListener("DOMContentLoaded", startRiverPage);
