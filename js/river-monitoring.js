/**
 * Yala-Maha Assist · River Monitoring & Flood Warning System
 * -----------------------------------------------------------
 * Real-time hydrological tracking of Yan Oya River Basin via Open-Meteo Flood API,
 * 14-day observed vs predicted discharge modeling, dynamic SVG level gauge & chart,
 * downstream village exposure evaluation, and automated multi-lingual SMS early warnings.
 */

let riverAutoSend = (typeof RIVER_CONFIG !== 'undefined' && RIVER_CONFIG.alerts) ? RIVER_CONFIG.alerts.autoSendEnabledDefault : true;
let currentScenario = 'flood';
let lastDispatchedRisk = null;
let pendingOfficerAlert = null;
let riverData = null;

function initRiverPage() {
  applyRiverScenario('flood', false);

  if ($('#rv-auto-seg')) {
    $('#rv-auto-seg').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      riverAutoSend = b.dataset.auto === '1';
      $$('#rv-auto-seg button').forEach(x => x.classList.toggle('on', x === b));
      const pill = $('#rv-dispatch-pill');
      if (pill) {
        pill.textContent = riverAutoSend ? 'Auto-Dispatch Active' : 'Manual Approval Mode';
        pill.className = riverAutoSend ? 'pill ok' : 'pill am';
      }
      toast(`Auto-send SMS: ${riverAutoSend ? 'ENABLED' : 'DISABLED (Officer Approval Mode)'}`);
      if (riverAutoSend && pendingOfficerAlert) {
        dispatchSMSAlert(pendingOfficerAlert.risk, pendingOfficerAlert.peakLevel, pendingOfficerAlert.exceedTime);
        lastDispatchedRisk = pendingOfficerAlert.risk;
        hideOfficerBanner();
      }
    };
  }

  if ($('#rv-scen-seg')) {
    $('#rv-scen-seg').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const sc = b.dataset.sc;
      $$('#rv-scen-seg button').forEach(x => x.classList.toggle('on', x === b));
      currentScenario = sc;
      if (sc === 'live') {
        fetchRiverData();
      } else {
        applyRiverScenario(sc, true);
      }
    };
  }

  if ($('#rv-refresh-btn')) {
    $('#rv-refresh-btn').onclick = () => {
      if (currentScenario === 'live') {
        fetchRiverData();
      } else {
        applyRiverScenario(currentScenario, true, 'Data refreshed');
      }
    };
  }

  if ($('#rv-btn-approve')) {
    $('#rv-btn-approve').onclick = () => {
      if (pendingOfficerAlert) {
        dispatchSMSAlert(pendingOfficerAlert.risk, pendingOfficerAlert.peakLevel, pendingOfficerAlert.exceedTime);
        lastDispatchedRisk = pendingOfficerAlert.risk;
        hideOfficerBanner();
      }
    };
  }

  if ($('#rv-btn-dismiss')) {
    $('#rv-btn-dismiss').onclick = () => {
      hideOfficerBanner();
      toast('Alert broadcast cancelled by officer');
    };
  }

  const intervalMins = (typeof RIVER_CONFIG !== 'undefined' && RIVER_CONFIG.api && RIVER_CONFIG.api.refreshIntervalMinutes) ? RIVER_CONFIG.api.refreshIntervalMinutes : 30;
  setInterval(() => {
    if (currentScenario === 'live') fetchRiverData();
  }, intervalMins * 60 * 1000);
}

