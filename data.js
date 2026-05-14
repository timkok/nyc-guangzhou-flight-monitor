/* ═══════════════════════════════════════════════════════
   DATA LAYER — NYC/NJ → Greater Guangzhou Flight Monitor
   All route data, configs, and mock data live here.
   Update this file when new prices appear.
   ═══════════════════════════════════════════════════════ */

const passengerConfig = {
  adults: 2,
  children: 2,
  total: 4
};

// Cents-per-point baseline valuations
const pointValues = {
  chaseUR: 0.015,   // 1.5 cpp
  amexMR: 0.013,    // 1.3 cpp
  unitedMiles: 0.012 // 1.2 cpp
};

// Fixed route adjustment costs (transfer, hotel risk, convenience)
const ADJUSTMENTS = {
  CAN: 0,
  HKG: 200,
  SZX: 150,
  PVG: 400,
  SHA: 400
};

// US departure airports
const US_AIRPORTS = [
  { code: 'EWR', name: 'Newark Liberty', area: 'NJ', primary: true },
  { code: 'JFK', name: 'John F. Kennedy', area: 'NYC', primary: true },
  { code: 'LGA', name: 'LaGuardia', area: 'NYC', primary: false },
  { code: 'PHL', name: 'Philadelphia', area: 'PA', primary: false }
];

// China/HKG destination airports
const DEST_AIRPORTS = [
  { code: 'CAN', city: 'Guangzhou', adjustment: 0, primary: true },
  { code: 'HKG', city: 'Hong Kong', adjustment: 200, primary: false },
  { code: 'SZX', city: 'Shenzhen', adjustment: 150, primary: false },
  { code: 'PVG', city: 'Shanghai Pudong', adjustment: 400, primary: false },
  { code: 'SHA', city: 'Shanghai Hongqiao', adjustment: 400, primary: false }
];

// Points programs and their transfer partners
const POINTS_PROGRAMS = {
  chaseUR: {
    name: 'Chase Ultimate Rewards',
    shortName: 'Chase UR',
    value: 0.015,
    color: '#0060f0',
    partners: ['United MileagePlus', 'Air Canada Aeroplan', 'Singapore KrisFlyer', 'British Airways Avios'],
    notes: 'Can transfer to United and Star Alliance partners. Also usable via Chase Travel portal.'
  },
  amexMR: {
    name: 'Amex Membership Rewards',
    shortName: 'Amex MR',
    value: 0.013,
    color: '#006fcf',
    partners: ['ANA Mileage Club', 'Air Canada Aeroplan', 'Cathay Pacific Asia Miles', 'Singapore KrisFlyer', 'British Airways Avios', 'Delta SkyMiles'],
    notes: 'Great for ANA, Aeroplan, and Cathay Pacific Asia Miles. Varies by routing rules.'
  },
  unitedMiles: {
    name: 'United MileagePlus',
    shortName: 'United Miles',
    value: 0.012,
    color: '#002244',
    partners: ['Star Alliance'],
    notes: 'Best when United / Star Alliance award availability exists. Watch for dynamic pricing.'
  }
};

