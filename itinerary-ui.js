/* Itinerary-level card rendering with collapsed/expanded views */

function renderSegmentTimeline(seg, isLast) {
  const layover = !isLast && seg.layoverAfterMinutes > 0
    ? (() => { const q = getLayoverQuality(seg.layoverAfterMinutes); return `<div class="layover-chip badge badge-${q.cls}">${q.icon} Layover in ${seg.destination} · ${fmtDur(seg.layoverAfterMinutes)} · ${q.label}</div>`; })()
    : '';
  return `<div class="seg-row">
    <div class="seg-times">
      <span class="seg-time">${fmtTime(seg.departureTime)}</span>
      <span class="seg-arrow">→</span>
      <span class="seg-time">${fmtTime(seg.arrivalTime)}</span>
    </div>
    <div class="seg-info">
      <strong>${seg.origin}→${seg.destination}</strong>
      <span class="seg-flight">${seg.flightNumber} · ${seg.marketingAirline}</span>
      <span class="seg-meta">${fmtDur(seg.durationMinutes)} · ${seg.aircraft} · ${seg.cabin}</span>
    </div>
  </div>${layover}`;
}

function renderFlightTimeline(segments, label) {
  if (!segments || segments.length === 0) return '';
  const segs = segments.map((s, i) => renderSegmentTimeline(s, i === segments.length - 1)).join('');
  return `<div class="timeline-block"><div class="timeline-label">${label}</div>${segs}</div>`;
}

function renderItineraryLinks(it) {
  const links = it.links || {};
  const btns = [];
  if (links.googleFlights) btns.push(`<a href="${links.googleFlights}" target="_blank" class="btn-sm">🔍 Google Flights</a>`);
  if (links.airlineDirect) btns.push(`<a href="${links.airlineDirect}" target="_blank" class="btn-sm">✈️ ${it.airline}</a>`);
  if (links.united) btns.push(`<a href="${links.united}" target="_blank" class="btn-sm">🇺🇸 United</a>`);
  if (links.chase) btns.push(`<a href="${links.chase}" target="_blank" class="btn-sm">💳 Chase</a>`);
  if (links.amex) btns.push(`<a href="${links.amex}" target="_blank" class="btn-sm">💎 Amex</a>`);
  if (links.aeroplan) btns.push(`<a href="${links.aeroplan}" target="_blank" class="btn-sm">🍁 Aeroplan</a>`);
  if (links.cathayAsiaMiles) btns.push(`<a href="${links.cathayAsiaMiles}" target="_blank" class="btn-sm">🐉 Asia Miles</a>`);
  if (btns.length === 0) btns.push(`<span class="btn-sm" onclick="navigator.clipboard.writeText('${it.origin} to ${it.destination} ${it.outboundDate}');this.textContent='Copied!'" style="cursor:pointer">📋 Copy search</span>`);
  return btns.join('');
}

function renderSourceBadge(it) {
  const sc = getSourceConfidence(it);
  return `${sc.icon} <span class="badge badge-${sc.cls}">${sc.label}</span> <span style="font-size:.75rem;color:var(--muted)">${sc.detail}</span>`;
}

function renderCompletenessBadge(it) {
  const cs = getCompletenessScore(it);
  return `<span class="badge badge-${cs.complete?'buy':'watch'}">${cs.pct}% ${cs.label}</span>`;
}

function renderTransferBlock(it) {
  const dest = it.destination?.split('→')[0]?.trim();
  const plan = getTransferPlan(dest);
  if (!plan || dest === 'CAN') return '';
  return `<div style="margin-top:10px;padding:10px 14px;background:#fffbeb;border:1px solid #fbbf24;border-radius:var(--r-sm)">
    <div style="font-size:.82rem;font-weight:600;margin-bottom:4px">🚄 Transfer to Guangzhou from ${dest}</div>
    <div style="font-size:.8rem;display:grid;gap:3px">
      <div><strong>Method:</strong> ${plan.method}</div>
      <div><strong>Duration:</strong> ${plan.duration}</div>
      <div><strong>Family cost:</strong> ${plan.totalEstimate}</div>
      <div><strong>Overnight:</strong> ${plan.overnight}</div>
      <div style="color:var(--muted);font-size:.75rem">💡 ${plan.tips}</div>
    </div>
  </div>`;
}

function renderSurfaceBlock(it) {
  const seg = getSurfaceSegment(it);
  if (!seg) return '';
  return `<div style="margin-top:10px;padding:10px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:var(--r-sm)">
    <div style="font-size:.82rem;font-weight:600;margin-bottom:4px">🚌 Surface Segment: ${seg.from} → ${seg.to}</div>
    <div style="font-size:.8rem;display:grid;gap:3px">
      <div><strong>Method:</strong> ${seg.method}</div>
      <div><strong>Duration:</strong> ${seg.duration}</div>
      <div><strong>Cost:</strong> ${seg.cost}</div>
      <div style="color:var(--muted);font-size:.75rem">${seg.note}</div>
    </div>
  </div>`;
}

