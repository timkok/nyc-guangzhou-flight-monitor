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

function renderItineraryCard(it) {
  const recCls = {Strong:'strong',Watch:'watch',Avoid:'avoid','Buy Now':'buy'}[it.recommendation] || 'watch';
  const isPoints = it.paymentType === 'points';
  const priceDisplay = isPoints
    ? `${(it.pointsPerPerson/1000).toFixed(0)}k pts/pp`
    : `$${it.cashPricePerPerson?.toLocaleString()}/pp`;
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

  return `<div class="route-card rec-${recCls}" id="${it.id}">
    <div class="rc-header" style="cursor:pointer" onclick="toggleExpand('${it.id}')">
      <div>
        <div class="rc-route">${it.title}</div>
        <div style="font-size:.8rem;color:var(--muted)">${it.airline} · ${it.alliance || ''} · ${it.outboundDate} → ${it.returnDate}</div>
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
      <div class="metric"><div class="metric-label">Outbound</div><div class="metric-value">${durOut} · ${it.stopsOutbound===0?'Nonstop':it.stopsOutbound+'-stop'}</div></div>
      <div class="metric"><div class="metric-label">Return</div><div class="metric-value">${durRet} · ${it.stopsReturn===0?'Nonstop':it.stopsReturn+'-stop'}</div></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0">${riskBadge} ${ticketBadge} ${risks}</div>
    <div class="rc-actions" style="flex-wrap:wrap;margin:8px 0">${renderItineraryLinks(it)}</div>
    <div class="itin-expanded" id="detail-${it.id}" style="display:none">
      ${renderFlightTimeline(it.outboundSegments, '✈️ Outbound')}
      ${renderFlightTimeline(it.returnSegments, '🔄 Return')}
      <div class="rc-details" style="margin-top:12px">
        <div class="rc-detail"><strong>Baggage:</strong> ${it.baggageIncluded||'—'}</div>
        <div class="rc-detail"><strong>Change:</strong> ${it.changePolicy||'—'}</div>
        <div class="rc-detail"><strong>Cancel:</strong> ${it.cancellationPolicy||'—'}</div>
        <div class="rc-detail"><strong>Checked:</strong> ${it.lastCheckedAt||'—'}</div>
        <div class="rc-detail"><strong>Source:</strong> ${it.dataSource||'—'}</div>
      </div>
      <div class="rc-reason" style="margin-top:8px">💡 ${it.notes||''}</div>
      <div style="font-size:.76rem;color:var(--muted);margin-top:6px">${it.recommendationReason}</div>
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