// ─── ITINERARIES ───────────────────────────────────────
// Each entry is one bookable option. Update prices here.
const itineraries = [
  // ── CASH FARES ──
  {
    id: 'jfk-can-nonstop-cz-cash',
    routeType: 'Direct CAN',
    origin: 'JFK', destination: 'CAN',
    airline: 'China Southern',
    cashPricePerPerson: 1520,
    totalDurationHours: 16,
    stops: 0,
    program: 'cash',
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    outboundDate: '2026-07-28',
    returnDate: '2026-08-30',
    notes: 'Nonstop CZ JFK-CAN, summer peak pricing'
  },
  {
    id: 'ewr-can-1stop-ua-cash',
    routeType: 'One-stop CAN',
    origin: 'EWR', destination: 'CAN',
    airline: 'United + Star Alliance',
    cashPricePerPerson: 1280,
    totalDurationHours: 22,
    stops: 1,
    program: 'cash',
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    outboundDate: '2026-07-30',
    returnDate: '2026-08-31',
    notes: 'Via IST or DOH, reasonable timing'
  },
  {
    id: 'jfk-can-1stop-tk-cash',
    routeType: 'One-stop CAN',
    origin: 'JFK', destination: 'CAN',
    airline: 'Turkish Airlines',
    cashPricePerPerson: 1190,
    totalDurationHours: 26,
    stops: 1,
    program: 'cash',
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    outboundDate: '2026-07-29',
    returnDate: '2026-09-01',
    notes: 'Via IST, long but affordable'
  },
  {
    id: 'jfk-hkg-cx-cash',
    routeType: 'HKG Alternative',
    origin: 'JFK', destination: 'HKG',
    airline: 'Cathay Pacific',
    cashPricePerPerson: 1150,
    totalDurationHours: 16,
    stops: 0,
    program: 'cash',
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    outboundDate: '2026-07-28',
    returnDate: '2026-08-30',
    notes: 'Nonstop to HKG, then rail/van to GZ'
  },
  {
    id: 'ewr-hkg-1stop-cash',
    routeType: 'HKG Alternative',
    origin: 'EWR', destination: 'HKG',
    airline: 'United / EVA',
    cashPricePerPerson: 1080,
    totalDurationHours: 20,
    stops: 1,
    program: 'cash',
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    outboundDate: '2026-07-30',
    returnDate: '2026-09-02',
    notes: 'Via TPE, decent connection'
  },
  {
    id: 'ewr-szx-1stop-cash',
    routeType: 'SZX Alternative',
    origin: 'EWR', destination: 'SZX',
    airline: 'Shenzhen Airlines',
    cashPricePerPerson: 1100,
    totalDurationHours: 22,
    stops: 1,
    program: 'cash',
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    outboundDate: '2026-07-29',
    returnDate: '2026-09-01',
    notes: 'Via PEK, then to SZX'
  },
  {
    id: 'jfk-pvg-1stop-cash',
    routeType: 'PVG/SHA Alternative',
    origin: 'JFK', destination: 'PVG',
    airline: 'China Eastern',
    cashPricePerPerson: 950,
    totalDurationHours: 18,
    stops: 0,
    program: 'cash',
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    outboundDate: '2026-07-28',
    returnDate: '2026-08-31',
    notes: 'Good cash price, but need domestic CAN transfer'
  },
  // ── OPEN-JAW ──
  {
    id: 'openjaw-can-out-hkg-return-cash',
    routeType: 'Open-jaw CAN/HKG',
    origin: 'JFK', destination: 'CAN→HKG',
    airline: 'Mixed carriers',
    cashPricePerPerson: 1350,
    totalDurationHours: 17,
    stops: 0,
    program: 'cash',
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    outboundDate: '2026-07-28',
    returnDate: '2026-09-01',
    notes: 'Fly into CAN, return from HKG. Best of both worlds.'
  },
  {
    id: 'openjaw-hkg-out-can-return-cash',
    routeType: 'Open-jaw HKG/CAN',
    origin: 'JFK', destination: 'HKG→CAN',
    airline: 'Cathay + China Southern',
    cashPricePerPerson: 1380,
    totalDurationHours: 16,
    stops: 0,
    program: 'cash',
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    outboundDate: '2026-07-29',
    returnDate: '2026-08-30',
    notes: 'Fly into HKG, return from CAN.'
  },

  // ── AWARD FARES ──
  {
    id: 'ewr-hkg-united-award',
    routeType: 'HKG Alternative',
    origin: 'EWR', destination: 'HKG',
    airline: 'United / Star Alliance',
    cashPricePerPerson: null,
    totalDurationHours: 16,
    stops: 0,
    program: 'United MileagePlus',
    pointsPerPerson: 55000,
    taxesPerPerson: 85,
    awardSeatsAvailable: 4,
    familyBookable: true,
    outboundDate: '2026-07-28',
    returnDate: '2026-08-30',
    notes: 'Saver award, 4 seats confirmed available'
  },
  {
    id: 'jfk-can-united-award',
    routeType: 'Direct CAN',
    origin: 'JFK', destination: 'CAN',
    airline: 'United / Star Alliance',
    cashPricePerPerson: null,
    totalDurationHours: 22,
    stops: 1,
    program: 'United MileagePlus',
    pointsPerPerson: 70000,
    taxesPerPerson: 95,
    awardSeatsAvailable: 2,
    familyBookable: false,
    outboundDate: '2026-07-30',
    returnDate: '2026-09-01',
    notes: 'Only 2 saver seats, dynamic pricing for remaining'
  },
  {
    id: 'jfk-hkg-cathay-amex-award',
    routeType: 'HKG Alternative',
    origin: 'JFK', destination: 'HKG',
    airline: 'Cathay Pacific',
    cashPricePerPerson: null,
    totalDurationHours: 16,
    stops: 0,
    program: 'Amex MR → Asia Miles',
    pointsPerPerson: 60000,
    taxesPerPerson: 120,
    awardSeatsAvailable: 3,
    familyBookable: false,
    outboundDate: '2026-07-28',
    returnDate: '2026-08-30',
    notes: 'Only 3 award seats available, need 4'
  },
  {
    id: 'jfk-pvg-ana-amex-award',
    routeType: 'PVG/SHA Alternative',
    origin: 'JFK', destination: 'PVG',
    airline: 'ANA / Star Alliance',
    cashPricePerPerson: null,
    totalDurationHours: 20,
    stops: 1,
    program: 'Amex MR → ANA',
    pointsPerPerson: 45000,
    taxesPerPerson: 60,
    awardSeatsAvailable: 4,
    familyBookable: true,
    outboundDate: '2026-07-29',
    returnDate: '2026-09-01',
    notes: '4 seats via ANA, good redemption but need GZ transfer'
  },
  {
    id: 'ewr-can-aeroplan-chase-award',
    routeType: 'One-stop CAN',
    origin: 'EWR', destination: 'CAN',
    airline: 'Air Canada / Star Alliance',
    cashPricePerPerson: null,
    totalDurationHours: 24,
    stops: 1,
    program: 'Chase UR → Aeroplan',
    pointsPerPerson: 50000,
    taxesPerPerson: 110,
    awardSeatsAvailable: 4,
    familyBookable: true,
    outboundDate: '2026-07-30',
    returnDate: '2026-08-31',
    notes: 'Via YVR, 4 seats available, long but bookable'
  }
];

