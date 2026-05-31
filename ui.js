/* ═══════════════════════════════════════════════════════
   UI LAYER — Rendering functions
   ═══════════════════════════════════════════════════════ */

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

const LIVE_FARE_CACHE_KEY = 'flightLiveFareSnapshot';

// ─── HELPERS ─────────────────────────────────────────
function fmt(n) { return n == null ? 'Unknown' : '$' + n.toLocaleString(); }
function fmtK(n) { return n == null ? 'Unknown' : (n / 1000).toFixed(0) + 'k'; }
function badgeClass(rec) {
  const m = { 'Buy Now': 'buy', 'Strong': 'strong', 'Watch': 'watch', 'Avoid': 'avoid' };
  return m[rec] || 'neutral';
}
function recToBadge(rec) {
  return `<span class="badge badge-${badgeClass(rec.label)}">${rec.label}</span>`;
}
function programBadge(prog) {
  if (!prog || prog === 'cash') return '<span class="badge badge-cash">Cash</span>';
  if (prog.toLowerCase().includes('united')) return '<span class="badge badge-points">United</span>';
  if (prog.toLowerCase().includes('amex') || prog.toLowerCase().includes('ana') || prog.toLowerCase().includes('asia')) return '<span class="badge badge-points">Amex MR</span>';
  if (prog.toLowerCase().includes('chase') || prog.toLowerCase().includes('aeroplan')) return '<span class="badge badge-points">Chase UR</span>';
  return `<span class="badge badge-neutral">${prog}</span>`;
}
function familyBadge(score) {
  const l = getFamilyScoreLabel(score);
  return `<span class="badge badge-${l.class}">${score}/10</span>`;
}
function availBadge(avail) {
  if (avail.status === 'cash') return '';
  const cls = avail.bookable ? 'badge-good' : 'badge-poor';
  return `<span class="badge ${cls}">${avail.label}</span>`;
}

function normalizeApiBase(apiUrl) {
  return String(apiUrl || '').trim().replace(/\/+$/, '');
}

function setLiveRefreshStatus(message, kind = 'info') {
  const el = $('#live-refresh-status');
  if (!el) return;
  el.textContent = message || '';
  el.dataset.kind = kind;
}

function liveCashItineraries() {
  return itineraries.filter(it => it.paymentType === 'cash' && it.outboundDate && it.returnDate);
}