async function fetchRiverData() {
  const cfg = (typeof RIVER_CONFIG !== 'undefined') ? RIVER_CONFIG : null;
  if (!cfg) return;

  const statusChip = $('#rv-api-status');
  if (statusChip) statusChip.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F59E0B;margin-right:4px"></span>Connecting...`;

  if (cfg.api.requireApiKeyForLive && !cfg.api.apiKey) {
    applyRiverScenario('flood', true, 'Sample data (API key missing)');
    if (statusChip) statusChip.innerHTML = `<span class="pill am" style="font-size:10px">Sample data (No API key)</span>`;
    return;
  }

  const floodUrl = `${cfg.api.floodApiUrl}?latitude=${cfg.api.latitude}&longitude=${cfg.api.longitude}&daily=river_discharge,river_discharge_mean&forecast_days=${cfg.api.forecastDays}&past_days=${cfg.api.pastDays}`;

  try {
    const res = await fetch(floodUrl);
    if (!res.ok) throw new Error('Flood API HTTP ' + res.status);
    const json = await res.json();
    processApiRiverData(json);
  } catch (err) {
    console.warn('Real-time API unavailable, falling back to cached sample data:', err);
    if (statusChip) statusChip.innerHTML = `<span class="pill am" style="font-size:10px">Data delayed (cached)</span>`;
    if ($('#rv-updated')) $('#rv-updated').textContent = 'Cached · Last updated 6:00 AM';
    applyRiverScenario('flood', false, 'Data delayed (cached)');
    toast('Flood API offline. Displaying cached hydrological data.');
  }
}

function processApiRiverData(json) {
  const cfg = RIVER_CONFIG;
  const times = json.daily && json.daily.time ? json.daily.time : [];
  const discharges = json.daily && json.daily.river_discharge ? json.daily.river_discharge : [];
  if (times.length < 14) {
    applyRiverScenario('flood', true, 'Incomplete API data; showing calibrated model');
    return;
  }

  const dashboardRain = [4.2, 8.5, 24.0, 12.0, 3.5, 0.5, 0.0];
  const safeCap = cfg.river.safeCapacityMeters;
  const baseRatingLevel = 1.80;
  const history = [], forecast = [];
  let peakLevel = 0, peakIndex = 7, peakDateLabel = "Thursday evening";

  for (let i = 0; i < 7; i++) {
    const dStr = times[i], dt = new Date(dStr);
    const label = dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const q = discharges[i] !== null ? discharges[i] : 14.5;
    const level = Math.max(1.2, +(baseRatingLevel + Math.min(2.5, q * 1.5)).toFixed(2));
    history.push({ label, levelM: level, discharge: +q.toFixed(1) });
  }

  for (let i = 7; i < 14; i++) {
    const fIdx = i - 7, dStr = times[i], dt = new Date(dStr);
    const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
    const label = fIdx === 0 ? `${dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} (Today)` : `${dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} (${dayName})`;
    const q = discharges[i] !== null ? discharges[i] : 18.0;
    const rain = dashboardRain[fIdx] || 0;
    const level = Math.max(1.5, +(baseRatingLevel + (q * 1.6) + (rain * 0.06)).toFixed(2));
    forecast.push({ label, levelM: level, discharge: +q.toFixed(1), rainMm: rain });
    if (level > peakLevel) {
      peakLevel = level;
      peakIndex = fIdx;
      peakDateLabel = `${dayName} evening`;
    }
  }

  const currentLevel = history[history.length - 1].levelM;
  const currentDischarge = history[history.length - 1].discharge;
  const peakDischarge = forecast[peakIndex].discharge;

  riverData = {
    currentLevelM: currentLevel,
    currentDischargeM3s: currentDischarge,
    peakLevelM: peakLevel,
    peakDischargeM3s: peakDischarge,
    peakDate: peakDateLabel,
    timeToPeakHours: (peakIndex + 1) * 24 - 12,
    exceedsCapacity: peakLevel >= safeCap,
    history,
    forecast
  };

  const statusChip = $('#rv-api-status');
  if (statusChip) statusChip.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;margin-right:4px"></span>Live API`;
  if ($('#rv-updated')) $('#rv-updated').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  renderRiverPage();
}

function applyRiverScenario(scenKey, showToastNotice, statusLabel) {
  const cfg = RIVER_CONFIG;
  const scen = (cfg.sampleScenarios && cfg.sampleScenarios[scenKey]) ? cfg.sampleScenarios[scenKey] : cfg.sampleScenarios.flood;
  riverData = JSON.parse(JSON.stringify(scen));

  const statusChip = $('#rv-api-status');
  if (statusChip) {
    if (scenKey === 'live') {
      statusChip.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;margin-right:4px"></span>Live API`;
    } else {
      statusChip.innerHTML = `<span class="pill ok" style="font-size:10px">Simulation: ${scen.name.split(' ')[0]}</span>`;
    }
  }
  if ($('#rv-updated')) $('#rv-updated').textContent = statusLabel || `Scenario: ${scen.name}`;
  renderRiverPage();
  if (showToastNotice) toast(`Simulating: ${scen.name}`);
}