// ─── MIXED STRATEGIES ──────────────────────────────────
const mixedStrategies = [
  {
    id: 'mixed-2cash-2award-hkg',
    name: '2 Cash + 2 Award to HKG',
    description: '2 passengers on Cathay Pacific cash, 2 on Asia Miles award',
    cashPassengers: 2,
    awardPassengers: 2,
    cashItineraryId: 'jfk-hkg-cx-cash',
    awardItineraryId: 'jfk-hkg-cathay-amex-award',
    cashPerPerson: 1150,
    pointsPerPerson: 60000,
    taxesPerAwardPerson: 120,
    totalCashOutlay: 2 * 1150 + 2 * 120,
    totalPointsUsed: 2 * 60000,
    program: 'Amex MR → Asia Miles',
    pros: ['Lower total cash outlay', 'Good CPP on award portion', 'Nonstop flight for all'],
    cons: ['Separate PNRs for cash vs award', 'Only 3 award seats available'],
    complexity: 'Medium'
  },
  {
    id: 'mixed-outbound-points-return-cash',
    name: 'Outbound Award + Return Cash',
    description: 'Fly outbound on United award to HKG, return on cash from CAN',
    cashPassengers: 4,
    awardPassengers: 4,
    direction: 'split',
    outboundProgram: 'United MileagePlus',
    returnProgram: 'cash',
    outboundPointsPerPerson: 35000,
    outboundTaxesPerPerson: 50,
    returnCashPerPerson: 680,
    totalCashOutlay: 4 * 680 + 4 * 50,
    totalPointsUsed: 4 * 35000,
    program: 'United Miles + Cash',
    pros: ['Splits cost between points and cash', 'Good use of United miles', 'Open-jaw flexibility'],
    cons: ['Separate bookings for each direction', 'Need to manage two reservations'],
    complexity: 'Medium'
  },
  {
    id: 'mixed-adults-cash-kids-award',
    name: 'Adults Cash + Kids Award',
    description: 'Adults on cash fare, children on award tickets',
    cashPassengers: 2,
    awardPassengers: 2,
    cashPerPerson: 1280,
    pointsPerPerson: 50000,
    taxesPerAwardPerson: 110,
    totalCashOutlay: 2 * 1280 + 2 * 110,
    totalPointsUsed: 2 * 50000,
    program: 'Chase UR → Aeroplan',
    pros: ['Adults earn miles on cash tickets', 'Kids use points effectively', 'Same flights possible'],
    cons: ['Separate PNRs', 'If schedule changes, two bookings to manage'],
    complexity: 'Medium'
  }
];

