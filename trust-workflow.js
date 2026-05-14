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

function getProof(it) {
  return it.proof || {
    screenshotUrl: '',
    sourceUrl: '',
    observedAt: '',
    observedPlatform: '',
    observedPrice: null,
    notes: ''
  };
}

function getVerificationState(it) {
  const proof = getProof(it);
  const hasFlightNumbers = [...(it.outboundSegments || []), ...(it.returnSegments || [])].some(seg => seg.flightNumber);
  const hasDates = Boolean(it.outboundDate && it.returnDate);
  const hasPrice = Boolean(it.totalCashForFamily || it.totalPointsForFamily || it.cashPricePerPerson || it.pointsPerPerson);
  const state = {
    flightNumbersConfirmed: Boolean(it.verification?.flightNumbersConfirmed ?? hasFlightNumbers),
    datesConfirmed: Boolean(it.verification?.datesConfirmed ?? hasDates),
    priceForFourConfirmed: Boolean(it.verification?.priceForFourConfirmed ?? false),
    baggageConfirmed: Boolean(it.verification?.baggageConfirmed ?? Boolean(it.baggageIncluded)),
    seatSelectionConfirmed: Boolean(it.verification?.seatSelectionConfirmed ?? false),
    sameTicketConfirmed: Boolean(it.verification?.sameTicketConfirmed ?? it.sameTicket),
    awardSeatsConfirmed: Boolean(it.verification?.awardSeatsConfirmed ?? (it.paymentType === 'cash' || it.awardSeatsAvailable >= 4)),
    transferPlanConfirmed: Boolean(it.verification?.transferPlanConfirmed ?? it.destination === 'CAN'),
    airlineDirectPriceChecked: Boolean(it.verification?.airlineDirectPriceChecked ?? Boolean(it.links?.airlineDirect)),
    screenshotOrSourceSaved: Boolean(it.verification?.screenshotOrSourceSaved ?? Boolean(proof.screenshotUrl || proof.sourceUrl))
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
  if (it.isMock === false || it.dataStatus === 'Manual' || it.dataStatus === 'Verified') return false;
  return it.isMock === true || !it.proof;
}

function itineraryStatusBadges(it) {
  const proof = getProof(it);
  const observedAt = proof.observedAt || it.lastCheckedAt;
  const statuses = [];
  if (itineraryIsMock(it)) statuses.push('Mock');
  if (it.dataSource || it.lastCheckedAt || it.dataStatus === 'Manual') statuses.push('Manual');
  if (observedAt && trustDaysSince(observedAt) <= 1 && !itineraryNeedsDetails(it)) statuses.push('Verified');
  if (!observedAt || trustDaysSince(observedAt) > 3) statuses.push('Expired');
  if (itineraryNeedsDetails(it)) statuses.push('Needs Details');
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
  return `<div class="trust-block">
    <div class="trust-row">${renderTrustBadges(it)} ${renderVerificationProgress(it)}</div>
    <div class="trust-row">
      <div class="proof-box"><strong>Booking channel</strong><span>${getBookingChannel(it)} · ${getBookingChannelRisk(it)} risk</span></div>
      ${renderProofBlock(it)}
    </div>
  </div>`;
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
    searchMissions: SEARCH_MISSIONS,
    pasteParserResult: JSON.parse(localStorage.getItem('pasteParserResult') || 'null')
  };
}

function exportFullJson() {
  downloadTextFile('flight-monitor-full.json', JSON.stringify(trustExportPayload(), null, 2), 'application/json');
}

function exportVisibleJson() {
  const visible = getVisibleItinerariesForTrust(getEnrichedItineraries?.() || []);
  downloadTextFile('flight-monitor-visible.json', JSON.stringify(visible, null, 2), 'application/json');
}

function exportFamilySummary() {
  const visible = getVisibleItinerariesForTrust(getEnrichedItineraries?.() || []);
  const text = visible.map(it => `${it.title}: ${it.recommendation?.label || it.recommendation}, ${it.adjustedTotalForFamily ? '$' + it.adjustedTotalForFamily.toLocaleString() + ' adjusted for 4' : 'points option'}, family score ${it.familyScore}/10. ${it.recommendationReason || ''}`).join('\n');
  downloadTextFile('flight-monitor-family-summary.txt', text);
}

function exportSearchMissionsText() {
  const text = SEARCH_MISSIONS.map(m => `${m.title}\nPlatform: ${m.platform}\nRoute: ${m.route}\nDate: ${m.dateWindow}\nPassengers: ${m.passengers}\nThreshold: ${m.threshold}\nStatus: ${missionChecked(m.id) ? 'Checked today' : 'Not checked today'}\nQuery: ${m.query}`).join('\n\n');
  downloadTextFile('flight-monitor-search-missions.txt', text);
}

function exportBookingChecklistText() {
  const visible = getVisibleItinerariesForTrust(getEnrichedItineraries?.() || []);
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