function renderRiverPage() {
  if (!riverData) return;
  const cfg = RIVER_CONFIG;
  const safeCap = cfg.river.safeCapacityMeters;
  const curr = riverData.currentLevelM;
  const peak = riverData.peakLevelM;
  const peakDate = riverData.peakDate || "Thursday evening";
  const ratio = (peak / safeCap) * 100;

  let risk = 'SAFE', riskLabel = 'Safe', riskPill = 'ok', riskSub = 'Normal water levels';
  if (ratio >= cfg.thresholds.warningMax) {
    risk = 'FLOOD'; riskLabel = 'Flood Overflow'; riskPill = 'bd'; riskSub = 'Threshold: > 100% capacity';
  } else if (ratio >= cfg.thresholds.watchMax) {
    risk = 'WARNING'; riskLabel = 'Warning'; riskPill = 'bd'; riskSub = 'Threshold: 80% - 100% capacity';
  } else if (ratio >= cfg.thresholds.safeMax) {
    risk = 'WATCH'; riskLabel = 'Watch'; riskPill = 'am'; riskSub = 'Threshold: 60% - 80% capacity';
  }

  const currPct = Math.round((curr / safeCap) * 100);
  const peakPct = Math.round((peak / safeCap) * 100);

  if ($('#rv-stat-curr')) $('#rv-stat-curr').textContent = `${curr.toFixed(2)} m`;
  const currBar = $('#rv-bar-curr');
  if (currBar) {
    currBar.style.width = `${Math.min(100, currPct)}%`;
    currBar.style.background = currPct >= 100 ? '#BE123C' : currPct >= 80 ? '#BE123C' : currPct >= 60 ? '#F59E0B' : '#10B981';
  }
  if ($('#rv-cap-curr')) $('#rv-cap-curr').textContent = `${currPct}% of ${safeCap.toFixed(2)} m safe capacity`;

  if ($('#rv-stat-peak')) $('#rv-stat-peak').textContent = `${peak.toFixed(2)} m`;
  const peakPill = $('#rv-pill-peak');
  if (peakPill) {
    if (peak >= safeCap) {
      const diff = (peak - safeCap).toFixed(2);
      peakPill.className = 'pill bd';
      peakPill.textContent = `+${diff} m overflow`;
    } else {
      const margin = (safeCap - peak).toFixed(2);
      peakPill.className = peakPct >= 80 ? 'pill am' : 'pill ok';
      peakPill.textContent = `Margin: ${margin} m`;
    }
  }
  if ($('#rv-cap-peak')) $('#rv-cap-peak').textContent = `${peakPct}% of bank capacity (${peakDate.split(' ')[0]})`;

  const riskTitleEl = $('#rv-stat-risk');
  if (riskTitleEl) {
    riskTitleEl.textContent = riskLabel;
    riskTitleEl.style.color = (risk === 'FLOOD' || risk === 'WARNING') ? 'var(--red)' : (risk === 'WATCH' ? '#B45309' : '#047857');
  }

  const riskPillEl = $('#rv-pill-risk');
  if (riskPillEl) {
    riskPillEl.className = `pill ${riskPill}`;
    riskPillEl.textContent = (risk === 'FLOOD') ? 'Critical' : (risk === 'WARNING') ? 'High Alert' : (risk === 'WATCH' ? 'Advisory' : 'Safe');
  }
  if ($('#rv-cap-risk')) $('#rv-cap-risk').textContent = riskSub;

  if ($('#rv-stat-time')) $('#rv-stat-time').textContent = peakDate.split(' ')[0] || "Thursday";
  const timePill = $('#rv-pill-time');
  if (timePill) {
    if (risk === 'FLOOD' || risk === 'WARNING') {
      timePill.className = 'pill bd';
      timePill.textContent = `~${riverData.timeToPeakHours || 48} hrs`;
    } else if (risk === 'WATCH') {
      timePill.className = 'pill am';
      timePill.textContent = `~${riverData.timeToPeakHours || 60} hrs`;
    } else {
      timePill.className = 'pill ok';
      timePill.textContent = 'No threat';
    }
  }
  if ($('#rv-cap-time')) $('#rv-cap-time').textContent = `Expected ${peakDate}`;

  updateRiverGauge(curr, peak, safeCap);
  if ($('#rv-row-qcurr')) $('#rv-row-qcurr').textContent = `${riverData.currentDischargeM3s.toFixed(1)} m³/s`;
  if ($('#rv-row-qpeak')) $('#rv-row-qpeak').textContent = `${riverData.peakDischargeM3s.toFixed(1)} m³/s`;
  const totalRain = riverData.forecast.reduce((acc, f) => acc + (f.rainMm || 0), 0);
  if ($('#rv-row-rain')) $('#rv-row-rain').textContent = `${totalRain.toFixed(1)} mm`;

  drawRiverChart(riverData.history, riverData.forecast, safeCap, peak);
  renderRiverVillages(peak, risk);
  updateRiverSmsPreviews(peakDate);
  evaluateAndTriggerAlert(risk, peak, peakDate);
}

