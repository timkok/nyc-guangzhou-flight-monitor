/* ═══════════════════════════════════════════════════════
   UI LAYER — Rendering functions
   ═══════════════════════════════════════════════════════ */

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

// ─── HELPERS ─────────────────────────────────────────
function fmt(n) { return n == null ? '—' : '$' + n.toLocaleString(); }
function fmtK(n) { return n == null ? '—' : (n / 1000).toFixed(0) + 'k'; }
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
  const icons = { buy: '✅', compare: '🔍', watch: '⏳', avoid: '⛔' };
  return `<div class="status-banner ${s.status}">
    <div class="status-icon">${icons[s.status]}</div>
    <div><div class="status-label">Current recommendation: ${s.label}</div>
    <div class="status-text">${s.text}</div></div>
  </div>`;
}

// ─── SUMMARY CARDS ───────────────────────────────────
function renderSummaryCards(enriched) {
  // Use ITINERARIES instead of enriched to ensure concrete options
  const best = typeof ITINERARIES !== 'undefined' ? ITINERARIES.find(it => it.id === 'jfk-can-cz328') || ITINERARIES[0] : null;
  const cash = typeof ITINERARIES !== 'undefined' ? ITINERARIES.find(it => it.id === 'ewr-can-tk-ist') || ITINERARIES[1] : null;
  const pts = typeof ITINERARIES !== 'undefined' ? ITINERARIES.find(it => it.id === 'ewr-hkg-ua-award') || ITINERARIES[6] : null;
  const backup = typeof ITINERARIES !== 'undefined' ? ITINERARIES.find(it => it.id === 'jfk-pvg-mu-nonstop') || ITINERARIES[4] : null;

  const cards = [
    { data: best, label: 'Best Overall', stripe: 'blue', featured: true },
    { data: cash, label: 'Best Cash for 4', stripe: 'green' },
    { data: pts, label: 'Best Points for 4', stripe: 'purple' },
    { data: backup, label: 'Best Backup Route', stripe: 'amber' }
  ];

  return cards.map(c => {
    if (!c.data) return '';
    const it = c.data;
    const price = it.paymentType === 'points'
      ? (it.totalPointsForFamily / 1000).toFixed(0) + 'k pts'
      : '$' + it.totalCashForFamily;
    const sub = it.paymentType === 'points'
      ? `${it.cpp?.toFixed(1)} cpp · ${it.awardSeatsAvailable} seats`
      : `Adjusted: $${it.adjustedTotalForFamily} for 4`;
    
    const airline = it.airline || 'Various';
    const duration = it.totalDurationMinutesOutbound ? Math.round(it.totalDurationMinutesOutbound/60) + 'h' : '—';
    const stops = it.stopsOutbound === 0 ? 'Nonstop' : it.stopsOutbound + '-stop';

    const bc = it.recommendation.toLowerCase();
    const actionCls = bc === 'buy now' ? 'buy' : bc === 'strong' ? 'strong' : bc === 'avoid' ? 'avoid' : 'watch';

    return `<div class="s-card${c.featured ? ' featured' : ''}" style="cursor:pointer" onclick="const btn = document.querySelector('[data-tab=\\'flights\\']'); if(btn) btn.click(); const el = document.getElementById('itin-${it.id}'); if(el) el.scrollIntoView({behavior:'smooth'});">
      <div class="s-card-stripe ${c.stripe}"></div>
      <div class="s-card-label">${c.label}</div>
      <div class="s-card-route">${it.origin} → ${it.destination}</div>
      <div style="margin-bottom:4px"><span class="badge badge-${actionCls}">${it.recommendation}</span></div>
      <div class="s-card-price">${price}</div>
      <div class="s-card-meta">${sub}</div>
      <div class="s-card-meta">${airline} · ${duration} · ${stops}</div>
      <div class="s-card-reason">${it.recommendationReason || ''}</div>
    </div>`;
  }).join('');
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
  const decisionScore = getFamilyDecisionScore(it);

  let priceMetrics = '';
  if (it.cashPricePerPerson != null) {
    priceMetrics = `
      <div class="metric"><div class="metric-label">Price / person</div><div class="metric-value">${fmt(it.cashPricePerPerson)}</div></div>
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
      <div class="rc-detail"><strong>Duration:</strong> ${it.totalDurationHours}h</div>
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
function renderComparisonTable(enriched) {
  const rows = enriched.map(it => {
    const price = it.cashPricePerPerson != null ? fmt(it.cashPricePerPerson) : '—';
    const total4 = it.cashTotal != null ? fmt(it.cashTotal) : '—';
    const adj = it.adjustedTotal != null ? fmt(it.adjustedTotal) : '—';
    const pts = it.pointsPerPerson != null ? fmtK(it.pointsPerPerson * passengerConfig.total) : '—';
    const cpp = it.cpp != null ? `${it.cpp.toFixed(1)}` : '—';
    const cppCls = it.cppRating ? `badge-${it.cppRating.class}` : '';
    return `<tr>
      <td><strong>${it.origin}→${it.destination}</strong><br><span style="font-size:.7rem;color:var(--light)">${it.airline}</span></td>
      <td>${it.routeType}</td>
      <td class="text-right mono">${price}</td>
      <td class="text-right mono">${total4}</td>
      <td class="text-right mono">${adj}</td>
      <td class="text-center">${programBadge(it.program)}</td>
      <td class="text-right mono">${pts}</td>
      <td class="text-center">${cpp !== '—' ? `<span class="badge ${cppCls}">${cpp}</span>` : '—'}</td>
      <td class="text-center">${familyBadge(it.familyScore)}</td>
      <td class="text-center">${recToBadge(it.recommendation)}</td>
    </tr>`;
  }).join('');

  return `<div class="table-wrap"><table>
    <thead><tr>
      <th>Route</th><th>Type</th><th class="text-right">$/pp</th><th class="text-right">Total×4</th>
      <th class="text-right">Adj Total</th><th class="text-center">Program</th><th class="text-right">Points</th>
      <th class="text-center">CPP</th><th class="text-center">Family</th><th class="text-center">Rec</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ─── HEATMAP ─────────────────────────────────────────
function renderHeatmap() {
  const hdrCells = heatmapReturnDates.map(d => `<th>${d}</th>`).join('');
  const rows = heatmapOutboundDates.map((outDate, i) => {
    const cells = heatmapReturnDates.map((_, j) => {
      const cell = heatmapData[i][j];
      const cls = { buy: 'hm-buy', strong: 'hm-strong', watch: 'hm-watch', avoid: 'hm-avoid', alt: 'hm-alt' }[cell.rec] || '';
      return `<td class="${cls}" title="${outDate} → ${heatmapReturnDates[j]}: $${cell.price} (${cell.routeType})">$${cell.price}<span class="hm-sub">${cell.routeType}</span></td>`;
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
      { k: 'Rule', v: 'If savings < $300, avoid for this trip' }
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
  includeHKG: true, includePVG: true,
  nonstopOnly: false, oneStopAllowed: true,
  familyFriendlyOnly: false, familyBookableOnly: false
};

function readFilters() {
  currentFilters.maxPrice = parseInt($('#f-max-price')?.value) || null;
  currentFilters.maxDuration = parseInt($('#f-max-dur')?.value) || null;
  currentFilters.includeHKG = $('#f-hkg')?.checked ?? true;
  currentFilters.includePVG = $('#f-pvg')?.checked ?? true;
  currentFilters.nonstopOnly = $('#f-nonstop')?.checked ?? false;
  currentFilters.oneStopAllowed = $('#f-1stop')?.checked ?? true;
  currentFilters.familyFriendlyOnly = $('#f-family')?.checked ?? false;
  currentFilters.familyBookableOnly = $('#f-bookable')?.checked ?? false;
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
  $('#shortcuts').innerHTML = renderShortcuts();

  initTabs();
  initFilters();
}

function renderTabContent(enriched) {
  readFilters();
  const filtered = applyFilters(enriched, currentFilters);

  // Overview — all
  $('#overview-cards').innerHTML = renderRouteCards(filtered);

  // Cash only
  const cashOnly = filtered.filter(it => it.program === 'cash');
  $('#cash-cards').innerHTML = cashOnly.length ? renderRouteCards(cashOnly) : '<p style="color:var(--muted)">No cash routes match your filters.</p>';

  // Points only
  const pointsOnly = filtered.filter(it => it.program !== 'cash');
  $('#points-cards').innerHTML = pointsOnly.length ? renderRouteCards(pointsOnly) : '<p style="color:var(--muted)">No points routes match your filters.</p>';
}

function initFilters() {
  $$('.filters-bar input').forEach(input => {
    input.addEventListener('change', () => {
      const enriched = getEnrichedItineraries();
      const order = { 'Buy Now': 0, 'Strong': 1, 'Watch': 2, 'Avoid': 3 };
      enriched.sort((a, b) => {
        const oa = order[a.recommendation.label] ?? 2;
        const ob = order[b.recommendation.label] ?? 2;
        if (oa !== ob) return oa - ob;
        return (a.adjustedPerPerson || 9999) - (b.adjustedPerPerson || 9999);
      });
      renderTabContent(enriched);
      $('#comparison-table').innerHTML = renderComparisonTable(
        applyFilters(enriched, currentFilters)
      );
    });
  });
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
  const cashItins = itineraries.filter(it => it.program === 'cash' && it.outboundDate && it.returnDate);
  const results = [];
  for (const it of cashItins) {
    const url = `${apiUrl}/flights?origin=${it.origin}&destination=${it.destination}&departureDate=${it.outboundDate}&returnDate=${it.returnDate}&adults=${passengerConfig.adults}&children=${passengerConfig.children}`;
    try {
      const r = await fetch(url);
      const j = await r.json();
      if (j.ok && j.cheapest) {
        const newPrice = Math.round(j.cheapest.perPerson);
        it.cashPricePerPerson = newPrice;
        it.liveUpdatedAt = j.fetchedAt;
        results.push({ id: it.id, ok: true, price: newPrice });
      } else {
        results.push({ id: it.id, ok: false, reason: j.error || 'no offers' });
      }
    } catch (e) {
      results.push({ id: it.id, ok: false, reason: String(e.message || e) });
    }
  }
  return results;
}

async function refreshData() {
  const chip = document.getElementById('update-chip');
  const apiUrl = localStorage.getItem('liveApiUrl');
  if (chip) {
    chip.textContent = apiUrl ? '⏳ Fetching live fares…' : '⏳ Refreshing…';
    chip.style.pointerEvents = 'none';
  }
  let summary = '';
  if (apiUrl) {
    const results = await fetchLiveCashFares(apiUrl);
    const ok = results.filter(r => r.ok).length;
    const fail = results.length - ok;
    summary = ` · ${ok}/${results.length} live${fail ? ` (${fail} failed)` : ''}`;
    if (fail) console.warn('Live fetch failures:', results.filter(r => !r.ok));
  }
  renderApp();
  if (chip) {
    const now = new Date();
    const stamp = now.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    chip.textContent = `🔄 ${apiUrl ? 'Live' : 'Refreshed'} ${stamp}${summary}`;
    chip.style.pointerEvents = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  const chip = document.getElementById('update-chip');
  if (chip) {
    const now = new Date();
    const stamp = now.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    chip.textContent = `🔄 Loaded ${stamp}`;
  }
});