function renderItineraryCard(it) {
  const recCls = {Strong:'strong',Watch:'watch',Avoid:'avoid','Buy Now':'buy'}[it.recommendation] || 'watch';
  const isPoints = it.paymentType === 'points';
  const priceDisplay = isPoints
    ? `${(it.pointsPerPerson/1000).toFixed(0)}k pts/pp`
    : `$${it.cashPricePerPerson?.toLocaleString()}/pp`;
  const adjTotal = it.adjustedTotalForFamily ? `$${it.adjustedTotalForFamily.toLocaleString()}` : '—';
  const totalDisplay = isPoints
    ? `${(it.totalPointsForFamily/1000).toFixed(0)}k pts + $${(it.taxesPerPerson*4).toLocaleString()} tax`
    : `$${it.totalCashForFamily?.toLocaleString()} for 4`;
  const durOut = fmtDur(it.totalDurationMinutesOutbound);
  const durRet = fmtDur(it.totalDurationMinutesReturn);
  const risks = (it.riskChips||[]).map(r => `<span class="badge badge-watch">${r}</span>`).join(' ');
  const riskBadge = `<span class="badge badge-${it.riskLevel==='High'?'avoid':it.riskLevel==='Medium'?'watch':'buy'}">${it.riskLevel} Risk</span>`;
  const ticketBadge = it.sameTicket ? '<span class="badge badge-buy">Same ticket</span>' : '<span class="badge badge-watch">Separate tickets</span>';
  const cppBadge = it.cpp ? `<span class="badge badge-${it.cpp>=1.5?'buy':'watch'}">${it.cpp.toFixed(1)} cpp</span>` : '';
  const awardBadge = it.awardSeatsAvailable != null ? `<span class="badge badge-${it.familyBookable?'buy':'avoid'}">${it.awardSeatsAvailable}/4 seats</span>` : '';
  const payBadge = isPoints ? `<span class="badge badge-points">${it.pointsProgram}</span>` : '<span class="badge badge-cash">Cash</span>';

  const getFlightNumbersSummary = (it) => {
    const out = (it.outboundSegments || []).map(s => s.flightNumber).filter(Boolean).join('/');
    const ret = (it.returnSegments || []).map(s => s.flightNumber).filter(Boolean).join('/');
    if (!out && !ret) return 'Flight numbers TBD';
    return `${out} | ${ret}`;
  };

  return `<div class="route-card rec-${recCls}" id="itin-${it.id}">
    <div class="rc-header" style="cursor:pointer" onclick="toggleExpand('${it.id}')">
      <div>
        <div class="rc-route">${it.title}</div>
        <div style="font-size:.8rem;color:var(--muted)">${it.airline} (${getFlightNumbersSummary(it)}) · ${it.outboundDate} → ${it.returnDate}</div>
      </div>
      <div class="rc-tags">
        <span class="badge badge-${recCls}">${it.recommendation}</span>
        ${payBadge} ${awardBadge} ${cppBadge}
        <span class="expand-icon" id="expand-${it.id}">▼</span>
      </div>
    </div>
    <div class="metrics">
      <div class="metric"><div class="metric-label">Price</div><div class="metric-value">${priceDisplay}</div></div>
      <div class="metric"><div class="metric-label">Total for 4</div><div class="metric-value">${totalDisplay}</div></div>
      <div class="metric"><div class="metric-label">Adjusted Total</div><div class="metric-value">${adjTotal}</div></div>
      <div class="metric"><div class="metric-label">Outbound</div><div class="metric-value">${durOut} · ${it.stopsOutbound===0?'Nonstop':it.stopsOutbound+'-stop'}</div></div>
      <div class="metric"><div class="metric-label">Return</div><div class="metric-value">${durRet} · ${it.stopsReturn===0?'Nonstop':it.stopsReturn+'-stop'}</div></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0">${riskBadge} ${ticketBadge} ${risks}</div>
    <div class="rc-actions" style="flex-wrap:wrap;margin:8px 0">${renderItineraryLinks(it)}</div>
    <div class="itin-expanded" id="detail-${it.id}" style="display:none">
      ${renderFlightTimeline(it.outboundSegments, '✈️ Outbound')}
      ${renderFlightTimeline(it.returnSegments, '🔄 Return')}
      ${renderSurfaceBlock(it)}
      ${renderTransferBlock(it)}
      <div class="rc-details" style="margin-top:12px">
        <div class="rc-detail"><strong>Baggage:</strong> ${it.baggageIncluded||'—'}</div>
        <div class="rc-detail"><strong>Change:</strong> ${it.changePolicy||'—'}</div>
        <div class="rc-detail"><strong>Cancel:</strong> ${it.cancellationPolicy||'—'}</div>
        <div class="rc-detail"><strong>Source:</strong> ${renderSourceBadge(it)}</div>
        <div class="rc-detail"><strong>Data:</strong> ${renderCompletenessBadge(it)}</div>
      </div>
      <div style="margin-top:10px;padding:10px 14px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
        <div style="font-size:.82rem;font-weight:600;margin-bottom:4px">💬 Verdict</div>
        <div style="font-size:.85rem;color:var(--text)">${generateVerdict(it)}</div>
      </div>
      <div style="margin-top:10px;padding:10px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:.78rem;font-weight:600;color:var(--muted)">📋 Manual Search Task</span>
          <button class="btn-sm" onclick="navigator.clipboard.writeText(\`${generateSearchTask(it).replace(/`/g, '\\`')}\`);this.textContent='✓ Copied!';setTimeout(()=>this.textContent='📋 Copy',1500)">📋 Copy</button>
        </div>
        <pre style="font-size:.75rem;white-space:pre-wrap;margin:0">${generateSearchTask(it)}</pre>
      </div>
      <details style="margin-top:8px">
        <summary style="font-size:.78rem;color:var(--muted);cursor:pointer">✅ Booking safety checklist</summary>
        <div style="margin-top:6px;font-size:.8rem;color:var(--muted)">
          <div>☐ Verify final price on airline site for all 4 passengers</div>
          <div>☐ Confirm checked baggage included</div>
          <div>☐ Confirm seat selection available</div>
          <div>☐ Review change/cancel rules</div>
          <div>☐ Avoid unknown OTAs for family international trips</div>
          <div>☐ Screenshot the fare before booking</div>
        </div>
      </details>
    </div>
  </div>`;
}