// ─── DATE HEATMAP MOCK DATA ───────────────────────────
// Rows: outbound dates (Jul 25 – Aug 8)
// Cols: return dates (Aug 25 – Sep 8)
const heatmapOutboundDates = [];
for (let d = 25; d <= 31; d++) heatmapOutboundDates.push(`Jul ${d}`);
for (let d = 1; d <= 8; d++) heatmapOutboundDates.push(`Aug ${d}`);

const heatmapReturnDates = [];
for (let d = 25; d <= 31; d++) heatmapReturnDates.push(`Aug ${d}`);
for (let d = 1; d <= 8; d++) heatmapReturnDates.push(`Sep ${d}`);

// Mock price data: [price, routeType, recommendation]
// recommendation: 'buy' | 'strong' | 'watch' | 'avoid'
function generateHeatmapData() {
  const data = [];
  const basePrice = 1200;
  for (let i = 0; i < heatmapOutboundDates.length; i++) {
    const row = [];
    for (let j = 0; j < heatmapReturnDates.length; j++) {
      // Simulate pricing patterns
      const weekendPenalty = (i % 7 === 0 || i % 7 === 6) ? 150 : 0;
      const returnWeekendPenalty = (j % 7 === 0 || j % 7 === 6) ? 100 : 0;
      const earlyAugPenalty = (i >= 7) ? 200 : 0;
      const laborDayPenalty = (j >= 7) ? -80 : 0; // After Labor Day is cheaper
      const randomVariation = Math.floor(Math.random() * 200) - 100;
      const price = basePrice + weekendPenalty + returnWeekendPenalty + earlyAugPenalty + laborDayPenalty + randomVariation;

      let rec = 'watch';
      let routeType = 'CAN 1-stop';
      if (price < 1200) { rec = 'buy'; routeType = 'CAN 1-stop'; }
      else if (price < 1350) { rec = 'strong'; }
      else if (price < 1500) { rec = 'watch'; }
      else { rec = 'avoid'; routeType = 'CAN nonstop'; }

      // Some cells are alt-airport deals
      if (price > 1400 && Math.random() > 0.6) {
        routeType = 'HKG alt';
        rec = 'alt';
      }

      row.push({ price, routeType, rec });
    }
    data.push(row);
  }
  return data;
}

const heatmapData = generateHeatmapData();

