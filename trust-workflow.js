/* Trust workflow: data health, proof, verification, missions, parser, exports */

const TRUST_CHECKLIST = [
  ['flightNumbersConfirmed', 'flight numbers confirmed'],
  ['datesConfirmed', 'dates confirmed'],
  ['priceForFourConfirmed', 'price for all 4 confirmed'],
  ['baggageConfirmed', 'baggage confirmed'],
  ['seatSelectionConfirmed', 'seat selection confirmed'],
  ['sameTicketConfirmed', 'same-ticket confirmed'],
  ['awardSeatsConfirmed', 'award seats confirmed'],
  ['transferPlanConfirmed', 'transfer plan confirmed'],
  ['airlineDirectPriceChecked', 'airline direct price checked'],
  ['screenshotOrSourceSaved', 'screenshot/source saved']
];

const SEARCH_MISSIONS = [
  {
    id: 'jfk-can-nonstop-cash',
    title: 'Recheck JFK-CAN nonstop cash',
    platform: 'China Southern / Google Flights',
    route: 'JFK-CAN round trip',
    dateWindow: 'Jul 25-Aug 8 outbound, Aug 25-Sep 8 return',
    passengers: '4 passengers',
    threshold: 'Buy if nonstop under $1,500 per person',
    url: 'https://www.google.com/travel/flights',
    query: 'JFK to CAN nonstop round trip 4 passengers July 25-August 8 2026 return August 25-September 8 2026 China Southern cash fare'
  },
  {
    id: 'ewr-jfk-hkg-four',
    title: 'Search EWR/JFK-HKG for 4 passengers',
    platform: 'Google Flights / Cathay Pacific',
    route: 'EWR/JFK-HKG round trip',
    dateWindow: 'Jul 25-Aug 8 outbound, Aug 25-Sep 8 return',
    passengers: '4 passengers',
    threshold: 'Strong if adjusted total saves $250+ vs CAN',
    url: 'https://www.google.com/travel/flights',
    query: 'EWR JFK to HKG round trip 4 passengers late July early August 2026 return late August early September 2026'
  },
  {
    id: 'united-awards',
    title: 'Check United award seats',
    platform: 'United MileagePlus',
    route: 'EWR/JFK to CAN/HKG/SZX/PVG',
    dateWindow: 'Full flexible window',
    passengers: '4 award seats',
    threshold: 'Only if 4 seats and redemption >= 1.2 cpp',
    url: 'https://www.united.com/en/us',
    query: 'United award search EWR JFK to CAN HKG SZX PVG 4 seats summer 2026'
  },
  {
    id: 'aeroplan-awards',
    title: 'Check Aeroplan award seats',
    platform: 'Air Canada Aeroplan',
    route: 'NYC/NJ to CAN/HKG/SZX/PVG',
    dateWindow: 'Full flexible window',
    passengers: '4 award seats',
    threshold: 'Only if 4 seats or explicit Mixed Strategy',
    url: 'https://www.aircanada.com/aeroplan',
    query: 'Aeroplan award search NYC to CAN HKG SZX PVG 4 passengers summer 2026'
  },
  {
    id: 'openjaw-can-hkg',
    title: 'Compare open-jaw JFK-CAN / HKG-JFK',
    platform: 'Google Flights multi-city',
    route: 'JFK-CAN outbound, HKG-JFK return',
    dateWindow: 'Jul 25-Aug 8 outbound, Aug 25-Sep 8 return',
    passengers: '4 passengers',
    threshold: 'Buy candidate if adjusted total under $1,300',
    url: 'https://www.google.com/travel/flights',
    query: 'Multi-city JFK to CAN and HKG to JFK 4 passengers summer 2026'
  }
];

const TRUST_OVERRIDES_KEY = 'flightTrustOverrides';

function trustTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function trustParseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function trustDaysSince(value) {
  const date = trustParseDate(value);
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / 86400000;
}

