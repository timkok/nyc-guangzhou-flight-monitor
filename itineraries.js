// All flight itineraries are consolidated inside data.js.
window.ITINERARIES = window.itineraries;

function getLayoverQuality(mins){
  if(!mins||mins===0)return null;
  if(mins<75)return{label:"Tight",cls:"avoid",icon:"⚠️"};
  if(mins<=120)return{label:"Acceptable",cls:"watch",icon:"⏱️"};
  if(mins<=240)return{label:"Good",cls:"buy",icon:"✅"};
  if(mins<=360)return{label:"Long",cls:"watch",icon:"⏳"};
  if(mins<=720)return{label:"Very Long",cls:"avoid",icon:"😴"};
  return{label:"Overnight",cls:"avoid",icon:"🌙"};
}
function fmtDur(m){if(!Number.isFinite(m))return"Unknown";const h=Math.floor(m/60);const mm=m%60;return h+"h"+(mm>0?mm+"m":"");}
function fmtTime(t){return t||"—";}

// ─── SOURCE CONFIDENCE ──────────────────────────────
function getSourceConfidence(it) {
  const checked = it.lastCheckedAt;
  if (!checked) return { label: 'Unknown', cls: 'avoid', icon: '❓', detail: 'No check date' };
  const days = Math.floor((new Date() - new Date(checked)) / 86400000);
  const src = (it.dataSource || '').toLowerCase();
  const highConf = src.includes('united') || src.includes('aeroplan') || src.includes('airline');
  if (days <= 1) return { label: 'Fresh', cls: 'buy', icon: '🟢', detail: `Checked ${checked}${highConf ? ' · airline direct' : ''}` };
  if (days <= 3) return { label: 'Stale soon', cls: 'watch', icon: '🟡', detail: `Checked ${days}d ago` };
  return { label: 'Stale', cls: 'avoid', icon: '🔴', detail: `Checked ${days}d ago — reverify` };
}

// ─── DATA COMPLETENESS ──────────────────────────────
function getCompletenessScore(it) {
  const fields = ['airline','outboundDate','returnDate','origin','destination','totalDurationMinutesOutbound'];
  const hasPrice = it.cashPricePerPerson != null || it.pointsPerPerson != null;
  const hasFlightNum = it.outboundSegments?.some(s => s.flightNumber);
  const hasTimes = it.outboundSegments?.some(s => s.departureTime && s.arrivalTime);
  const hasLink = it.links && Object.values(it.links).some(v => v);
  let score = 0;
  fields.forEach(f => { if (it[f]) score++; });
  if (hasPrice) score += 2;
  if (hasFlightNum) score += 2;
  if (hasTimes) score++;
  if (hasLink) score++;
  const max = fields.length + 6;
  const pct = Math.round(score / max * 100);
  return { score, max, pct, complete: pct >= 80, label: pct >= 80 ? 'Complete' : 'Needs verification' };
}

// ─── TRANSFER PLANS ─────────────────────────────────
const TRANSFER_PLANS = {
  HKG: {
    method: 'High-speed rail from West Kowloon to Guangzhou South',
    duration: '~50 min train + 30 min each side',
    familyCost: '$30-50/person',
    totalEstimate: '$120-200 for 4',
    overnight: 'Only if arriving after 9pm',
    tips: 'Book train tickets on 12306 app or at station. Last train ~9:30pm.'
  },
  SZX: {
    method: 'Intercity train from Shenzhen North to Guangzhou South',
    duration: '~30 min train + 30 min each side',
    familyCost: '$15-25/person',
    totalEstimate: '$60-100 for 4',
    overnight: 'Rarely needed',
    tips: 'Easiest alternative. Very frequent trains.'
  },
  PVG: {
    method: 'Domestic flight PVG→CAN (~2.5h) or high-speed rail (~7h)',
    duration: '3-8 hours depending on method',
    familyCost: '$100-200/person (flight) or $50-80/person (train)',
    totalEstimate: '$200-800 for 4',
    overnight: 'Likely needed if arriving late',
    tips: 'Book domestic separately. Consider spending a night in Shanghai.'
  },
  SHA: {
    method: 'Domestic flight SHA→CAN (~2.5h) or transfer to PVG',
    duration: '3-8 hours',
    familyCost: '$100-200/person',
    totalEstimate: '$200-800 for 4',
    overnight: 'Likely needed',
    tips: 'Hongqiao has fewer CAN flights than Pudong.'
  }
};