// ─── SEARCH LINK GENERATORS ──────────────────────────
const SEARCH_LINKS = {
  googleFlights: (origin, dest, outDate, retDate) =>
    `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+on+${outDate}+return+${retDate}`,
  united: (origin, dest) =>
    `https://www.united.com/en/us/fsr/choose-flights?f=${origin}&t=${dest}&d=2026-07-28&r=2026-08-30&px=4`,
  chaseTravel: () => 'https://ultimaterewardspoints.chase.com/travel',
  amexTravel: () => 'https://travel.americanexpress.com/flights',
  aeroplan: (origin, dest) =>
    `https://www.aircanada.com/aeroplan/redeem/availability/outbound?org0=${origin}&dest0=${dest}&departureDate0=2026-07-28`,
  cathayAsiaMiles: () => 'https://www.cathaypacific.com/cx/en_US/redeem-miles/flights.html',
  ana: () => 'https://www.ana.co.jp/en/us/amc/reference/tukau/award/int/usage.html',
  skyscanner: (origin, dest) =>
    `https://www.skyscanner.com/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/`,
  kayak: (origin, dest) =>
    `https://www.kayak.com/flights/${origin}-${dest}/2026-07-28/2026-08-30/4adults`
};

function getSearchLinksForItinerary(it) {
  const links = [
    { name: 'Google Flights', url: SEARCH_LINKS.googleFlights(it.origin, it.destination.split('→')[0], it.outboundDate, it.returnDate), icon: '🔍' }
  ];
  const prog = (it.program || '').toLowerCase();
  if (prog.includes('united') || prog === 'cash') {
    links.push({ name: 'United', url: SEARCH_LINKS.united(it.origin, it.destination.split('→')[0]), icon: '✈️' });
  }
  if (prog.includes('chase') || prog.includes('aeroplan')) {
    links.push({ name: 'Chase Travel', url: SEARCH_LINKS.chaseTravel(), icon: '💳' });
    links.push({ name: 'Aeroplan', url: SEARCH_LINKS.aeroplan(it.origin, it.destination.split('→')[0]), icon: '🍁' });
  }
  if (prog.includes('amex') || prog.includes('ana') || prog.includes('asia')) {
    links.push({ name: 'Amex Travel', url: SEARCH_LINKS.amexTravel(), icon: '💎' });
  }
  if (prog.includes('ana') || prog.includes('amex')) {
    links.push({ name: 'ANA', url: SEARCH_LINKS.ana(), icon: '🇯🇵' });
  }
  if (prog.includes('cathay') || prog.includes('asia') || it.destination.includes('HKG')) {
    links.push({ name: 'Cathay Asia Miles', url: SEARCH_LINKS.cathayAsiaMiles(), icon: '🐉' });
  }
  if (prog === 'cash') {
    links.push({ name: 'Skyscanner', url: SEARCH_LINKS.skyscanner(it.origin, it.destination.split('→')[0]), icon: '🌐' });
  }
  return links;
}

// ─── PRICE HISTORY (per itinerary, stored in localStorage) ───
function getPriceHistory(itId) {
  try {
    const all = JSON.parse(localStorage.getItem('priceHistory') || '{}');
    return all[itId] || [];
  } catch { return []; }
}

function addPriceEntry(itId, price) {
  try {
    const all = JSON.parse(localStorage.getItem('priceHistory') || '{}');
    if (!all[itId]) all[itId] = [];
    all[itId].push({ price, date: new Date().toISOString().slice(0, 10) });
    // Keep last 60 entries
    if (all[itId].length > 60) all[itId] = all[itId].slice(-60);
    localStorage.setItem('priceHistory', JSON.stringify(all));
  } catch {}
}

