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
  if (links.googleFlights) btns.push(`<a href="${links.googleFlights}" target="_blank" class="btn-sm">Google Flights</a>`);
  if (links.airlineDirect) btns.push(`<a href="${links.airlineDirect}" target="_blank" class="btn-sm">${it.airline || 'Airline'}</a>`);
  if (links.united) btns.push(`<a href="${links.united}" target="_blank" class="btn-sm">United</a>`);
  if (links.chase) btns.push(`<a href="${links.chase}" target="_blank" class="btn-sm">Chase</a>`);
  if (links.amex) btns.push(`<a href="${links.amex}" target="_blank" class="btn-sm">Amex</a>`);
  if (links.aeroplan) btns.push(`<a href="${links.aeroplan}" target="_blank" class="btn-sm">Aeroplan</a>`);
  if (links.cathayAsiaMiles) btns.push(`<a href="${links.cathayAsiaMiles}" target="_blank" class="btn-sm">Asia Miles</a>`);
  if (btns.length === 0) btns.push(`<span class="btn-sm" onclick="navigator.clipboard.writeText('${it.origin} to ${it.destination} ${it.outboundDate}');this.textContent='Copied';" style="cursor:pointer">Copy search</span>`);
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

function getScoreColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#2563eb';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

function renderItineraryCard(it) {
  const recLabel = it.recommendation?.label || it.recommendation || 'Watch';
  const recCls = {Strong:'strong',Watch:'watch',Avoid:'avoid','Buy Now':'buy'}[recLabel] || 'watch';
  const isPoints = it.paymentType === 'points' || (it.program && it.program !== 'cash');
  const priceDisplay = isPoints
    ? (it.pointsPerPerson ? `${(it.pointsPerPerson/1000).toFixed(0)}k pts/pp` : 'Unknown')
    : (it.cashPricePerPerson ? `$${it.cashPricePerPerson.toLocaleString()}/pp` : 'Unknown');
  const adjustedTotalValue = it.adjustedTotalForFamily || it.adjustedTotal || it.totalCostCalculated;
  const adjTotal = adjustedTotalValue ? `$${Math.round(adjustedTotalValue).toLocaleString()}` : 'Unknown';
  const totalDisplay = isPoints
    ? (it.totalPointsForFamily || it.pointsPerPerson ? `${((it.totalPointsForFamily || it.pointsPerPerson * 4)/1000).toFixed(0)}k pts + $${((it.taxesPerPerson || 0)*4).toLocaleString()} tax` : 'Unknown')
    : (it.totalCashForFamily || it.cashPricePerPerson ? `$${(it.totalCashForFamily || it.cashPricePerPerson * 4).toLocaleString()} for 4` : 'Unknown');
  const durOut = fmtDur(it.totalDurationMinutesOutbound);
  const durRet = fmtDur(it.totalDurationMinutesReturn);
  const flightNumbers = getFlightNumbersSummary(it);
  const riskLevel = it.riskLevel || (it.routeFamily?.includes('PVG') || it.routeFamily?.includes('Open-jaw') ? 'Medium' : 'Low');
  const riskBadge = `<span class="badge badge-${riskLevel==='High'?'avoid':riskLevel==='Medium'?'watch':'buy'}">${riskLevel} Risk</span>`;
  const payBadge = isPoints ? `<span class="badge badge-points">${it.pointsProgram || it.program || 'Points'}</span>` : '<span class="badge badge-cash">Cash</span>';
  const verification = typeof getVerificationProgress === 'function' ? getVerificationProgress(it) : { checked: 0, total: 10 };
  const statusBadges = typeof renderTrustBadges === 'function' ? renderTrustBadges(it) : '<span class="badge badge-watch">Needs verification</span>';
  const whyGood = it.recommendationReason || it.notes || 'Promising route if the current fare still holds.';
  const concern = (it.riskChips && it.riskChips.length) ? it.riskChips[0] : (it.sameTicket ? 'Price and seats still need rechecking.' : 'Separate booking risk.');
  const nextStep = typeof getNextVerificationStep === 'function' ? getNextVerificationStep(it) : 'Recheck price, baggage, seats, and fare rules.';

  return `<div class="route-card rec-${recCls}" id="itin-${it.id}">
    <div class="rc-header" style="cursor:pointer" onclick="toggleExpand('${it.id}')">
      <div>
        <div class="rc-route">${it.title || `${it.origin || 'Unknown'}→${it.destination || 'Unknown'} ${it.airline || ''}`}</div>
        <div style="font-size:.8rem;color:var(--muted)">${it.airline || 'Unknown airline'} · ${flightNumbers} · ${it.outboundDate || 'Date unknown'} → ${it.returnDate || 'Date unknown'}</div>
      </div>
      <div class="rc-tags">
        <span class="badge badge-${recCls}">${recLabel}</span>
        ${payBadge}
        ${statusBadges}
        <span class="expand-icon" id="expand-${it.id}">▼</span>
      </div>
    </div>
    <div class="metrics compact-metrics">
      <div class="metric"><div class="metric-label">Total for 4</div><div class="metric-value">${totalDisplay}</div></div>
      <div class="metric"><div class="metric-label">Price per person</div><div class="metric-value">${priceDisplay}</div></div>
      <div class="metric"><div class="metric-label">Adjusted total</div><div class="metric-value">${adjTotal}</div></div>
      <div class="metric"><div class="metric-label">Travel time</div><div class="metric-value">${durOut}</div></div>
      <div class="metric"><div class="metric-label">Stops</div><div class="metric-value">${(it.stopsOutbound ?? it.stops)===0?'Nonstop':(it.stopsOutbound ?? it.stops) != null ? (it.stopsOutbound ?? it.stops)+'-stop' : 'Unknown'}</div></div>
      <div class="metric"><div class="metric-label">Arrival airport</div><div class="metric-value">${it.destination || 'Unknown'}</div></div>
      <div class="metric"><div class="metric-label">Risk</div><div class="metric-value">${riskBadge}</div></div>
      <div class="metric"><div class="metric-label">Family score</div><div class="metric-value">${it.familyScore || 'Unknown'}/10</div></div>
      <div class="metric"><div class="metric-label">Verification</div><div class="metric-value">${verification.checked}/${verification.total}</div></div>
    </div>
    <div class="flight-bullets">
      <div><strong>Why it’s good:</strong> ${whyGood}</div>
      <div><strong>Main concern:</strong> ${concern}</div>
      <div><strong>Next verification step:</strong> ${nextStep}</div>
    </div>
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
      <div class="rc-actions" style="flex-wrap:wrap;margin:8px 0">${renderItineraryLinks(it)}</div>
      ${typeof renderItineraryTrustBlock === 'function' ? renderItineraryTrustBlock(it) : ''}
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

function getFlightNumbersSummary(it) {
  const out = (it.outboundSegments || []).map(s => s.flightNumber).filter(Boolean).join('/');
  const ret = (it.returnSegments || []).map(s => s.flightNumber).filter(Boolean).join('/');
  if (!out && !ret) return 'Flight numbers unknown';
  return [out, ret].filter(Boolean).join(' | ');
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
    case 'price': return copy.sort((a,b) => (a.totalCostCalculated || 999999) - (b.totalCostCalculated || 999999));
    case 'duration': return copy.sort((a,b) => (a.totalHours || 999) - (b.totalHours || 999));
    case 'cpp': return copy.sort((a,b) => (b.cpp || 0) - (a.cpp || 0));
    case 'risk': return copy.sort((a,b) => (b.riskScore || 0) - (a.riskScore || 0));
    default: return copy.sort((a,b) => (b.overallScore || 0) - (a.overallScore || 0));
  }
}

function filterItineraries(list) {
  const includeAlt = document.getElementById('f-alt')?.checked ?? true;
  const includeHKG = document.getElementById('f-hkg')?.checked ?? true;
  const includeSZX = document.getElementById('f-szx')?.checked ?? true;
  const includePVG = document.getElementById('f-pvg')?.checked ?? true;
  const nonstopOnly = document.getElementById('f-nonstop')?.checked ?? false;
  const oneStopAllowed = document.getElementById('f-1stop')?.checked ?? true;
  const familyOnly = document.getElementById('f-family')?.checked ?? false;
  const bookableOnly = document.getElementById('f-bookable')?.checked ?? false;
  const pointsOnly = document.getElementById('f-points')?.checked ?? false;
  const cashOnly = document.getElementById('f-cash')?.checked ?? false;
  const maxPrice = parseInt(document.getElementById('f-max-price')?.value, 10) || null;
  const maxDuration = parseInt(document.getElementById('f-max-dur')?.value, 10) || null;
  return list.filter(it => {
    if (window.filterOutboundDate && it.outboundDate !== window.filterOutboundDate) return false;
    if (window.filterReturnDate && it.returnDate !== window.filterReturnDate) return false;

    const adjustedPerPerson = it.adjustedTotalForFamily ? it.adjustedTotalForFamily / (it.passengerCount || 4) : it.cashPricePerPerson;
    const maxTripHours = Math.max(
      (it.totalDurationMinutesOutbound || 0) / 60,
      (it.totalDurationMinutesReturn || 0) / 60,
      it.totalDurationHours || 0
    );
    if (maxPrice && adjustedPerPerson && adjustedPerPerson > maxPrice) return false;
    if (maxDuration && maxTripHours && maxTripHours > maxDuration) return false;

    const dest = it.destination?.split('→')[0]?.trim() || it.destination;
    if (!includeAlt && dest !== 'CAN') return false;
    if (!includeHKG && (dest === 'HKG' || it.destination === 'HKG')) return false;
    if (!includeSZX && (dest === 'SZX' || it.destination === 'SZX')) return false;
    if (!includePVG && (dest === 'PVG' || dest === 'SHA' || it.destination === 'PVG' || it.destination === 'SHA')) return false;
    if (nonstopOnly && (it.stops > 0 || it.stopsOutbound > 0)) return false;
    if (!oneStopAllowed && (it.stops > 1 || it.stopsOutbound > 1)) return false;
    if (familyOnly && it.riskLevel === 'High') return false;
    if (bookableOnly && it.paymentType === 'points' && !it.familyBookable) return false;
    if (pointsOnly && it.paymentType !== 'points') return false;
    if (cashOnly && it.paymentType !== 'cash') return false;
    return true;
  });
}

function resetFilters(shouldRender = true) {
  const ids = ['f-alt', 'f-hkg', 'f-szx', 'f-pvg', 'f-1stop'];
  ids.forEach(id => { const el = document.getElementById(id); if(el) el.checked = true; });
  const idsFalse = ['f-nonstop', 'f-family', 'f-bookable', 'f-points', 'f-cash'];
  idsFalse.forEach(id => { const el = document.getElementById(id); if(el) el.checked = false; });
  ['f-max-price', 'f-max-dur'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  if (shouldRender) {
    if (typeof rerenderFilteredViews === 'function') rerenderFilteredViews();
    else renderItinerariesTab();
  }
}

// Render the itineraries tab
function renderItinerariesTab() {
  const sort = document.getElementById('itin-sort')?.value || 'best';
  const container = document.getElementById('itineraries-list');
  if (!container) return;

  const enriched = getEnrichedItineraries();
  if (enriched.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted)">No itinerary data loaded. Add sample data or import JSON.</div>`;
    return;
  }

  let dateAlertHtml = '';
  if (window.filterOutboundDate && window.filterReturnDate) {
    dateAlertHtml = `<div class="date-alert-banner" style="display:flex;align-items:center;justify-content:space-between;background:#e0f2fe;border:1px solid #0284c7;color:#0369a1;padding:8px 12px;border-radius:var(--r-sm);margin-bottom:12px;font-size:.82rem">
      <span>📅 Showing flights for dates: <strong>${window.filterOutboundDate}</strong> to <strong>${window.filterReturnDate}</strong></span>
      <button class="btn-sm" onclick="clearDateFilter()" style="border-color:#0284c7;color:#0369a1">Clear Date Filter</button>
    </div>`;
  }

  const filtered = filterItineraries(enriched);
  if (filtered.length === 0) {
    container.innerHTML = dateAlertHtml + `<div class="empty-state"><strong>No itineraries match these filters.</strong><span>Try increasing max hours or allowing HKG/SZX.</span><button class="btn-sm" onclick="resetFilters()">Reset filters</button></div>`;
    return;
  }

  const sorted = sortItineraries(filtered, sort);
  const grouped = document.getElementById('itin-group')?.checked;
  
  container.innerHTML = dateAlertHtml + (grouped ? renderGroupedItineraries(sorted) : `<div class="route-cards">${renderAllItineraryCards(sorted)}</div>`);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderItinerariesTab();
  document.getElementById('itin-sort')?.addEventListener('change', renderItinerariesTab);
  document.getElementById('itin-group')?.addEventListener('change', renderItinerariesTab);
  
  ['f-max-price', 'f-max-dur', 'f-alt', 'f-hkg', 'f-szx', 'f-pvg', 'f-nonstop', 'f-1stop', 'f-family', 'f-bookable', 'f-points', 'f-cash'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', renderItinerariesTab);
    document.getElementById(id)?.addEventListener('input', renderItinerariesTab);
  });
});
