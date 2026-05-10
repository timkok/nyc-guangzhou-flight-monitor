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
  const best = getBestOverallOption(enriched);
  const cash = getBestCashFor4(enriched);
  const pts = getBestPointsFor4(enriched);
  const backup = getBestBackupRoute(enriched);
  const cards = [
    { data: best, label: 'Best Overall', stripe: 'blue', featured: true, type: 'cash' },
    { data: cash, label: 'Best Cash for 4', stripe: 'green', type: 'cash' },
    { data: pts, label: 'Best Points for 4', stripe: 'purple', type: 'points' },
    { data: backup, label: 'Best Backup Route', stripe: 'amber', type: 'cash' }
  ];
  return cards.map(c => {
    if (!c.data) return '';
    const it = c.data;
    const price = c.type === 'points' && it.pointsPerPerson
      ? fmtK(it.pointsPerPerson * passengerConfig.total) + ' pts'
      : fmt(it.cashTotal);
    const sub = c.type === 'points' && it.cpp
      ? `${it.cpp.toFixed(1)} cpp · ${it.availability.label}`
      : `Adjusted: ${fmt(it.adjustedTotal)} for 4`;
    const bc = badgeClass(it.recommendation.label);
    const actionCls = bc === 'buy' ? 'green' : bc === 'strong' ? 'blue' : 'amber';
    return `<div class="s-card${c.featured ? ' featured' : ''}">
      <div class="s-card-stripe ${c.stripe}"></div>
      <div class="s-card-label">${c.label}</div>
      <div class="s-card-route">${it.origin} → ${it.destination}</div>
      <div style="margin-bottom:4px">${recToBadge(it.recommendation)} ${programBadge(it.program)}</div>
      <div class="s-card-price">${price}</div>
      <div class="s-card-meta">${sub}</div>
      <div class="s-card-meta">${it.airline} · ${it.totalDurationHours}h · ${it.stops === 0 ? 'Nonstop' : it.stops + '-stop'}</div>
      <div class="s-card-reason">${it.recommendation.reason}</div>
    </div>`;
  }).join('');
}

// ─── ROUTE CARDS ─────────────────────────────────────
function renderRouteCard(it) {
  const rc = badgeClass(it.recommendation.label);
  const rcClass = `rec-${rc === 'buy' ? 'buy' : rc === 'strong' ? 'strong' : rc === 'avoid' ? 'avoid' : 'watch'}`;

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

  return `<div class="route-card ${rcClass}" id="${it.id}">
    <div class="rc-header">
      <div class="rc-route">${it.origin} → ${it.destination} <span style="font-weight:400;color:var(--muted);font-size:.85rem">${it.airline}</span></div>
      <div class="rc-tags">${recToBadge(it.recommendation)} ${programBadge(it.program)} ${it.availability ? availBadge(it.availability) : ''}</div>
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
    <div class="rc-footer">
      <div class="rc-reason">💡 ${it.notes}</div>
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

document.addEventListener('DOMContentLoaded', renderApp);