function getPriceStats(itId) {
  const hist = getPriceHistory(itId);
  if (hist.length === 0) return null;
  const now = new Date();
  const prices = hist.map(h => h.price);
  const last7 = hist.filter(h => (now - new Date(h.date)) / 86400000 <= 7).map(h => h.price);
  const last14 = hist.filter(h => (now - new Date(h.date)) / 86400000 <= 14).map(h => h.price);
  const last30 = hist.filter(h => (now - new Date(h.date)) / 86400000 <= 30).map(h => h.price);
  const current = prices[prices.length - 1];
  const prev = prices.length >= 2 ? prices[prices.length - 2] : current;
  const change = current - prev;
  let trend = 'stable';
  if (change < -30) trend = 'dropping';
  else if (change > 30) trend = 'rising';
  return {
    current,
    low7d: last7.length ? Math.min(...last7) : null,
    low14d: last14.length ? Math.min(...last14) : null,
    low30d: last30.length ? Math.min(...last30) : null,
    change,
    trend,
    history: prices.slice(-14)
  };
}

// ─── RISK FACTORS ────────────────────────────────────
const RISK_FACTORS = [
  { id: 'separate_tickets', label: 'Separate tickets', weight: 'High', applies: it => it.routeType.includes('Open-jaw') || (it.program !== 'cash' && it.notes && it.notes.includes('separate')) },
  { id: 'mixed_pnr', label: 'Mixed PNR', weight: 'Medium', applies: it => it.program !== 'cash' },
  { id: 'tight_connection', label: 'Tight connection', weight: 'High', applies: it => it.stops >= 1 && it.totalDurationHours < 20 && it.stops >= 1 },
  { id: 'overnight_layover', label: 'Overnight layover', weight: 'Medium', applies: it => it.totalDurationHours > 24 },
  { id: 'late_arrival', label: 'Late arrival risk', weight: 'Low', applies: it => it.totalDurationHours > 20 },
  { id: 'domestic_addon', label: 'Domestic add-on flight', weight: 'Medium', applies: it => it.destination === 'PVG' || it.destination === 'SHA' },
  { id: 'airport_transfer', label: 'Airport transfer needed', weight: 'Low', applies: it => it.destination !== 'CAN' && !it.destination.includes('CAN') },
  { id: 'few_award_seats', label: 'Fewer than 4 award seats', weight: 'High', applies: it => it.awardSeatsAvailable !== null && it.awardSeatsAvailable < 4 }
];

function getRiskFactors(itinerary) {
  return RISK_FACTORS.filter(rf => rf.applies(itinerary));
}

function getRiskLevel(risks) {
  if (risks.some(r => r.weight === 'High')) return { level: 'High', class: 'avoid' };
  if (risks.some(r => r.weight === 'Medium')) return { level: 'Medium', class: 'watch' };
  if (risks.length > 0) return { level: 'Low', class: 'strong' };
  return { level: 'Low', class: 'buy' };
}

// ─── SETTINGS (localStorage) ─────────────────────────
const DEFAULT_SETTINGS = {
  passengers: { adults: 2, children: 2, total: 4 },
  pointValues: { chaseUR: 0.015, amexMR: 0.013, unitedMiles: 0.012 },
  thresholds: {
    buyNonstopCAN: 1500,
    buy1stopCAN: 1250,
    strongLowCAN: 1250,
    strongHighCAN: 1350,
    watchLowCAN: 1350,
    watchHighCAN: 1500,
    nonstopStrongLow: 1500,
    nonstopStrongHigh: 1650,
    hkgMinSavings: 150,
    hkgStrongSavings: 200,
    hkgBuySavings: 250,
    pvgMinSavings: 400,
    pvgStrongSavings: 400,
    maxDuration: 32,
    minCPP: 1.2,
    goodCPP: 1.5,
    excellentCPP: 1.8,
    requiredAwardSeats: 4
  },
  adjustments: { CAN: 0, HKG: 200, SZX: 150, PVG: 400, SHA: 400 }
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('flightSettings'));
    if (saved) return { ...DEFAULT_SETTINGS, ...saved };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  localStorage.setItem('flightSettings', JSON.stringify(settings));
}