function getTransferPlan(dest) {
  const code = dest?.split('→')[0]?.trim();
  return TRANSFER_PLANS[code] || null;
}

// ─── HUMAN-READABLE VERDICT ─────────────────────────
function generateVerdict(it) {
  const dest = it.destination?.split('→')[0]?.trim();
  const isNonstop = it.stopsOutbound === 0;
  const pp = it.cashPricePerPerson;
  const pts = it.pointsPerPerson;
  const dur = fmtDur(it.totalDurationMinutesOutbound);
  const fam = it.passengerCount || 4;

  if (it.recommendation === 'Strong' || it.recommendation === 'Buy Now') {
    if (dest === 'CAN' && isNonstop && pp) return `Strong nonstop option to Guangzhou at $${pp}/pp for ${fam}. Book if price holds.`;
    if (dest === 'CAN' && !isNonstop && pp) return `Good 1-stop CAN fare at $${pp}/pp (${dur}). Worth booking if duration is acceptable for the family.`;
    if (dest === 'HKG' && pp) return `Hong Kong alternative at $${pp}/pp saves money. Add ~$200 transfer cost and 1.5h to Guangzhou via rail.`;
    if (pts && it.familyBookable) return `Award option using ${it.pointsProgram} at ${it.cpp?.toFixed(1)} cpp. ${it.awardSeatsAvailable} seats available for ${fam} passengers.`;
    if (it.routeFamily?.includes('Open-jaw')) return `Open-jaw: fly into ${it.destination}, return from ${it.returnOrigin}. Flexible but requires separate bookings.`;
    return `${it.recommendation} option via ${it.airline}. Review details before booking.`;
  }
  if (it.recommendation === 'Watch') {
    if (dest === 'PVG' || dest === 'SHA') return `Shanghai backup at $${pp}/pp. Only worth it if savings exceed $400/pp after adding ~$400 transfer cost for the family.`;
    if (pts && !it.familyBookable) return `Award option but only ${it.awardSeatsAvailable}/${fam} seats available. Consider mixed strategy.`;
    return `Monitoring — not yet a clear buy. ${it.recommendationReason}`;
  }
  if (it.recommendation === 'Avoid') {
    const reasons = (it.riskChips || []).slice(0, 3).join(', ');
    return `Not recommended: ${reasons || it.recommendationReason}. Look at other options first.`;
  }
  return it.recommendationReason || 'Review this option manually.';
}

// ─── SEARCH TASK GENERATOR ──────────────────────────
function generateSearchTask(it) {
  const dest = it.destination?.split('→')[0]?.trim();
  const mode = it.paymentType === 'points' ? 'Award search' : 'Cash fare search';
  const stops = it.stopsOutbound === 0 ? 'nonstop preferred' : `${it.stopsOutbound}-stop okay`;
  return [
    `${mode}: ${it.origin} → ${dest}`,
    `Dates: ${it.outboundDate} outbound, ${it.returnDate} return`,
    `Passengers: ${it.adults || 2} adults + ${it.children || 2} children = ${it.passengerCount || 4}`,
    `Cabin: Economy`,
    `Stops: ${stops}`,
    `Max duration: ${fmtDur(it.totalDurationMinutesOutbound + 120)}`,
    it.pointsProgram ? `Program: ${it.pointsProgram}` : null,
    it.airline ? `Airline: ${it.airline}` : null,
    `Notes: ${it.notes || '—'}`
  ].filter(Boolean).join('\n');
}

// ─── OPEN-JAW SURFACE SEGMENT ───────────────────────
function getSurfaceSegment(it) {
  if (!it.routeFamily?.includes('Open-jaw')) return null;
  const dest = it.destination?.split('→')[0]?.trim();
  const retOrig = it.returnOrigin;
  if (dest === retOrig) return null;
  const transfer = TRANSFER_PLANS[retOrig] || TRANSFER_PLANS[dest];
  return {
    from: dest === 'CAN' ? 'Guangzhou' : dest,
    to: retOrig === 'HKG' ? 'Hong Kong' : retOrig,
    method: transfer?.method || 'Ground transportation',
    duration: transfer?.duration || 'Varies',
    cost: transfer?.totalEstimate || 'Varies',
    note: `Surface segment between outbound destination and return departure`
  };
}