function toggleExpand(id) {
  const el = document.getElementById('detail-' + id);
  const icon = document.getElementById('expand-' + id);
  if (el) {
    const showing = el.style.display !== 'none';
    el.style.display = showing ? 'none' : 'block';
    if (icon) icon.textContent = showing ? '▼' : '▲';
  }
}

function renderAllItineraryCards(list) {
  return list.map(renderItineraryCard).join('');
}

function renderGroupedItineraries(list) {
  const groups = {};
  list.forEach(it => {
    const g = it.routeFamily || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(it);
  });
  return Object.entries(groups).map(([name, items]) => {
    const top3 = items.slice(0, 3);
    const more = items.length > 3 ? `<p style="font-size:.78rem;color:var(--muted);margin-top:8px">+${items.length-3} more in this group</p>` : '';
    return `<div class="section" style="margin-bottom:20px">
      <div class="section-head"><span class="icon">📂</span> ${name} (${items.length})</div>
      <div class="route-cards">${renderAllItineraryCards(top3)}</div>${more}
    </div>`;
  }).join('');
}

// Sorting
function sortItineraries(list, sortBy) {
  const copy = [...list];
  switch(sortBy) {
    case 'price': return copy.sort((a,b) => (a.totalCashForFamily||99999) - (b.totalCashForFamily||99999));
    case 'duration': return copy.sort((a,b) => a.totalDurationMinutesOutbound - b.totalDurationMinutesOutbound);
    case 'cpp': return copy.sort((a,b) => (b.cpp||0) - (a.cpp||0));
    case 'risk': return copy.sort((a,b) => {const w={Low:0,Medium:1,High:2}; return (w[a.riskLevel]||1)-(w[b.riskLevel]||1);});
    default: {
      const order = {'Buy Now':0,'Strong':1,'Watch':2,'Avoid':3};
      return copy.sort((a,b) => (order[a.recommendation]||2) - (order[b.recommendation]||2));
    }
  }
}

// Render the itineraries tab
function renderItinerariesTab() {
  const sort = document.getElementById('itin-sort')?.value || 'best';
  const sorted = sortItineraries(ITINERARIES, sort);
  const grouped = document.getElementById('itin-group')?.checked;
  const container = document.getElementById('itineraries-list');
  if (!container) return;
  container.innerHTML = grouped ? renderGroupedItineraries(sorted) : `<div class="route-cards">${renderAllItineraryCards(sorted)}</div>`;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderItinerariesTab();
  document.getElementById('itin-sort')?.addEventListener('change', renderItinerariesTab);
  document.getElementById('itin-group')?.addEventListener('change', renderItinerariesTab);
});