function updateRiverGauge(currLevel, peakLevel, safeCap) {
  const currRatio = Math.round((currLevel / safeCap) * 100);
  const peakRatio = Math.round((peakLevel / safeCap) * 100);
  let strokeColor = '#10B981', stop0 = '#34D399', stop1 = '#A7F3D0', fillBg = '#ECFDF5', textCol = '#047857';
  let badgeTxt = 'Safe level', badgeCls = 'ok';

  if (currRatio >= 100 || peakRatio >= 100) {
    strokeColor = '#E11D48'; stop0 = '#F43F5E'; stop1 = '#FDA4AF'; fillBg = '#FFF1F2'; textCol = '#BE123C';
    badgeTxt = 'Overflow risk'; badgeCls = 'bd';
  } else if (currRatio >= 80 || peakRatio >= 80) {
    strokeColor = '#E11D48'; stop0 = '#FB7185'; stop1 = '#FECDD3'; fillBg = '#FFF1F2'; textCol = '#BE123C';
    badgeTxt = 'Warning'; badgeCls = 'bd';
  } else if (currRatio >= 60 || peakRatio >= 60) {
    strokeColor = '#F59E0B'; stop0 = '#FBBF24'; stop1 = '#FDE68A'; fillBg = '#FFFBEB'; textCol = '#B45309';
    badgeTxt = 'Watch closely'; badgeCls = 'am';
  }

  const badge = $('#rv-gauge-badge');
  if (badge) { badge.className = `pill ${badgeCls}`; badge.textContent = badgeTxt; }

  const clampedRatio = Math.min(130, Math.max(10, currRatio));
  const waterY = Math.round(200 - (clampedRatio / 100) * 130);
  const capY = Math.round(200 - 130);

  const wrap = $('#rv-gauge-wrap');
  if (wrap) {
    wrap.innerHTML = `
      <svg viewBox="0 0 160 210">
        <defs>
          <clipPath id="rc-clip"><rect x="10" y="10" width="140" height="190" rx="24"/></clipPath>
          <linearGradient id="rg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${stop0}"/>
            <stop offset="1" stop-color="${stop1}"/>
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="140" height="190" rx="24" fill="${fillBg}" stroke="${stop1}" stroke-width="4"/>
        <g clip-path="url(#rc-clip)">
          <path d="M0 ${waterY + 8}q20-10 40 0t40 0 40 0 40 0V210H0z" fill="url(#rg-grad)"/>
          <path d="M0 ${waterY}q20-10 40 0t40 0 40 0 40 0" fill="none" stroke="${strokeColor}" stroke-width="1.500"/>
          <line x1="10" x2="150" y1="${capY}" y2="${capY}" stroke="#BE123C" stroke-dasharray="4 3" stroke-width="1.5"/>
          <text x="80" y="${capY - 4}" text-anchor="middle" font-size="8" font-weight="700" fill="#BE123C">SAFE CAPACITY 4.50m</text>
        </g>
        <text x="80" y="44" text-anchor="middle" font-size="30" font-weight="800" fill="${textCol}" font-family="Inter,sans-serif">${currRatio}%</text>
        <text x="80" y="58" text-anchor="middle" font-size="9" fill="#64748B" font-family="Inter,sans-serif">${currRatio >= 100 ? 'CAPACITY EXCEEDED' : 'RIVER CAPACITY USED'}</text>
      </svg>
    `;
  }
}