// ─── HARD-NO RULES ───────────────────────────────────
const HARD_NO_RULES = [
  { id: 'max_duration', test: it => it.totalDurationHours > 32, reason: 'Total duration > 32h' },
  { id: 'multi_stop_kids', test: it => it.stops >= 2, reason: '2+ stops with children' },
  { id: 'hkg_low_savings', test: it => {
    if (it.destination !== 'HKG') return false;
    const savings = calculateSavingsVsCAN(it);
    return savings !== null && savings < 150;
  }, reason: 'HKG saves < $150 vs CAN' },
  { id: 'pvg_low_savings', test: it => {
    if (it.destination !== 'PVG' && it.destination !== 'SHA') return false;
    const savings = calculateSavingsVsCAN(it);
    return savings !== null && savings < 400;
  }, reason: 'PVG/SHA saves < $400 vs CAN' },
  { id: 'separate_same_day', test: it => it.sameTicket === false && it.sameDayInternationalConnection === true, reason: 'Separate tickets with same-day international connection' },
  { id: 'overnight_with_children', test: it => it.riskChips && it.riskChips.some(r => /overnight/i.test(r)), reason: 'Overnight airport stay with children' },
  { id: 'basic_economy_unclear_seats', test: it => /basic/i.test(it.fareBrand || '') && !it.seatSelectionConfirmed, reason: 'Basic Economy without seat selection clarity' },
  { id: 'few_award_no_mixed', test: it => {
    if (it.program === 'cash') return false;
    return it.awardSeatsAvailable !== null && it.awardSeatsAvailable < 4;
  }, reason: 'Fewer than 4 award seats (consider mixed)' },
  { id: 'low_cpp', test: it => {
    if (!it.pointsPerPerson) return false;
    const cpp = calculateCPP(it);
    return cpp !== null && cpp < 1.2;
  }, reason: 'CPP < 1.2 — use cash instead' }
];

function checkHardNos(itinerary) {
  return HARD_NO_RULES.filter(rule => rule.test(itinerary));
}

// ─── ALERT RULE TEMPLATES ────────────────────────────
const ALERT_RULES = [
  { label: 'JFK–CAN nonstop < $1,500', condition: 'JFK-CAN nonstop cashPricePerPerson < 1500' },
  { label: 'NYC–CAN 1-stop < $1,250 and < 24h', condition: 'CAN 1-stop cashPricePerPerson < 1250 AND totalDurationHours < 24' },
  { label: 'HKG adjusted saves $250+', condition: 'HKG adjustedSavingsVsCAN >= 250' },
  { label: 'United award ≥ 4 seats and cpp ≥ 1.5', condition: 'United awardSeatsAvailable >= 4 AND cpp >= 1.5' },
  { label: 'Open-jaw total for 4 < $5,200', condition: 'Open-jaw cashTotal < 5200' },
  { label: 'Any CAN route < $1,200/pp', condition: 'CAN cashPricePerPerson < 1200' },
  { label: 'HKG nonstop < $1,000/pp', condition: 'HKG nonstop cashPricePerPerson < 1000' }
];

// ─── BOOKING CHECKLIST ──────────────────────────────
const BOOKING_CHECKLIST = [
  { id: 'total_price', label: 'Total price for all 4 passengers confirmed', checked: false },
  { id: 'baggage', label: 'Checked baggage included or priced', checked: false },
  { id: 'cancel_policy', label: 'Cancellation/change policy reviewed', checked: false },
  { id: 'all_seats', label: 'All 4 seats confirmed on same flights', checked: false },
  { id: 'layover', label: 'Layover duration and airport reviewed', checked: false },
  { id: 'arrival_time', label: 'Arrival time at destination checked', checked: false },
  { id: 'transfer_plan', label: 'Ground transfer plan to Guangzhou confirmed', checked: false },
  { id: 'direct_price', label: 'Compared with airline direct price', checked: false },
  { id: 'cc_protection', label: 'Credit card travel protection applies', checked: false },
  { id: 'screenshot', label: 'Screenshot of fare saved', checked: false }
];