function loadTrustOverrides() {
  try {
    return JSON.parse(localStorage.getItem(TRUST_OVERRIDES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveTrustOverrides(overrides) {
  localStorage.setItem(TRUST_OVERRIDES_KEY, JSON.stringify(overrides));
}

function getTrustOverride(itId) {
  return loadTrustOverrides()[itId] || {};
}

function updateTrustOverride(itId, patch) {
  const all = loadTrustOverrides();
  all[itId] = {
    ...(all[itId] || {}),
    ...patch,
    updatedAt: new Date().toISOString()
  };
  saveTrustOverrides(all);
  refreshData?.();
}

function updateVerificationItem(itId, key, checked) {
  const current = getTrustOverride(itId);
  updateTrustOverride(itId, {
    verification: {
      ...(current.verification || {}),
      [key]: checked
    }
  });
}

function saveProofOverride(itId, proof) {
  updateTrustOverride(itId, {
    proof: {
      ...proof,
      observedAt: proof.observedAt || new Date().toISOString()
    },
    dataStatus: 'Manual',
    isMock: false
  });
}

function applyTrustOverride(it) {
  const override = getTrustOverride(it.id);
  return {
    ...it,
    ...override,
    proof: {
      ...(it.proof || {}),
      ...(override.proof || {})
    },
    verification: {
      ...(it.verification || {}),
      ...(override.verification || {})
    }
  };
}

function getProof(it) {
  const merged = applyTrustOverride(it);
  return merged.proof || {
    screenshotUrl: '',
    sourceUrl: '',
    observedAt: '',
    observedPlatform: '',
    observedPrice: null,
    notes: ''
  };
}

function getVerificationState(it) {
  const merged = applyTrustOverride(it);
  const proof = getProof(merged);
  const hasFlightNumbers = [...(merged.outboundSegments || []), ...(merged.returnSegments || [])].some(seg => seg.flightNumber);
  const hasDates = Boolean(merged.outboundDate && merged.returnDate);
  const hasPrice = Boolean(merged.totalCashForFamily || merged.totalPointsForFamily || merged.cashPricePerPerson || merged.pointsPerPerson);
  const state = {
    flightNumbersConfirmed: Boolean(merged.verification?.flightNumbersConfirmed ?? hasFlightNumbers),
    datesConfirmed: Boolean(merged.verification?.datesConfirmed ?? hasDates),
    priceForFourConfirmed: Boolean(merged.verification?.priceForFourConfirmed ?? false),
    baggageConfirmed: Boolean(merged.verification?.baggageConfirmed ?? Boolean(merged.baggageIncluded)),
    seatSelectionConfirmed: Boolean(merged.verification?.seatSelectionConfirmed ?? false),
    sameTicketConfirmed: Boolean(merged.verification?.sameTicketConfirmed ?? merged.sameTicket),
    awardSeatsConfirmed: Boolean(merged.verification?.awardSeatsConfirmed ?? (merged.paymentType === 'cash' || merged.awardSeatsAvailable >= 4)),
    transferPlanConfirmed: Boolean(merged.verification?.transferPlanConfirmed ?? merged.destination === 'CAN'),
    airlineDirectPriceChecked: Boolean(merged.verification?.airlineDirectPriceChecked ?? Boolean(merged.links?.airlineDirect)),
    screenshotOrSourceSaved: Boolean(merged.verification?.screenshotOrSourceSaved ?? Boolean(proof.screenshotUrl || proof.sourceUrl))
  };
  if (!hasPrice) state.priceForFourConfirmed = false;
  return state;
}

function getVerificationProgress(it) {
  const state = getVerificationState(it);
  const checked = TRUST_CHECKLIST.filter(([key]) => state[key]).length;
  return { checked, total: TRUST_CHECKLIST.length, state };
}

function itineraryNeedsDetails(it) {
  const v = getVerificationState(it);
  return !(
    v.flightNumbersConfirmed &&
    v.datesConfirmed &&
    v.priceForFourConfirmed &&
    v.baggageConfirmed &&
    v.seatSelectionConfirmed &&
    v.sameTicketConfirmed &&
    v.screenshotOrSourceSaved
  );
}

function itineraryComplete(it) {
  return !itineraryNeedsDetails(it);
}

function itineraryIsMock(it) {
  const merged = applyTrustOverride(it);
  if (merged.isMock === false || merged.dataStatus === 'Manual' || merged.dataStatus === 'Verified') return false;
  return merged.isMock === true || !merged.proof;
}

function itineraryStatusBadges(it) {
  const merged = applyTrustOverride(it);
  const proof = getProof(merged);
  const observedAt = proof.observedAt || merged.lastCheckedAt;
  const statuses = [];
  if (itineraryIsMock(merged)) statuses.push('Mock');
  if (merged.dataSource || merged.lastCheckedAt || merged.dataStatus === 'Manual') statuses.push('Manual');
  if (observedAt && trustDaysSince(observedAt) <= 1 && !itineraryNeedsDetails(merged)) statuses.push('Verified');
  if (!observedAt || trustDaysSince(observedAt) > 3) statuses.push('Expired');
  if (itineraryNeedsDetails(merged)) statuses.push('Needs Details');
  return [...new Set(statuses)];
}

function renderTrustBadges(it) {
  return `<div class="trust-badges">${itineraryStatusBadges(it).map(status =>
    `<span class="trust-badge trust-${status.toLowerCase().replace(/\s+/g, '-')}">${status}</span>`
  ).join('')}</div>`;
}

function renderVerificationProgress(it) {
  const p = getVerificationProgress(it);
  const pct = Math.round((p.checked / p.total) * 100);
  const missing = TRUST_CHECKLIST
    .filter(([key]) => !p.state[key])
    .slice(0, 2)
    .map(([, label]) => label)
    .join(', ');
  return `<div class="trust-progress">
    <div class="trust-progress-head"><strong>${p.checked}/${p.total} checked</strong><span>${pct}%</span></div>
    <div class="trust-track"><div style="width:${pct}%"></div></div>
    <small>${missing || 'Verification checklist complete'}</small>
  </div>`;
}

function proofSummary(it) {
  const proof = getProof(it);
  if (!proof.screenshotUrl && !proof.sourceUrl && !proof.observedAt) {
    return 'No proof saved. Recheck before using this fare.';
  }
  const bits = [
    proof.observedPlatform || it.dataSource || 'Source',
    proof.observedAt ? new Date(proof.observedAt).toLocaleString() : '',
    proof.observedPrice ? `$${proof.observedPrice.toLocaleString()}` : ''
  ].filter(Boolean);
  return `${bits.join(' / ')}${proof.notes ? `. ${proof.notes}` : ''}`;
}

function renderProofBlock(it) {
  const proof = getProof(it);
  const links = [
    proof.sourceUrl ? `<a href="${proof.sourceUrl}" target="_blank" rel="noopener">source</a>` : '',
    proof.screenshotUrl ? `<a href="${proof.screenshotUrl}" target="_blank" rel="noopener">screenshot</a>` : ''
  ].filter(Boolean).join(' · ');
  return `<div class="proof-box"><strong>Proof</strong><span>${proofSummary(it)}</span>${links ? `<span>${links}</span>` : ''}</div>`;
}

function getBookingChannel(it) {
  return it.bookingChannel || (it.paymentType === 'points' ? 'Award Program' : it.links?.airlineDirect ? 'Airline Direct' : 'OTA');
}

function getBookingChannelRisk(it) {
  if (it.bookingChannelRisk) return it.bookingChannelRisk;
  if (!it.sameTicket) return 'High';
  if (getBookingChannel(it) === 'Airline Direct') return 'Low';
  if (getBookingChannel(it) === 'Award Program') return it.awardSeatsAvailable >= 4 ? 'Medium' : 'High';
  return 'Medium';
}

function renderItineraryTrustBlock(it) {
  const merged = applyTrustOverride(it);
  return `<div class="trust-block">
    <div class="trust-row">${renderTrustBadges(merged)} ${renderVerificationProgress(merged)}</div>
    <div class="trust-row">
      <div class="proof-box"><strong>Booking channel</strong><span>${getBookingChannel(merged)} · ${getBookingChannelRisk(merged)} risk</span></div>
      ${renderProofBlock(merged)}
    </div>
    <details class="trust-editor">
      <summary>Edit verification and proof</summary>
      ${renderTrustChecklist(merged)}
      <div class="mission-actions">
        <button class="btn-sm" onclick="openProofEditor('${merged.id}')">Save proof</button>
        <button class="btn-sm" onclick="markItineraryCheckedToday('${merged.id}')">Mark checked today</button>
      </div>
    </details>
  </div>`;
}

function renderTrustChecklist(it) {
  const state = getVerificationState(it);
  return `<div class="trust-checklist">${TRUST_CHECKLIST.map(([key, label]) => `
    <label>
      <input type="checkbox" ${state[key] ? 'checked' : ''} onchange="updateVerificationItem('${it.id}', '${key}', this.checked)">
      <span>${label}</span>
    </label>
  `).join('')}</div>`;
}

function markItineraryCheckedToday(itId) {
  const it = (typeof ITINERARIES !== 'undefined' ? ITINERARIES : []).find(item => item.id === itId);
  const current = getTrustOverride(itId);
  const sourceUrl = current.proof?.sourceUrl || it?.links?.airlineDirect || it?.links?.googleFlights || '';
  saveProofOverride(itId, {
    ...(current.proof || {}),
    sourceUrl,
    observedAt: new Date().toISOString(),
    observedPlatform: current.proof?.observedPlatform || it?.dataSource || it?.airline || '',
    observedPrice: current.proof?.observedPrice || it?.cashPricePerPerson || null,
    notes: current.proof?.notes || 'Marked checked in dashboard.'
  });
}

function openProofEditor(itId) {
  const it = (typeof ITINERARIES !== 'undefined' ? ITINERARIES : []).find(item => item.id === itId);
  const proof = getProof(it || { id: itId });
  const modal = document.createElement('div');
  modal.className = 'trust-modal';
  modal.innerHTML = `<div class="trust-modal-card">
    <div class="trust-modal-head">
      <h3>Save proof: ${it?.title || itId}</h3>
      <button onclick="this.closest('.trust-modal').remove()">x</button>
    </div>
    <label>Source URL<input id="proof-source-url" value="${escapeAttr(proof.sourceUrl || it?.links?.airlineDirect || it?.links?.googleFlights || '')}"></label>
    <label>Screenshot URL<input id="proof-screenshot-url" value="${escapeAttr(proof.screenshotUrl || '')}"></label>
    <label>Observed platform<input id="proof-platform" value="${escapeAttr(proof.observedPlatform || it?.dataSource || '')}"></label>
    <label>Observed price<input id="proof-price" type="number" value="${proof.observedPrice || it?.cashPricePerPerson || ''}"></label>
    <label>Observed at<input id="proof-observed-at" type="datetime-local" value="${toDatetimeLocal(proof.observedAt || new Date().toISOString())}"></label>
    <label>Notes<textarea id="proof-notes">${escapeHtml(proof.notes || '')}</textarea></label>
    <div class="mission-actions">
      <button class="btn-sm primary" onclick="saveProofFromModal('${itId}')">Save proof</button>
      <button class="btn-sm" onclick="this.closest('.trust-modal').remove()">Cancel</button>
    </div>
  </div>`;
  modal.addEventListener('click', event => { if (event.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function saveProofFromModal(itId) {
  saveProofOverride(itId, {
    sourceUrl: document.getElementById('proof-source-url')?.value || '',
    screenshotUrl: document.getElementById('proof-screenshot-url')?.value || '',
    observedPlatform: document.getElementById('proof-platform')?.value || '',
    observedPrice: Number(document.getElementById('proof-price')?.value) || null,
    observedAt: new Date(document.getElementById('proof-observed-at')?.value || Date.now()).toISOString(),
    notes: document.getElementById('proof-notes')?.value || ''
  });
  document.querySelector('.trust-modal')?.remove();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function toDatetimeLocal(value) {
  const date = trustParseDate(value) || new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getVisibleItinerariesForTrust(enriched) {
  const base = Array.isArray(enriched) ? enriched : (typeof getEnrichedItineraries === 'function' ? getEnrichedItineraries() : []);
  if (typeof applyFilters === 'function' && typeof currentFilters !== 'undefined') {
    readFilters?.();
    return applyFilters(base, currentFilters);
  }
  return base;
}

function renderDataHealthPanel(enriched) {
  const el = document.getElementById('data-health-panel');
  if (!el) return;
  const all = Array.isArray(enriched) ? enriched : [];
  const visible = getVisibleItinerariesForTrust(all);
  if (!all.length) {
    el.innerHTML = `<div class="empty-state">No itinerary data loaded.</div>`;
    return;
  }
  const lastDates = all.map(it => getProof(it).observedAt || it.lastCheckedAt).filter(Boolean).map(trustParseDate).filter(Boolean).sort((a, b) => b - a);
  const metrics = [
    ['Total itineraries loaded', all.length],
    ['Complete itineraries', all.filter(itineraryComplete).length],
    ['Incomplete itineraries', all.filter(it => !itineraryComplete(it)).length],
    ['Visible after filters', visible.length],
    ['Hidden by filters', all.length - visible.length],
    ['Needs details count', all.filter(itineraryNeedsDetails).length],
    ['Mock data count', all.filter(itineraryIsMock).length],
    ['Last updated', lastDates[0] ? lastDates[0].toLocaleString() : 'No timestamp']
  ];
  el.innerHTML = `<div class="data-health-grid">${metrics.map(([k, v]) => `
    <div class="data-health-card"><span>${k}</span><strong>${v}</strong></div>
  `).join('')}</div>`;
}

function missionKey(id) {
  return `flightMission:${trustTodayKey()}:${id}`;
}

function missionChecked(id) {
  return localStorage.getItem(missionKey(id)) === 'checked';
}

function markMissionChecked(id) {
  localStorage.setItem(missionKey(id), 'checked');
  renderSearchMissionsInto('shortcuts');
}

async function copyMissionText(id) {
  const mission = SEARCH_MISSIONS.find(item => item.id === id);
  if (!mission) return;
  const text = `${mission.title}\nPlatform: ${mission.platform}\nRoute: ${mission.route}\nDate window: ${mission.dateWindow}\nPassengers: ${mission.passengers}\nThreshold: ${mission.threshold}\nQuery: ${mission.query}`;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function renderSearchMissions() {
  return `<div class="mission-grid">${SEARCH_MISSIONS.map(mission => {
    const checked = missionChecked(mission.id);
    return `<div class="mission-card">
      <div>
        <span class="trust-badge ${checked ? 'trust-verified' : 'trust-needs-details'}">${checked ? 'Checked today' : 'Not checked today'}</span>
        <h4>${mission.title}</h4>
        <p><strong>Platform:</strong> ${mission.platform}</p>
        <p><strong>Route:</strong> ${mission.route}</p>
        <p><strong>Date:</strong> ${mission.dateWindow}</p>
        <p><strong>Passengers:</strong> ${mission.passengers}</p>
        <p><strong>Threshold:</strong> ${mission.threshold}</p>
      </div>
      <div class="mission-actions">
        <button class="btn-sm" onclick="copyMissionText('${mission.id}');this.textContent='Copied';setTimeout(()=>this.textContent='Copy',1200)">Copy</button>
        <button class="btn-sm" onclick="markMissionChecked('${mission.id}')">${checked ? 'Recheck done' : 'Mark checked'}</button>
        <a class="btn-sm" target="_blank" rel="noopener" href="${mission.url}" onclick="markMissionChecked('${mission.id}')">Open search</a>
      </div>
    </div>`;
  }).join('')}</div>
  <div class="export-row">
    <button class="btn-sm" onclick="exportFullJson()">Export full JSON</button>
    <button class="btn-sm" onclick="exportVisibleJson()">Export visible itineraries JSON</button>
    <button class="btn-sm" onclick="exportFamilySummary()">Export family-readable summary</button>
    <button class="btn-sm" onclick="exportSearchMissionsText()">Export search missions text</button>
    <button class="btn-sm" onclick="exportBookingChecklistText()">Export booking checklist text</button>
  </div>`;
}

function renderSearchMissionsInto(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = renderSearchMissions();
}

function parseFlightText(rawText) {
  const text = rawText.trim();
  const airlines = ['China Southern', 'Cathay Pacific', 'United', 'Air Canada', 'ANA', 'Asiana', 'Turkish', 'Qatar', 'Emirates', 'Korean Air', 'EVA'];
  const airline = airlines.find(name => new RegExp(name, 'i').test(text)) || '';
  const flightNumbers = [...new Set((text.match(/\b[A-Z]{2}\s?\d{2,4}\b/g) || []).map(v => v.replace(/\s+/, '')))];
  const airports = [...new Set(text.match(/\b(EWR|JFK|LGA|PHL|CAN|HKG|SZX|PVG|SHA)\b/g) || [])];
  const times = text.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)?\b/gi) || [];
  const layover = (text.match(/layover[^.\n]*/i) || text.match(/\b\d+h\s?\d*m?\s?layover\b/i) || [''])[0];
  const priceMatch = text.match(/\$\s?[\d,]+(?:\.\d{2})?/);
  const price = priceMatch ? Number(priceMatch[0].replace(/[$,\s]/g, '')) : null;
  const notes = text.split('\n').slice(0, 6).join(' ').slice(0, 600);
  const parsed = { airline, flightNumbers, airports, times, layover, price, notes, sourceNotes: '' };
  const success = Boolean(airline || flightNumbers.length || airports.length >= 2 || price);
  if (!success) parsed.sourceNotes = text;
  return { success, parsed, rawText: text, savedAt: new Date().toISOString() };
}

function parseAndSaveFlightText() {
  const input = document.getElementById('paste-parser-input');
  const output = document.getElementById('paste-parser-output');
  const result = parseFlightText(input?.value || '');
  localStorage.setItem('pasteParserResult', JSON.stringify(result));
  if (output) output.textContent = JSON.stringify(result, null, 2);
}

function clearPasteParser() {
  localStorage.removeItem('pasteParserResult');
  const input = document.getElementById('paste-parser-input');
  const output = document.getElementById('paste-parser-output');
  if (input) input.value = '';
  if (output) output.textContent = 'No pasted result saved yet.';
}

function hydratePasteParser() {
  const saved = localStorage.getItem('pasteParserResult');
  const output = document.getElementById('paste-parser-output');
  if (saved && output) output.textContent = JSON.stringify(JSON.parse(saved), null, 2);
}

function renderTrustAdminPanel() {
  return `<div class="trust-admin-grid">
    <div>
      <textarea id="paste-parser-input" placeholder="Paste raw Google Flights, airline, OTA, or award result text here..."></textarea>
      <div class="mission-actions">
        <button class="btn-sm primary" onclick="parseAndSaveFlightText()">Parse and save</button>
        <button class="btn-sm" onclick="clearPasteParser()">Clear saved paste</button>
      </div>
    </div>
    <pre id="paste-parser-output">No pasted result saved yet.</pre>
  </div>`;
}

function downloadTextFile(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function trustExportPayload() {
  const enriched = getEnrichedItineraries?.() || [];
  return {
    exportedAt: new Date().toISOString(),
    passengerConfig,
    adjustments: typeof ADJUSTMENTS !== 'undefined' ? ADJUSTMENTS : {},
    itineraries: enriched,
    trustOverrides: loadTrustOverrides(),
    searchMissions: SEARCH_MISSIONS,
    pasteParserResult: JSON.parse(localStorage.getItem('pasteParserResult') || 'null')
  };
}

function exportFullJson() {
  downloadTextFile('flight-monitor-full.json', JSON.stringify(trustExportPayload(), null, 2), 'application/json');
}

function exportVisibleJson() {
  const visible = getVisibleItinerariesForTrust(getEnrichedItineraries?.() || []);
  downloadTextFile('flight-monitor-visible.json', JSON.stringify(visible.map(applyTrustOverride), null, 2), 'application/json');
}

function exportFamilySummary() {
  const visible = getVisibleItinerariesForTrust(getEnrichedItineraries?.() || []).map(applyTrustOverride);
  const text = visible.map(it => {
    const progress = getVerificationProgress(it);
    return `${it.title}: ${it.recommendation?.label || it.recommendation}, ${it.adjustedTotalForFamily ? '$' + it.adjustedTotalForFamily.toLocaleString() + ' adjusted for 4' : 'points option'}, family score ${it.familyScore}/10, verification ${progress.checked}/${progress.total}. ${proofSummary(it)}`;
  }).join('\n');
  downloadTextFile('flight-monitor-family-summary.txt', text);
}

function exportSearchMissionsText() {
  const text = SEARCH_MISSIONS.map(m => `${m.title}\nPlatform: ${m.platform}\nRoute: ${m.route}\nDate: ${m.dateWindow}\nPassengers: ${m.passengers}\nThreshold: ${m.threshold}\nStatus: ${missionChecked(m.id) ? 'Checked today' : 'Not checked today'}\nQuery: ${m.query}`).join('\n\n');
  downloadTextFile('flight-monitor-search-missions.txt', text);
}

function exportBookingChecklistText() {
  const visible = getVisibleItinerariesForTrust(getEnrichedItineraries?.() || []).map(applyTrustOverride);
  const text = visible.map(it => {
    const state = getVerificationState(it);
    const lines = TRUST_CHECKLIST.map(([key, label]) => `- [${state[key] ? 'x' : ' '}] ${label}`).join('\n');
    return `${it.title}\n${lines}\nProof: ${proofSummary(it)}`;
  }).join('\n\n');
  downloadTextFile('flight-monitor-booking-checklist.txt', text);
}

function renderTrustPanels(enriched) {
  renderDataHealthPanel(enriched);
  const admin = document.getElementById('trust-admin-panel');
  if (admin && !admin.dataset.ready) {
    admin.innerHTML = renderTrustAdminPanel();
    admin.dataset.ready = 'true';
  }
  hydratePasteParser();
  renderSearchMissionsInto('shortcuts');
}
