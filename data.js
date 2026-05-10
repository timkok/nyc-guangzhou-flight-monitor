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