function drawRiverChart(history, forecast, safeCap, peakLevel) {
  const chartEl = $('#rv-chart');
  if (!chartEl) return;

  const pts = [...history.map(h => h.levelM), ...forecast.map(f => f.levelM)];
  const labels = [...history.map(h => h.label), ...forecast.map(f => f.label)];
  const L = 44, R = 625, Tp = 18, H = 205, maxGauge = 6.0;
  const X = i => L + (R - L) * i / 13;
  const Y = v => Tp + H * (maxGauge - v) / maxGauge;

  let g = '';
  [0, 1.5, 3.0, 4.5, 6.0].forEach(v => {
    g += `<line x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#F1F5F9"/><text x="${L - 8}" y="${Y(v) + 3.5}" text-anchor="end" font-size="10" fill="#94A3B8">${v.toFixed(1)}m</text>`;
  });

  labels.forEach((lb, i) => {
    const showLabel = (i % 2 === 0 || i === 6 || i === 13);
    g += `<line y1="${Tp}" y2="${Tp + H}" x1="${X(i)}" x2="${X(i)}" stroke="#F8FAFC"/>`;
    if (showLabel) {
      const shortLb = lb.split(' ')[0];
      g += `<text x="${X(i)}" y="${Tp + H + 18}" text-anchor="middle" font-size="9.5" fill="#94A3B8">${shortLb}</text>`;
    }
  });

  const sepX = (X(6) + X(7)) / 2;
  g += `<line x1="${sepX}" x2="${sepX}" y1="${Tp}" y2="${Tp + H}" stroke="#CBD5E1" stroke-dasharray="3 3" stroke-width="1.2"/>`;
  g += `<text x="${sepX - 6}" y="${Tp + 12}" font-size="8.5" font-weight="700" fill="#64748B" text-anchor="end">PAST 7D</text>`;
  g += `<text x="${sepX + 6}" y="${Tp + 12}" font-size="8.5" font-weight="700" fill="#0F766E" text-anchor="start">FORECAST 7D</text>`;

  let dPast = `M${X(0)} ${Y(pts[0])}`;
  for (let i = 0; i < 6; i++) {
    const x0 = X(i), y0 = Y(pts[i]), x1 = X(i + 1), y1 = Y(pts[i + 1]);
    const mx = (x0 + x1) / 2;
    dPast += ` C${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  g += `<path d="${dPast} L${X(6)} ${Tp + H} L${X(0)} ${Tp + H}Z" fill="#0F766E" opacity=".10"/>`;
  g += `<path d="${dPast}" fill="none" stroke="#0F766E" stroke-width="2.5"/>`;

  let dFore = `M${X(6)} ${Y(pts[6])}`;
  for (let i = 6; i < 13; i++) {
    const x0 = X(i), y0 = Y(pts[i]), x1 = X(i + 1), y1 = Y(pts[i + 1]);
    const mx = (x0 + x1) / 2;
    dFore += ` C${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  const foreColor = peakLevel >= safeCap ? '#BE123C' : '#2563EB';
  g += `<path d="${dFore} L${X(13)} ${Tp + H} L${X(6)} ${Tp + H}Z" fill="${foreColor}" opacity=".07"/>`;
  g += `<path d="${dFore}" fill="none" stroke="${foreColor}" stroke-width="2.5" stroke-dasharray="6 3"/>`;

  pts.forEach((v, i) => {
    const isPeak = (v === peakLevel && i >= 6);
    const dotColor = isPeak ? '#BE123C' : (i <= 6 ? '#0F766E' : foreColor);
    if (isPeak) {
      g += `<circle cx="${X(i)}" cy="${Y(v)}" r="7" fill="#FFF1F2" stroke="#BE123C" stroke-width="2"/>`;
      g += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="#BE123C"/>`;
      g += `<text x="${X(i)}" y="${Y(v) - 11}" font-size="9" font-weight="800" fill="#BE123C" text-anchor="middle">PEAK ${v.toFixed(2)}m</text>`;
    } else {
      g += `<circle cx="${X(i)}" cy="${Y(v)}" r="2.8" fill="${dotColor}"/>`;
    }
  });

  const capY = Y(safeCap);
  g += `<line x1="${L}" x2="${R}" y1="${capY}" y2="${capY}" stroke="#E11D48" stroke-dasharray="5 4" stroke-width="1.5"/>`;
  g += `<text x="${L + 86}" y="${capY - 6}" font-size="9" font-weight="700" fill="#E11D48" text-anchor="middle">SAFE CAPACITY LIMIT (4.50 m)</text>`;

  chartEl.innerHTML = g;
}

function renderRiverVillages(peakLevel, risk) {
  const tbody = $('#rv-villages-tbody');
  if (!tbody || !RIVER_CONFIG.villages) return;

  let highRiskCount = 0;
  tbody.innerHTML = RIVER_CONFIG.villages.map(v => {
    const vPeak = peakLevel * v.riskMultiplier;
    const vRatio = (vPeak / v.safeThresholdM) * 100;
    let vRisk = 'Safe', pillClass = 'ok';
    if (vRatio >= 100) { vRisk = 'Flood Overflow'; pillClass = 'bd'; highRiskCount++; }
    else if (vRatio >= 80) { vRisk = 'Warning'; pillClass = 'bd'; highRiskCount++; }
    else if (vRatio >= 60) { vRisk = 'Watch'; pillClass = 'am'; }
    return `
      <tr>
        <td><b>${v.name}</b></td>
        <td>${v.distanceKm}</td>
        <td>${v.elevation}</td>
        <td>${v.safeThresholdM.toFixed(2)} m</td>
        <td><b>${vPeak.toFixed(2)} m</b> <span class="small">(${Math.round(vRatio)}%)</span></td>
        <td><span class="pill ${pillClass}">${vRisk}</span></td>
        <td>${v.farmers}</td>
        <td style="color:var(--body);font-size:12px">${v.actionEn}</td>
      </tr>
    `;
  }).join('');

  const summaryChip = $('#rv-villages-summary');
  if (summaryChip) {
    summaryChip.textContent = `${highRiskCount} Village${highRiskCount === 1 ? '' : 's'} at Flood Overflow Risk`;
    summaryChip.className = highRiskCount > 0 ? 'chip amb' : 'chip';
  }
}

function updateRiverSmsPreviews(exceedTime) {
  const riverName = (RIVER_CONFIG && RIVER_CONFIG.river) ? RIVER_CONFIG.river.name : "Yan Oya";
  const enMsg = `Flood warning: ${riverName} River may overflow by ${exceedTime}. Move livestock and equipment to higher ground. Avoid crossing the river. — Yala-Maha Assist`;
  const siTime = exceedTime.includes('Thursday') ? 'බ්‍රහස්පතින්දා සවස' : exceedTime;
  const taTime = exceedTime.includes('Thursday') ? 'வியாழன் மாலை' : exceedTime;
  const siMsg = `ගංවතුර අනතුරු ඇඟවීම: ${siTime} වන විට යාන් ඔය පිටාර ගැලීමේ අවදානමක් ඇත. ගවයන් සහ උපකරණ උස් ස්ථානවලට ගෙන යන්න. ගඟ හරහා යාමෙන් වළකින්න. — Yala-Maha Assist`;
  const taMsg = `வெள்ள எச்சரிக்கை: ${taTime}க்குள் யான் ஓயா நதி நிரம்பி வழியக்கூடும். கால்நடைகள் மற்றும் உபகரணங்களை உயரமான இடங்களுக்கு நகர்த்தவும். நதியைக் கடப்பதைத் தவிர்க்கவும். — Yala-Maha Assist`;

  if ($('#rv-prev-en')) $('#rv-prev-en').textContent = enMsg;
  if ($('#rv-prev-si')) $('#rv-prev-si').textContent = siMsg;
  if ($('#rv-prev-ta')) $('#rv-prev-ta').textContent = taMsg;
}

function evaluateAndTriggerAlert(risk, peakLevel, exceedTime) {
  const isAlertRisk = (risk === 'WARNING' || risk === 'FLOOD');
  if (isAlertRisk) {
    if (lastDispatchedRisk !== risk) {
      if (riverAutoSend) {
        dispatchSMSAlert(risk, peakLevel, exceedTime);
        lastDispatchedRisk = risk;
      } else {
        pendingOfficerAlert = { risk, peakLevel, exceedTime };
        showOfficerBanner(risk, peakLevel, exceedTime);
      }
    }
  } else {
    if (typeof floodAlertActive !== 'undefined' && floodAlertActive && (lastDispatchedRisk === 'WARNING' || lastDispatchedRisk === 'FLOOD')) {
      floodAlertActive = false;
      lastDispatchedRisk = risk;
      try { localStorage.removeItem('yala_maha_flood_alert'); } catch(e){}
      if (typeof render === 'function') render();
      toast(`River risk dropped to ${risk.toLowerCase()}. Flood alert cleared.`);
    }
    hideOfficerBanner();
  }
}

function dispatchSMSAlert(risk, peakLevel, exceedTime) {
  if (typeof floodAlertActive !== 'undefined') floodAlertActive = true;
  if (typeof floodPeakDisplay !== 'undefined') {
    floodPeakDisplay = `${peakLevel.toFixed(2)} m (${Math.round((peakLevel / RIVER_CONFIG.river.safeCapacityMeters) * 100)}%)`;
  }
  if (typeof floodTimeDisplay !== 'undefined') {
    floodTimeDisplay = {
      en: exceedTime,
      si: exceedTime.includes('Thursday') ? 'බ්‍රහස්පතින්දා සවස' : exceedTime,
      ta: exceedTime.includes('Thursday') ? 'வியாழன் மாலை' : exceedTime
    };
  }

  try {
    localStorage.setItem('yala_maha_flood_alert', JSON.stringify({
      active: true,
      risk: risk,
      peak: floodPeakDisplay,
      time: exceedTime
    }));
  } catch (e) {}

  const alertText = `Flood warning: Yan Oya River may overflow by ${exceedTime}. Move livestock…`;
  if (typeof addSmsHistoryEntry === 'function') {
    addSmsHistoryEntry([
      'Just now (River Auto)',
      RIVER_CONFIG.alerts.targetGroup || 'Downstream',
      alertText,
      String(RIVER_CONFIG.alerts.affectedFarmerCount || 412),
      'bd',
      'Delivered'
    ]);
  }

  if (typeof render === 'function') render();
  toast(`Flood warning SMS broadcast dispatched to ${RIVER_CONFIG.alerts.affectedFarmerCount || 412} farmers`);
}

function showOfficerBanner(risk, peakLevel, exceedTime) {
  const b = $('#rv-officer-banner');
  if (!b) return;
  if ($('#rv-banner-title')) $('#rv-banner-title').textContent = `${risk} Alert Detected: Officer Authorization Required`;
  if ($('#rv-banner-msg')) $('#rv-banner-msg').textContent = `Yan Oya River forecast to reach ${peakLevel.toFixed(2)} m by ${exceedTime}. Ready to broadcast to 412 downstream farmers.`;
  b.style.display = 'block';
}

function hideOfficerBanner() {
  const b = $('#rv-officer-banner');
  if (b) b.style.display = 'none';
  pendingOfficerAlert = null;
}