function getLiveFareSnapshot() {
  try {
    const raw = localStorage.getItem(LIVE_FARE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLiveFareSnapshot(snapshot) {
  try {
    localStorage.setItem(LIVE_FARE_CACHE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('Could not save live fare snapshot:', e);
  }
}

function applyLiveFareSnapshot() {
  const snapshot = getLiveFareSnapshot();
  if (!snapshot || !Array.isArray(snapshot.results)) return;
  snapshot.results.forEach(result => {
    if (!result || !result.ok || result.price == null) return;
    const it = itineraries.find(item => item.id === result.id);
    if (!it) return;
    it.cashPricePerPerson = result.price;
    it.liveUpdatedAt = result.fetchedAt || snapshot.fetchedAt;
    it.liveSource = result.cacheStatus === 'HIT' ? 'Live API cache' : 'Live API';
    it.liveCacheStatus = result.cacheStatus || '';
  });
}

function buildLiveFareQueries() {
  return liveCashItineraries().map(it => ({
    id: it.id,
    origin: it.origin,
    destination: it.destination,
    departureDate: it.outboundDate,
    returnDate: it.returnDate,
    adults: passengerConfig.adults,
    children: passengerConfig.children,
    currency: 'USD',
    max: 20,
    cacheTtl: 900,
  }));
}

function liveFareLabel(it) {
  if (!it?.liveUpdatedAt) return 'Manual snapshot';
  const stamp = new Date(it.liveUpdatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const source = it.liveCacheStatus === 'HIT' ? 'Live API cache' : 'Live API';
  return `${source} · ${stamp}`;
}

async function mapWithConcurrency(items, limit, mapper) {
  const out = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ─── OVERALL STATUS ──────────────────────────────────
function getOverallStatus(enriched) {
  const hasBuy = enriched.some(it => it.recommendation.label === 'Buy Now');
  const hasStrong = enriched.some(it => it.recommendation.label === 'Strong');
  if (hasBuy) return {
    status: 'buy', label: 'BUY NOW',
    text: 'There are strong buying opportunities available. Review the top options and book soon.'
  };
  if (hasStrong) return {
    status: 'compare', label: 'COMPARE OPTIONS',
    text: 'Several strong candidates exist. Compare cash vs points and review alternative airports before deciding.'
  };
  return {
    status: 'watch', label: 'WATCH & WAIT',
    text: 'Direct Guangzhou is still expensive. Monitor HKG and open-jaw options. Buy if JFK–CAN nonstop drops below $1,500 or HKG adjusted total saves $250+.'
  };
}

function renderStatusBanner(enriched) {
  const s = getOverallStatus(enriched);
  return `<div class="status-banner ${s.status}">
    <div><div class="status-label">Current recommendation: ${s.label}</div>
    <div class="status-text">${s.text}</div></div>
  </div>`;
}

// ─── SUMMARY CARDS ───────────────────────────────────
function getItineraryPriceSummary(it) {
  if (!it) return { total: 'Unknown', perPerson: 'Unknown' };
  const isPoints = it.paymentType === 'points' || it.pointsPerPerson != null;
  if (isPoints) {
    const points = it.totalPointsForFamily || (it.pointsPerPerson ? it.pointsPerPerson * passengerConfig.total : null);
    const taxes = it.taxesPerPerson != null ? it.taxesPerPerson * passengerConfig.total : null;
    return {
      total: points ? `${fmtK(points)} pts${taxes ? ` + ${fmt(taxes)}` : ''}` : 'Unknown',
      perPerson: it.pointsPerPerson ? `${fmtK(it.pointsPerPerson)} pts/pp` : 'Unknown'
    };
  }
  const total = it.adjustedTotal || it.adjustedTotalForFamily || it.cashTotal || it.totalCashForFamily || it.totalCostCalculated;
  return {
    total: fmt(total),
    perPerson: fmt(it.adjustedPerPerson || it.cashPricePerPerson || (total ? Math.round(total / passengerConfig.total) : null))
  };
}

function getTrustSummary(it) {
  if (!it) return { verified: false, mock: false, needs: true, progress: '0/10 checked' };
  const statuses = typeof itineraryStatusBadges === 'function' ? itineraryStatusBadges(it) : [];
  const progress = typeof getVerificationProgress === 'function' ? getVerificationProgress(it) : { checked: 0, total: 10 };
  return {
    verified: statuses.includes('Verified'),
    mock: statuses.includes('Mock'),
    needs: statuses.includes('Needs Verification') || statuses.includes('Needs Details'),
    progress: `${progress.checked}/${progress.total} checked`
  };
}

function scoreForDecision(it, mode = 'overall') {
  if (!it) return -Infinity;
  const recOrder = { 'Buy Now': 40, Strong: 30, Watch: 10, Avoid: -50 };
  const recLabel = it.recommendation?.label || it.recommendation || 'Watch';
  const trust = getTrustSummary(it);
  const riskPenalty = it.riskLevel === 'High' ? 20 : it.riskLevel === 'Medium' ? 8 : 0;
  const cost = it.adjustedPerPerson || it.cashPricePerPerson || 1800;
  const costScore = Math.max(0, 25 - (cost - 900) / 35);
  const family = (it.familyScore || 6) * 3;
  const verifiedBonus = trust.verified ? 10 : trust.mock ? -14 : 0;
  const modeBonus =
    mode === 'kids' ? (it.familyScore || 0) * 4 :
    mode === 'cheap' ? Math.max(0, 35 - cost / 45) :
    mode === 'points' ? ((it.cpp || 0) * 10 + (it.familyBookable ? 10 : -20)) :
    0;
  return (recOrder[recLabel] ?? 10) + costScore + family + verifiedBonus + modeBonus - riskPenalty;
}

function pickOption(enriched, mode) {
  const list = enriched
    .filter(it => (it.recommendation?.label || it.recommendation) !== 'Avoid')
    .filter(it => mode !== 'points' || ((it.paymentType === 'points' || it.pointsPerPerson != null) && it.familyBookable && (it.cpp || 0) >= 1.2))
    .filter(it => mode !== 'cheap' || it.cashPricePerPerson != null)
    .filter(it => mode !== 'kids' || it.riskLevel !== 'High');
  if (!list.length) return null;
  return list.reduce((best, it) => scoreForDecision(it, mode) > scoreForDecision(best, mode) ? it : best, list[0]);
}

function getNextVerificationStep(it) {
  if (!it) return 'Add a current fare observation with price, seats, baggage, and source.';
  const p = typeof getVerificationProgress === 'function' ? getVerificationProgress(it) : null;
  if (!p) return 'Recheck price, baggage, seat selection, and fare rules.';
  const missing = TRUST_CHECKLIST
    .filter(([key]) => !p.state[key])
    .map(([, label]) => label);
  return missing.length ? `Verify ${missing[0]}.` : 'Recheck final airline price before booking.';
}

function renderSummaryCard(slot) {
  const it = slot.data;
  if (!it) {
    return `<div class="s-card empty-recommendation">
      <div class="s-card-label">${slot.label}</div>
      <div class="s-card-route">${slot.emptyTitle || 'Not enough verified data yet'}</div>
      <div class="s-card-reason">${slot.emptyReason || 'Start by checking JFK/EWR to CAN and JFK/EWR to HKG for 4 passengers.'}</div>
    </div>`;
  }
  const price = getItineraryPriceSummary(it);
  const trust = getTrustSummary(it);
  const recLabel = it.recommendation?.label || it.recommendation || 'Watch';
  const recCls = badgeClass(recLabel);
  const duration = it.totalDurationHours ? `${it.totalDurationHours}h` : it.totalDurationMinutesOutbound ? `${Math.round(it.totalDurationMinutesOutbound / 60)}h` : 'Unknown';
  const stops = it.stops != null ? (it.stops === 0 ? 'Nonstop' : `${it.stops}-stop`) : it.stopsOutbound != null ? (it.stopsOutbound === 0 ? 'Nonstop' : `${it.stopsOutbound}-stop`) : 'Unknown stops';
  const route = `${it.origin || 'Unknown'} → ${String(it.destination || 'Unknown').replace('→', ' / ')}`;
  const airline = it.airline || 'Unknown airline';
  const reason = slot.reason || it.recommendation?.reason || it.recommendationReason || it.notes || 'Promising route, but recheck before booking.';
  const sample = trust.mock ? '<span class="sample-label">SAMPLE</span>' : '';
  return `<div class="s-card ${slot.featured ? 'featured' : ''}" onclick="focusItinerary('${it.id}')">
    <div class="s-card-stripe ${slot.stripe || 'blue'}"></div>
    <div class="s-card-label">${slot.label} ${sample}</div>
    <div class="s-card-route">${route}</div>
    <div class="s-card-airline">${airline}</div>
    <div class="s-card-price">${price.total}</div>
    <div class="s-card-meta">${price.perPerson} · ${duration} · ${stops}</div>
    <div class="s-card-meta">${riskBadgeText(it)} · Family ${it.familyScore || 'Unknown'}/10 · ${trust.progress}</div>
    <div style="margin:8px 0"><span class="badge badge-${recCls}">${recLabel}</span> ${trust.needs ? '<span class="badge badge-watch">Needs verification</span>' : '<span class="badge badge-buy">Verified</span>'}</div>
    <div class="s-card-reason">${reason}</div>
    <div class="s-card-next"><strong>Next:</strong> ${getNextVerificationStep(it)}</div>
  </div>`;
}

function riskBadgeText(it) {
  if (it?.riskLevel) return `${it.riskLevel} risk`;
  if (!it) return 'Needs verification';
  const dest = String(it.destination || '').split('→')[0];
  if (it.routeType?.includes('Open-jaw')) return 'Medium risk';
  if (dest === 'PVG' || dest === 'SHA') return 'Medium risk';
  if ((it.stops || 0) <= 1) return 'Low risk';
  return 'Medium risk';
}

function focusItinerary(id) {
  const tab = document.querySelector('[data-tab="flights"]');
  if (tab) tab.click();
  setTimeout(() => {
    const el = document.getElementById(`itin-${id}`) || document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);
}

function renderSummaryCards(enriched) {
  if (!enriched.length) {
    return renderSummaryCard({
      label: 'Not enough verified data yet',
      emptyTitle: 'No itinerary data loaded',
      emptyReason: 'Add or import route data before using this decision monitor.'
    });
  }
  const best = pickOption(enriched, 'overall');
  const cheap = pickOption(enriched, 'cheap');
  const kids = pickOption(enriched, 'kids');
  const points = pickOption(enriched, 'points');
  const cards = [
    { data: best, label: 'Best Overall', stripe: 'blue', featured: true, reason: best ? 'Best balance of route simplicity, family score, and adjusted cost.' : '' },
    { data: cheap, label: 'Cheapest Acceptable', stripe: 'green', reason: cheap ? 'Lowest adjusted cash option that is not marked Avoid.' : '' },
    { data: kids, label: 'Best With Kids', stripe: 'amber', reason: kids ? 'Highest family fit among routes that avoid high-risk complexity.' : '' },
    { data: points, label: 'Best Points / Miles Option', stripe: 'purple', emptyTitle: 'No strong points option yet', emptyReason: 'No verified 4-seat points option clears the value and family-fit checks.' }
  ];
  return cards.map(renderSummaryCard).join('');
}

// ─── ROUTE CARDS ─────────────────────────────────────
function renderRiskChips(it) {
  const risks = getRiskFactors(it);
  if (risks.length === 0) return '<span class="badge badge-buy">Low Risk</span>';
  const level = getRiskLevel(risks);
  const chips = risks.slice(0, 3).map(r => `<span class="badge badge-${r.weight === 'High' ? 'avoid' : r.weight === 'Medium' ? 'watch' : 'neutral'}" title="${r.weight}">${r.label}</span>`).join(' ');
  return `<span class="badge badge-${level.class}">${level.level} Risk</span> ${chips}`;
}

function renderSearchButtons(it) {
  const links = getSearchLinksForItinerary(it);
  return links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="btn-sm">${l.icon} ${l.name}</a>`).join('');
}

function renderRouteCard(it) {
  const rc = badgeClass(it.recommendation.label);
  const rcClass = `rec-${rc === 'buy' ? 'buy' : rc === 'strong' ? 'strong' : rc === 'avoid' ? 'avoid' : 'watch'}`;
  const hardNos = checkHardNos(it);
  const decisionScore = it.overallScore || Math.round((it.familyScore || 6) * 10);

  let priceMetrics = '';
  if (it.cashPricePerPerson != null) {
    priceMetrics = `
      <div class="metric"><div class="metric-label">Price / person</div><div class="metric-value">${fmt(it.cashPricePerPerson)}</div><div class="metric-note">${liveFareLabel(it)}</div></div>
      <div class="metric"><div class="metric-label">Total for 4</div><div class="metric-value">${fmt(it.cashTotal)}</div></div>
      <div class="metric"><div class="metric-label">Adjusted total</div><div class="metric-value">${fmt(it.adjustedTotal)}</div></div>`;
  } else {
    priceMetrics = `
      <div class="metric"><div class="metric-label">Points / person</div><div class="metric-value">${fmtK(it.pointsPerPerson)}</div></div>
      <div class="metric"><div class="metric-label">Total points × 4</div><div class="metric-value">${fmtK(it.pointsPerPerson * passengerConfig.total)}</div></div>
      <div class="metric"><div class="metric-label">Taxes / person</div><div class="metric-value">${fmt(it.taxesPerPerson)}</div></div>`;
  }

  const savings = it.savings != null && it.savings !== 0
    ? `<div class="metric"><div class="metric-label">vs Direct CAN</div><div class="metric-value ${it.savings > 0 ? 'text-green' : 'text-red'}">${it.savings > 0 ? 'Saves' : 'Costs'} ${fmt(Math.abs(it.savings))}</div></div>` : '';

  const cppHtml = it.cpp != null
    ? `<div class="rc-detail"><strong>CPP:</strong> ${it.cpp.toFixed(1)} <span class="badge badge-${it.cppRating.class}" style="margin-left:4px">${it.cppRating.label}</span></div>` : '';

  const hardNoHtml = hardNos.length > 0
    ? `<div style="margin-top:8px;padding:8px 12px;background:var(--avoid-bg);border-radius:8px;font-size:.78rem;color:var(--avoid)">⛔ ${hardNos.map(h => h.reason).join(' · ')}</div>` : '';

  const buyBtn = it.recommendation.label === 'Buy Now'
    ? `<button class="btn-sm primary" onclick="showChecklist('${it.id}')">✅ Booking Checklist</button>` : '';

  return `<div class="route-card ${rcClass}" id="${it.id}">
    <div class="rc-header">
      <div class="rc-route">${it.origin} → ${it.destination} <span style="font-weight:400;color:var(--muted);font-size:.85rem">${it.airline}</span></div>
      <div class="rc-tags">${recToBadge(it.recommendation)} ${programBadge(it.program)} ${it.availability ? availBadge(it.availability) : ''} <span class="badge badge-neutral">Score: ${decisionScore}/100</span></div>
    </div>
    <div class="metrics">${priceMetrics}
      <div class="metric"><div class="metric-label">Family Score</div><div class="metric-value">${familyBadge(it.familyScore)}</div></div>
      ${savings}
    </div>
    <div class="rc-details">
      <div class="rc-detail"><strong>Duration:</strong> ${it.totalDurationHours || it.totalHours || 'Unknown'}${it.totalDurationHours || it.totalHours ? 'h' : ''}</div>
      <div class="rc-detail"><strong>Stops:</strong> ${it.stops === 0 ? 'Nonstop' : it.stops}</div>
      <div class="rc-detail"><strong>Dates:</strong> ${it.outboundDate || '—'} → ${it.returnDate || '—'}</div>
      ${cppHtml}
      ${it.payment ? `<div class="rc-detail"><strong>Pay with:</strong> <span class="badge badge-${it.payment.class === 'points' ? 'points' : it.payment.class === 'mixed' ? 'mixed' : 'cash'}">${it.payment.method}</span></div>` : ''}
    </div>
    <div style="margin:8px 0;display:flex;flex-wrap:wrap;gap:4px">${renderRiskChips(it)}</div>
    ${hardNoHtml}
    <div class="rc-footer">
      <div class="rc-reason">💡 ${it.notes}</div>
      <div class="rc-actions" style="flex-wrap:wrap">${renderSearchButtons(it)} ${buyBtn}</div>
    </div>
  </div>`;
}

function renderRouteCards(enriched) {
  return enriched.map(renderRouteCard).join('');
}

// ─── COMPARISON TABLE ────────────────────────────────
let tableSortCol = 'overallScore';
let tableSortDesc = true;

function setTableSort(col) {
  if (tableSortCol === col) {
    tableSortDesc = !tableSortDesc;
  } else {
    tableSortCol = col;
    tableSortDesc = true;
  }
  const enriched = getEnrichedItineraries();
  $('#comparison-table').innerHTML = renderComparisonTable(enriched);
}

function renderComparisonTable(enriched) {
  const getArrow = (col) => {
    if (tableSortCol !== col) return '';
    return tableSortDesc ? ' ▼' : ' ▲';
  };

  const sorted = [...enriched];
  sorted.sort((a, b) => {
    let valA, valB;
    if (tableSortCol === 'route') {
      valA = `${a.origin} → ${a.destination}`;
      valB = `${b.origin} → ${b.destination}`;
    } else if (tableSortCol === 'type') {
      valA = a.routeFamily;
      valB = b.routeFamily;
    } else if (tableSortCol === 'totalCost') {
      valA = a.totalCostCalculated || 999999;
      valB = b.totalCostCalculated || 999999;
    } else if (tableSortCol === 'adjustedTotal') {
      valA = a.adjustedTotal || 999999;
      valB = b.adjustedTotal || 999999;
    } else if (tableSortCol === 'cpp') {
      valA = a.cpp || 0;
      valB = b.cpp || 0;
    } else if (tableSortCol === 'family') {
      valA = a.familyScorePercent || 0;
      valB = b.familyScorePercent || 0;
    } else {
      valA = a.overallScore || 0;
      valB = b.overallScore || 0;
    }

    if (valA < valB) return tableSortDesc ? 1 : -1;
    if (valA > valB) return tableSortDesc ? -1 : 1;
    return 0;
  });

  const rows = sorted.map(it => {
    const isPoints = it.paymentType === 'points' || it.pointsPerPerson != null;
    const pricePerPerson = isPoints
      ? fmt(it.taxesPerPerson) + ' + ' + fmtK(it.pointsPerPerson) + ' pts'
      : fmt(it.cashPricePerPerson);
    const totalFor4 = isPoints
      ? fmt(it.taxesPerPerson * 4) + ' + ' + (it.pointsPerPerson * 4 / 1000).toFixed(0) + 'k pts'
      : fmt(it.cashPricePerPerson * 4);
    const adjTotal = isPoints ? 'Unknown' : (it.adjustedTotal ? fmt(it.adjustedTotal) : 'Unknown');
    const fScore = (it.familyScorePercent / 10).toFixed(1);
    const riskLabel = it.riskLevel || (it.riskScore >= 80 ? 'Low' : it.riskScore >= 50 ? 'Medium' : 'High');

    // Color flags for risk in table
    const riskCls = it.riskScore >= 80 ? 'buy' : it.riskScore >= 50 ? 'watch' : 'avoid';

    return `<tr onclick="const btn = document.querySelector('[data-tab=\\'flights\\']'); if(btn) btn.click(); const el = document.getElementById('itin-${it.id}'); if(el) el.scrollIntoView({behavior:'smooth'});" style="cursor:pointer">
      <td><strong>${it.origin} → ${it.destination}</strong><br><span style="font-size:.7rem;color:var(--muted)">${it.airline}</span></td>
      <td>${it.routeFamily || it.routeType || 'Route type unknown'}</td>
      <td class="text-right mono">${pricePerPerson}</td>
      <td class="text-right mono">${totalFor4}</td>
      <td class="text-right mono font-semibold">${adjTotal}</td>
      <td class="text-center">${programBadge(it.pointsProgram || it.program)}</td>
      <td class="text-center mono">
        <span class="badge badge-${riskCls}">${riskLabel} (${it.riskScore ?? 'Not checked'})</span>
      </td>
      <td class="text-center mono">${it.cpp ? it.cpp.toFixed(1) : '—'}</td>
      <td class="text-center">
        <span class="badge badge-${getFamilyScoreLabel(parseFloat(fScore)).class}">${fScore}/10</span>
      </td>
      <td class="text-center">
        <span class="badge badge-primary" style="font-weight:700;background:var(--accent);color:#fff">${it.overallScore}</span>
      </td>
    </tr>`;
  }).join('');

  return `<div class="table-wrap"><table>
    <thead><tr>
      <th onclick="setTableSort('route')" style="cursor:pointer;white-space:nowrap">Route${getArrow('route')}</th>
      <th onclick="setTableSort('type')" style="cursor:pointer;white-space:nowrap">Type${getArrow('type')}</th>
      <th class="text-right">$/pp</th>
      <th class="text-right" onclick="setTableSort('totalCost')" style="cursor:pointer;white-space:nowrap">Total×4${getArrow('totalCost')}</th>
      <th class="text-right" onclick="setTableSort('adjustedTotal')" style="cursor:pointer;white-space:nowrap">Adj Total${getArrow('adjustedTotal')}</th>
      <th class="text-center">Program</th>
      <th class="text-center">Risk Score</th>
      <th class="text-center" onclick="setTableSort('cpp')" style="cursor:pointer;white-space:nowrap">CPP${getArrow('cpp')}</th>
      <th class="text-center" onclick="setTableSort('family')" style="cursor:pointer;white-space:nowrap">Comfort${getArrow('family')}</th>
      <th class="text-center" onclick="setTableSort('overallScore')" style="cursor:pointer;white-space:nowrap">Score${getArrow('overallScore')}</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ─── HEATMAP ─────────────────────────────────────────
window.filterOutboundDate = null;
window.filterReturnDate = null;

function filterByHeatmapDate(hmOut, hmRet) {
  window.filterOutboundDate = mapHeatmapDateToItineraryDate(hmOut);
  window.filterReturnDate = mapHeatmapDateToItineraryDate(hmRet);
  const btn = document.querySelector('[data-tab="flights"]');
  if (btn) btn.click();
  renderApp();
}

function clearDateFilter() {
  window.filterOutboundDate = null;
  window.filterReturnDate = null;
  renderApp();
}

function mapHeatmapDateToItineraryDate(hmDate, year = 2026) {
  const [mon, dayStr] = hmDate.split(' ');
  const months = { Jun: '06', Jul: '07' };
  const mm = months[mon] || '06';
  const dd = dayStr.padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function renderHeatmap() {
  const hdrCells = heatmapReturnDates.map(d => `<th>${d}</th>`).join('');
  const rows = heatmapOutboundDates.map((outDate, i) => {
    const cells = heatmapReturnDates.map((_, j) => {
      const cell = heatmapData[i][j];
      const cls = { buy: 'hm-buy', strong: 'hm-strong', watch: 'hm-watch', avoid: 'hm-avoid', alt: 'hm-alt' }[cell.rec] || '';
      return `<td class="${cls}" style="cursor:pointer" onclick="filterByHeatmapDate('${outDate}', '${heatmapReturnDates[j]}')" title="${outDate} → ${heatmapReturnDates[j]}: $${cell.price} (${cell.routeType})">$${cell.price}<span class="hm-sub">${cell.routeType}</span></td>`;
    }).join('');
    return `<tr><th>${outDate}</th>${cells}</tr>`;
  }).join('');

  return `<div class="heatmap-wrap"><table class="heatmap">
    <thead><tr><th>Out \\ Return</th>${hdrCells}</tr></thead>
    <tbody>${rows}</tbody></table></div>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:var(--buy-bg);border:1px solid var(--buy-border)"></div> Buy</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--compare-bg);border:1px solid var(--compare-border)"></div> Strong</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--watch-bg);border:1px solid var(--watch-border)"></div> Watch</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--avoid-bg);border:1px solid var(--avoid-border)"></div> Avoid</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--purple-bg);border:1px solid #d8b4fe"></div> Alt Airport</div>
    </div>`;
}

// ─── POINTS STRATEGY ─────────────────────────────────
function renderPointsStrategy() {
  return Object.entries(POINTS_PROGRAMS).map(([key, prog]) => {
    const tags = prog.partners.map(p => `<span class="ptag">${p}</span>`).join('');
    return `<div class="strat-card ${key === 'chaseUR' ? 'chase' : key === 'amexMR' ? 'amex' : 'united'}">
      <h4>${prog.name}</h4>
      <p>Baseline value: <strong>${(prog.value * 100).toFixed(1)}¢ per point</strong></p>
      <p>${prog.notes}</p>
      <div class="partner-tags">${tags}</div>
    </div>`;
  }).join('');
}

// ─── MIXED STRATEGIES ────────────────────────────────
function renderMixedStrategies() {
  return mixedStrategies.map(ms => {
    const pros = ms.pros.map(p => `<li>${p}</li>`).join('');
    const cons = ms.cons.map(c => `<li>${c}</li>`).join('');
    return `<div class="scenario-card">
      <h4>${ms.name}</h4>
      <div class="sc-meta">${ms.description}</div>
      <div class="metrics" style="margin-top:10px">
        <div class="metric"><div class="metric-label">Cash outlay</div><div class="metric-value">${fmt(ms.totalCashOutlay)}</div></div>
        <div class="metric"><div class="metric-label">Points used</div><div class="metric-value">${fmtK(ms.totalPointsUsed)}</div></div>
        <div class="metric"><div class="metric-label">Program</div><div class="metric-value small">${ms.program}</div></div>
        <div class="metric"><div class="metric-label">Complexity</div><div class="metric-value small">${ms.complexity}</div></div>
      </div>
      <div class="pc-grid">
        <div><h5 class="pro-title">Pros</h5><ul>${pros}</ul></div>
        <div><h5 class="con-title">Cons</h5><ul>${cons}</ul></div>
      </div>
    </div>`;
  }).join('');
}

// ─── ALTERNATIVES ────────────────────────────────────
function renderAlternatives() {
  const alts = [
    { code: 'HKG', city: 'Hong Kong', cls: 'primary', items: [
      { k: 'When useful', v: 'Saves $250+ after adjustment' },
      { k: 'Best case', v: 'Arrive early enough for same-day rail to Guangzhou' },
      { k: 'Transfer', v: 'High-speed rail (~1h), cross-border van, or overnight' },
      { k: 'Family fit', v: 'High — well-connected, familiar, easy logistics' },
      { k: 'Rule', v: 'If savings < $150, prefer direct CAN' }
    ]},
    { code: 'SZX', city: 'Shenzhen', cls: 'primary', items: [
      { k: 'When useful', v: 'Saves $200+ after adjustment' },
      { k: 'Transfer', v: 'Easiest alternative — short train or car to Guangzhou' },
      { k: 'Family fit', v: 'High — very close to Guangzhou' },
      { k: 'Limitation', v: 'Fewer direct international flights' },
      { k: 'Rule', v: 'If savings < $150, prefer direct CAN' }
    ]},
    { code: 'PVG/SHA', city: 'Shanghai', cls: 'backup', items: [
      { k: 'When useful', v: 'Saves $400+ or Shanghai is part of the trip plan' },
      { k: 'Transfer', v: 'Domestic flight (~2.5h) or train (~7h) to Guangzhou' },
      { k: 'Family fit', v: 'Medium-Low — extra domestic leg is tiring' },
      { k: 'Priority', v: 'Backup only, not the primary plan' },
      { k: 'Rule', v: 'If savings < $400, avoid for this trip' }
    ]}
  ];
  return alts.map(a => `<div class="city-card ${a.cls}">
    <h4>${a.code === 'PVG/SHA' ? '🔸' : '🔹'} ${a.city} (${a.code})</h4>
    ${a.items.map(i => `<div class="cc-item"><strong>${i.k}:</strong> ${i.v}</div>`).join('')}
  </div>`).join('');
}

// ─── WARNINGS ────────────────────────────────────────
function renderWarnings() {
  return `<div class="warn-box">
    <h3>⚠️ Family Travel Warnings (4 passengers)</h3>
    <ul>
      <li>Award availability for 4 seats is much harder than for 1-2</li>
      <li>Separate tickets increase disruption risk — avoid unless savings are large</li>
      <li>Avoid overnight layovers unless savings are very meaningful for the family</li>
      <li>If mixing cash + points, prefer same flights when possible (separate PNRs are okay)</li>
      <li>Don't recommend separate positioning flights unless savings exceed $400/person</li>
    </ul>
  </div>`;
}

// ─── SEARCH SHORTCUTS ────────────────────────────────
function renderShortcuts() {
  const links = [
    { name: 'Google Flights', desc: 'Multi-airport, heatmap, open-jaw', url: 'https://www.google.com/travel/flights' },
    { name: 'Skyscanner', desc: 'Fare trends, cached low prices', url: 'https://www.skyscanner.com/routes/nyca/can/new-york-to-guangzhou.html' },
    { name: 'KAYAK', desc: 'Airline combos, duration, alerts', url: 'https://www.kayak.com/flight-routes/New-York-NYC/Guangzhou-Baiyun-CAN' },
    { name: 'United.com', desc: 'Award search, Star Alliance', url: 'https://www.united.com/en/us' },
    { name: 'China Southern', desc: 'JFK-CAN nonstop pricing', url: 'https://www.csair.com/us/en/' },
    { name: 'Cathay Pacific', desc: 'HKG routes, Asia Miles', url: 'https://www.cathaypacific.com/cx/en_US.html' },
    { name: 'Aeroplan', desc: 'Chase UR transfer partner', url: 'https://www.aircanada.com/aeroplan' },
    { name: 'ANA Mileage Club', desc: 'Amex MR transfer partner', url: 'https://www.ana.co.jp/en/us/' }
  ];
  return links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="shortcut">
    <div class="s-name">${l.name}</div>
    <div class="s-desc">${l.desc}</div>
  </a>`).join('');
}

// ─── FILTERS ─────────────────────────────────────────
let currentFilters = {
  maxPrice: null, maxDuration: null,
  includeAlt: true, includeHKG: true, includeSZX: true, includePVG: true,
  nonstopOnly: false, oneStopAllowed: true,
  familyFriendlyOnly: false, familyBookableOnly: false,
  pointsOnly: false, cashOnly: false
};

function readFilters() {
  currentFilters.maxPrice = parseInt($('#f-max-price')?.value) || null;
  currentFilters.maxDuration = parseInt($('#f-max-dur')?.value) || null;
  currentFilters.includeAlt = $('#f-alt')?.checked ?? true;
  currentFilters.includeHKG = $('#f-hkg')?.checked ?? true;
  currentFilters.includeSZX = $('#f-szx')?.checked ?? true;
  currentFilters.includePVG = $('#f-pvg')?.checked ?? true;
  currentFilters.nonstopOnly = $('#f-nonstop')?.checked ?? false;
  currentFilters.oneStopAllowed = $('#f-1stop')?.checked ?? true;
  currentFilters.familyFriendlyOnly = $('#f-family')?.checked ?? false;
  currentFilters.familyBookableOnly = $('#f-bookable')?.checked ?? false;
  currentFilters.pointsOnly = $('#f-points')?.checked ?? false;
  currentFilters.cashOnly = $('#f-cash')?.checked ?? false;
}

function applyFilterPreset(name) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = Boolean(value);
    else el.value = value == null ? '' : value;
  };
  resetFilters(false);
  if (name === 'cheap') {
    set('f-max-price', 1300);
    set('f-family', false);
  } else if (name === 'kids') {
    set('f-family', true);
    set('f-max-dur', 24);
  } else if (name === 'risk') {
    set('f-family', true);
    set('f-bookable', true);
    set('f-max-dur', 24);
  } else if (name === 'points') {
    set('f-points', true);
    set('f-cash', false);
    set('f-bookable', true);
  }
  rerenderFilteredViews();
}

// ─── TABS ────────────────────────────────────────────
function initTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $(`#panel-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

// ─── MAIN RENDER ─────────────────────────────────────
function renderApp() {
  applyLiveFareSnapshot();
  const enriched = getEnrichedItineraries();
  // Sort: Buy > Strong > Watch > Avoid, then by adjusted cost
  const order = { 'Buy Now': 0, 'Strong': 1, 'Watch': 2, 'Avoid': 3 };
  enriched.sort((a, b) => {
    const oa = order[a.recommendation.label] ?? 2;
    const ob = order[b.recommendation.label] ?? 2;
    if (oa !== ob) return oa - ob;
    return (a.adjustedPerPerson || a.cashPricePerPerson || 9999) - (b.adjustedPerPerson || b.cashPricePerPerson || 9999);
  });

  // Status banner
  $('#status-banner').innerHTML = renderStatusBanner(enriched);

  // Summary cards
  $('#summary-cards').innerHTML = renderSummaryCards(enriched);

  // All route cards for overview
  renderTabContent(enriched);

  // Comparison table
  $('#comparison-table').innerHTML = renderComparisonTable(enriched);

  // Heatmap
  $('#heatmap-content').innerHTML = renderHeatmap();

  // Points strategy
  $('#points-strategy').innerHTML = renderPointsStrategy();

  // Mixed strategies
  $('#mixed-content').innerHTML = renderMixedStrategies();

  // Alternatives
  $('#alternatives-content').innerHTML = renderAlternatives();

  // Warnings
  $('#warnings').innerHTML = renderWarnings();

  // Shortcuts
  if ($('#shortcuts')) $('#shortcuts').innerHTML = renderShortcuts();

  // Render itineraries list tab if available
  if (typeof renderItinerariesTab === 'function') {
    renderItinerariesTab();
  }
  if (typeof renderTrustPanels === 'function') {
    renderTrustPanels(enriched);
  }
}

function renderTabContent(enriched) {
  readFilters();
  const filtered = applyFilters(enriched, currentFilters);

  // Overview — all
  const overviewTarget = $('#overview-itineraries');
  if (overviewTarget) {
    overviewTarget.innerHTML = filtered.length
      ? `<div class="route-cards">${renderRouteCards(filtered.slice(0, 5))}</div>`
      : renderEmptyState('No itineraries match these filters.', 'Try increasing max hours or allowing HKG/SZX.');
  }

  // Cash only
  const cashOnly = filtered.filter(it => it.paymentType === 'cash' || it.program === 'cash');
  $('#cash-cards').innerHTML = cashOnly.length ? renderRouteCards(cashOnly) : renderEmptyState('No cash fare options match these filters.', 'Try resetting filters or allowing alternate airports.');

  // Points only
  const pointsOnly = filtered.filter(it => it.paymentType === 'points' || (it.program && it.program !== 'cash'));
  $('#points-cards').innerHTML = pointsOnly.length ? renderRouteCards(pointsOnly) : renderEmptyState('No verified points option yet.', 'Check United and Aeroplan for 4 award seats before relying on points.');
}

function renderEmptyState(title, hint) {
  return `<div class="empty-state"><strong>${title}</strong><span>${hint || ''}</span><button class="btn-sm" onclick="resetFilters()">Reset filters</button></div>`;
}

function rerenderFilteredViews() {
  const enriched = getEnrichedItineraries();
  const order = { 'Buy Now': 0, 'Strong': 1, 'Watch': 2, 'Avoid': 3 };
  enriched.sort((a, b) => {
    const oa = order[a.recommendation.label] ?? 2;
    const ob = order[b.recommendation.label] ?? 2;
    if (oa !== ob) return oa - ob;
    return (a.adjustedPerPerson || 9999) - (b.adjustedPerPerson || 9999);
  });
  renderTabContent(enriched);
  $('#comparison-table').innerHTML = renderComparisonTable(applyFilters(enriched, currentFilters));
  if (typeof renderItinerariesTab === 'function') renderItinerariesTab();
  if (typeof renderTrustPanels === 'function') renderTrustPanels(enriched);
}

function initFilters() {
  $$('.filters-bar input').forEach(input => {
    input.addEventListener('change', rerenderFilteredViews);
    input.addEventListener('input', rerenderFilteredViews);
  });
}

function toggleFilters() {
  const panel = $('#filters-panel');
  const btnText = $('#toggle-filters-text');
  if (panel && btnText) {
    const isHidden = window.getComputedStyle(panel).display === 'none';
    panel.style.display = isHidden ? 'flex' : 'none';
    btnText.textContent = isHidden ? 'Hide Filters' : 'Show Filters';
  }
}

function applyPreset(presetType) {
  $('#f-max-price').value = '';
  $('#f-max-dur').value = '';
  $('#f-hkg').checked = true;
  $('#f-pvg').checked = true;
  $('#f-nonstop').checked = false;
  $('#f-1stop').checked = true;
  $('#f-family').checked = false;
  $('#f-bookable').checked = false;

  if (presetType === 'cheapest') {
    $('#f-max-dur').value = 48;
  } else if (presetType === 'kids') {
    $('#f-family').checked = true;
  } else if (presetType === 'points') {
    $('#f-bookable').checked = true;
  } else if (presetType === 'lowrisk') {
    $('#f-family').checked = true;
    $('#f-max-dur').value = 42;
  } else if (presetType === 'openjaw') {
    $('#f-hkg').checked = true;
    $('#f-pvg').checked = true;
  }
  renderApp();
}

function resetFilters() {
  $('#f-max-price').value = '';
  $('#f-max-dur').value = '';
  $('#f-hkg').checked = true;
  $('#f-pvg').checked = true;
  $('#f-nonstop').checked = false;
  $('#f-1stop').checked = true;
  $('#f-family').checked = false;
  $('#f-bookable').checked = false;
  renderApp();
}

// ─── BOOKING CHECKLIST MODAL ─────────────────────────
function showChecklist(itId) {
  const it = getAllItineraries().find(i => i.id === itId);
  const name = it ? `${it.origin} → ${it.destination}` : itId;
  const items = BOOKING_CHECKLIST.map(c =>
    `<label style="display:flex;gap:8px;padding:6px 0;font-size:.85rem;border-bottom:1px solid var(--border);cursor:pointer">
      <input type="checkbox" style="accent-color:var(--buy);width:18px;height:18px">
      <span>${c.label}</span>
    </label>`
  ).join('');
  const modal = document.createElement('div');
  modal.id = 'checklist-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `<div style="background:var(--card);border-radius:var(--r-lg);padding:24px;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:var(--sh-lg)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:1.05rem">✅ Booking Checklist: ${name}</h3>
      <button onclick="this.closest('#checklist-modal').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer">✕</button>
    </div>
    ${items}
    <p style="margin-top:12px;font-size:.78rem;color:var(--muted)">Complete all items before finalizing your booking.</p>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

// ─── SETTINGS MODAL ──────────────────────────────────
function showSettings() {
  const s = loadSettings();
  const modal = document.createElement('div');
  modal.id = 'settings-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `<div style="background:var(--card);border-radius:var(--r-lg);padding:24px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:var(--sh-lg)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:1.05rem">⚙️ Settings</h3>
      <button onclick="this.closest('#settings-modal').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer">✕</button>
    </div>
    <div style="display:grid;gap:10px">
      <div class="section-head" style="font-size:.9rem">Live Cash Fares API</div>
      <div class="fg" style="grid-column:1/-1"><label style="min-width:160px">Worker URL</label><input type="text" id="s-api-url" placeholder="https://flight-monitor-proxy.<you>.workers.dev" value="${(localStorage.getItem('liveApiUrl') || '').replace(/"/g, '&quot;')}" style="flex:1"></div>
      <div style="font-size:.8rem;color:var(--muted)">Leave blank to skip live fetching. See worker/README.md to deploy.</div>
      <div class="section-head" style="font-size:.9rem;margin-top:8px">Point Values (cents per point)</div>
      <div class="fg"><label>Chase UR</label><input type="number" id="s-chase" step="0.001" value="${s.pointValues.chaseUR}"></div>
      <div class="fg"><label>Amex MR</label><input type="number" id="s-amex" step="0.001" value="${s.pointValues.amexMR}"></div>
      <div class="fg"><label>United Miles</label><input type="number" id="s-united" step="0.001" value="${s.pointValues.unitedMiles}"></div>
      <div class="section-head" style="font-size:.9rem;margin-top:8px">Buy Thresholds</div>
      <div class="fg"><label>Nonstop CAN Buy</label><input type="number" id="s-buy-ns" value="${s.thresholds.buyNonstopCAN}"></div>
      <div class="fg"><label>1-stop CAN Buy</label><input type="number" id="s-buy-1s" value="${s.thresholds.buy1stopCAN}"></div>
      <div class="fg"><label>HKG min savings</label><input type="number" id="s-hkg-min" value="${s.thresholds.hkgMinSavings}"></div>
      <div class="fg"><label>PVG min savings</label><input type="number" id="s-pvg-min" value="${s.thresholds.pvgMinSavings}"></div>
      <div class="fg"><label>Max duration (h)</label><input type="number" id="s-max-dur" value="${s.thresholds.maxDuration}"></div>
      <div class="fg"><label>Required award seats</label><input type="number" id="s-seats" value="${s.thresholds.requiredAwardSeats}"></div>
      <div class="section-head" style="font-size:.9rem;margin-top:8px">Adjustments ($)</div>
      <div class="fg"><label>HKG</label><input type="number" id="s-adj-hkg" value="${s.adjustments.HKG}"></div>
      <div class="fg"><label>SZX</label><input type="number" id="s-adj-szx" value="${s.adjustments.SZX}"></div>
      <div class="fg"><label>PVG/SHA</label><input type="number" id="s-adj-pvg" value="${s.adjustments.PVG}"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn-sm primary" onclick="applySettings()">Save & Reload</button>
      <button class="btn-sm" onclick="this.closest('#settings-modal').remove()">Cancel</button>
      <button class="btn-sm" onclick="resetSettings()" style="margin-left:auto;color:var(--avoid)">Reset Defaults</button>
    </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function applySettings() {
  const s = loadSettings();
  s.pointValues.chaseUR = parseFloat($('#s-chase').value) || 0.015;
  s.pointValues.amexMR = parseFloat($('#s-amex').value) || 0.013;
  s.pointValues.unitedMiles = parseFloat($('#s-united').value) || 0.012;
  s.thresholds.buyNonstopCAN = parseInt($('#s-buy-ns').value) || 1500;
  s.thresholds.buy1stopCAN = parseInt($('#s-buy-1s').value) || 1250;
  s.thresholds.hkgMinSavings = parseInt($('#s-hkg-min').value) || 150;
  s.thresholds.pvgMinSavings = parseInt($('#s-pvg-min').value) || 300;
  s.thresholds.maxDuration = parseInt($('#s-max-dur').value) || 32;
  s.thresholds.requiredAwardSeats = parseInt($('#s-seats').value) || 4;
  s.adjustments.HKG = parseInt($('#s-adj-hkg').value) || 200;
  s.adjustments.SZX = parseInt($('#s-adj-szx').value) || 150;
  s.adjustments.PVG = parseInt($('#s-adj-pvg').value) || 400;
  s.adjustments.SHA = s.adjustments.PVG;
  const apiUrl = ($('#s-api-url')?.value || '').trim().replace(/\/$/, '');
  if (apiUrl) localStorage.setItem('liveApiUrl', apiUrl); else localStorage.removeItem('liveApiUrl');
  saveSettings(s);
  // Apply to runtime
  pointValues.chaseUR = s.pointValues.chaseUR;
  pointValues.amexMR = s.pointValues.amexMR;
  pointValues.unitedMiles = s.pointValues.unitedMiles;
  ADJUSTMENTS.HKG = s.adjustments.HKG;
  ADJUSTMENTS.SZX = s.adjustments.SZX;
  ADJUSTMENTS.PVG = s.adjustments.PVG;
  ADJUSTMENTS.SHA = s.adjustments.SHA;
  $('#settings-modal')?.remove();
  renderApp();
}

function resetSettings() {
  localStorage.removeItem('flightSettings');
  $('#settings-modal')?.remove();
  location.reload();
}

// ─── DATA MANAGEMENT ─────────────────────────────────
function showDataPanel() {
  const modal = document.createElement('div');
  modal.id = 'data-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `<div style="background:var(--card);border-radius:var(--r-lg);padding:24px;max-width:600px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:var(--sh-lg)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:1.05rem">📊 Data Management</h3>
      <button onclick="this.closest('#data-modal').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer">✕</button>
    </div>
    <div style="margin-bottom:12px">
      <button class="btn-sm primary" onclick="doExport()">Export JSON</button>
      <button class="btn-sm" onclick="document.getElementById('import-file').click()">Import JSON</button>
      <input type="file" id="import-file" accept=".json" style="display:none" onchange="doImport(event)">
    </div>
    <div style="margin-bottom:12px">
      <div class="section-head" style="font-size:.85rem">Custom itineraries (${getCustomItineraries().length})</div>
      <p style="font-size:.78rem;color:var(--muted)">Custom itineraries are saved in your browser's localStorage.</p>
    </div>
    <div style="margin-bottom:12px">
      <div class="section-head" style="font-size:.85rem">Alert Rules (copy for price alerts)</div>
      <div style="display:grid;gap:4px">${ALERT_RULES.map(r => `<div style="font-size:.8rem;padding:6px 10px;background:var(--bg);border-radius:6px;border:1px solid var(--border);cursor:pointer" onclick="navigator.clipboard.writeText('${r.condition}');this.style.borderColor='var(--buy)';setTimeout(()=>this.style.borderColor='',1000)" title="Click to copy">📋 ${r.label}</div>`).join('')}</div>
    </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function doExport() {
  const json = exportData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'flight-monitor-data.json'; a.click();
  URL.revokeObjectURL(url);
}

function doImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    if (importData(e.target.result)) {
      alert('Data imported successfully!');
      location.reload();
    } else {
      alert('Import failed — check JSON format.');
    }
  };
  reader.readAsText(file);
}

async function fetchLiveCashFares(apiUrl) {
  const apiBase = normalizeApiBase(apiUrl);
  const queries = buildLiveFareQueries();
  if (!queries.length) return [];

  const applyResult = (result) => {
    if (!result || !result.ok || !result.cheapest) return result;
    const newPrice = Math.round(result.cheapest.perPerson);
    const it = itineraries.find(item => item.id === result.id);
    if (it) {
      it.cashPricePerPerson = newPrice;
      it.liveUpdatedAt = result.fetchedAt;
      it.liveSource = result.cacheStatus === 'HIT' ? 'Live API cache' : 'Live API';
      it.liveCacheStatus = result.cacheStatus || '';
    }
    return { id: result.id, ok: true, price: newPrice, cacheStatus: result.cacheStatus, fetchedAt: result.fetchedAt };
  };

  let results = [];
  try {
    const r = await fetch(`${apiBase}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
    });
    if (r.ok) {
      const j = await r.json();
      if (j.ok && Array.isArray(j.results)) {
        results = j.results.map(result => {
          if (result.ok && result.cheapest) return applyResult(result);
          return { id: result.id, ok: false, reason: result.error || 'no offers' };
        });
      }
    }
  } catch (e) {
    console.warn('Batch live fare fetch failed, falling back to individual requests:', e);
  }

  if (!results.length) {
    results = await mapWithConcurrency(queries, 4, async (query) => {
      const url = `${apiBase}/flights?origin=${encodeURIComponent(query.origin)}&destination=${encodeURIComponent(query.destination)}&departureDate=${encodeURIComponent(query.departureDate)}&returnDate=${encodeURIComponent(query.returnDate)}&adults=${encodeURIComponent(query.adults)}&children=${encodeURIComponent(query.children)}&cacheTtl=900`;
      try {
        const r = await fetch(url);
        const j = await r.json();
        if (j.ok && j.cheapest) return applyResult({ ...j, id: query.id });
        return { id: query.id, ok: false, reason: j.error || 'no offers' };
      } catch (e) {
        return { id: query.id, ok: false, reason: String(e.message || e) };
      }
    });
  }

  saveLiveFareSnapshot({
    fetchedAt: new Date().toISOString(),
    apiUrl: apiBase,
    results: results.filter(result => result && result.ok),
    failures: results.filter(result => !result || !result.ok),
  });
  return results;
}

async function refreshData() {
  const apiUrl = normalizeApiBase(localStorage.getItem('liveApiUrl'));
  if (!apiUrl) {
    renderApp();
    setLiveRefreshStatus('No Worker URL configured. Open Settings to enable live fare refresh.', 'warn');
    return;
  }

  const total = buildLiveFareQueries().length;
  setLiveRefreshStatus(`Fetching live fares for ${total} cash route${total === 1 ? '' : 's'}...`, 'info');

  const results = await fetchLiveCashFares(apiUrl);
  const ok = results.filter(r => r.ok).length;
  const fail = results.length - ok;
  const cached = results.filter(r => r.ok && r.cacheStatus === 'HIT').length;
  const stamp = new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  renderApp();
  setLiveRefreshStatus(
    `Updated ${ok}/${results.length} live fare${results.length === 1 ? '' : 's'}${cached ? ` (${cached} from cache)` : ''}${fail ? `; ${fail} failed` : ''}. Last checked ${stamp}.`,
    fail && !ok ? 'err' : fail ? 'warn' : 'ok'
  );
  if (fail) console.warn('Live fetch failures:', results.filter(r => !r.ok));
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFilters();
  applyLiveFareSnapshot();
  renderApp();
  const snapshot = getLiveFareSnapshot();
  if (snapshot?.fetchedAt) {
    const stamp = new Date(snapshot.fetchedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    setLiveRefreshStatus(`Loaded saved live fare snapshot from ${stamp}. Recheck before booking.`, 'info');
  }
});