// ─── MANUAL DATA / LOCALSTORAGE ──────────────────────
function getCustomItineraries() {
  try {
    return JSON.parse(localStorage.getItem('customItineraries') || '[]');
  } catch { return []; }
}

function saveCustomItineraries(list) {
  localStorage.setItem('customItineraries', JSON.stringify(list));
}

function addCustomItinerary(it) {
  const list = getCustomItineraries();
  it.id = it.id || 'custom-' + Date.now();
  it.isCustom = true;
  list.push(it);
  saveCustomItineraries(list);
  return it;
}

function deleteCustomItinerary(id) {
  const list = getCustomItineraries().filter(it => it.id !== id);
  saveCustomItineraries(list);
}

function getAllItineraries() {
  return [...itineraries, ...getCustomItineraries()];
}

function exportData() {
  const data = {
    itineraries: getCustomItineraries(),
    settings: loadSettings(),
    priceHistory: JSON.parse(localStorage.getItem('priceHistory') || '{}'),
    exportDate: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
}

function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.itineraries) saveCustomItineraries(data.itineraries);
    if (data.settings) saveSettings(data.settings);
    if (data.priceHistory) localStorage.setItem('priceHistory', JSON.stringify(data.priceHistory));
    return true;
  } catch { return false; }
}

// ─── FAMILY DECISION SCORE (0-100) ──────────────────
function getFamilyDecisionScore(enrichedIt) {
  let score = 0;
  // Convenience 35%
  const famScore = enrichedIt.familyScore || 5;
  score += (famScore / 10) * 35;
  // Total cost 30% (lower is better, scale 0-30 where $800/pp=30, $2000/pp=0)
  const pp = enrichedIt.adjustedPerPerson || enrichedIt.cashPricePerPerson || 1500;
  const costScore = Math.max(0, Math.min(30, (2000 - pp) / 1200 * 30));
  score += costScore;
  // Points value 20%
  if (enrichedIt.cpp && enrichedIt.cpp >= 1.5) score += 20;
  else if (enrichedIt.cpp && enrichedIt.cpp >= 1.2) score += 12;
  else if (enrichedIt.program === 'cash') score += 14; // Cash is neutral
  else score += 5;
  // Schedule 10%
  const dur = enrichedIt.totalDurationHours || 24;
  if (dur <= 16) score += 10;
  else if (dur <= 20) score += 8;
  else if (dur <= 24) score += 5;
  else score += 2;
  // Airport preference 5%
  if (enrichedIt.origin === 'JFK' || enrichedIt.origin === 'EWR') score += 5;
  else score += 2;
  return Math.round(Math.min(100, Math.max(0, score)));
}

// ─── ROUTE GROUPS ────────────────────────────────────
const ROUTE_GROUPS = [
  { id: 'direct-can', label: 'Direct CAN', filter: it => it.routeType === 'Direct CAN' && it.program === 'cash' },
  { id: '1stop-can', label: 'One-stop CAN', filter: it => it.routeType === 'One-stop CAN' && it.program === 'cash' },
  { id: 'hkg-alt', label: 'HKG Alternative', filter: it => it.routeType === 'HKG Alternative' && it.program === 'cash' },
  { id: 'szx-alt', label: 'SZX Alternative', filter: it => it.routeType === 'SZX Alternative' && it.program === 'cash' },
  { id: 'pvg-alt', label: 'Shanghai Backup', filter: it => it.routeType === 'PVG/SHA Alternative' && it.program === 'cash' },
  { id: 'open-jaw', label: 'Open-jaw', filter: it => it.routeType.includes('Open-jaw') },
  { id: 'points', label: 'Points Awards', filter: it => it.program !== 'cash' },
  { id: 'mixed', label: 'Mixed Strategy', filter: () => false } // Mixed handled separately
];
