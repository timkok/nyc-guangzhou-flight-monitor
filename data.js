/* ═══════════════════════════════════════════════════════
   DATA LAYER — NYC/NJ → Greater Guangzhou Flight Monitor
   All route data, configs, and local data live here.
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

// ─── MASTER ITINERARIES ─────────────────────────────────
const itineraries = [
  {
    id: 'jfk-can-cz328',
    title: 'JFK→CAN Nonstop CZ',
    routeFamily: 'Direct CAN',
    paymentType: 'cash',
    origin: 'JFK', destination: 'CAN',
    returnOrigin: 'CAN', returnDestination: 'JFK',
    airline: 'China Southern',
    alliance: 'SkyTeam',
    cashPricePerPerson: 1520,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: '$200 fee',
    cancellationPolicy: 'Non-refundable',
    outboundDate: '2026-07-28',
    returnDate: '2026-08-30',
    totalDurationMinutesOutbound: 950,
    totalDurationMinutesReturn: 960,
    stopsOutbound: 0,
    stopsReturn: 0,
    arrivalAirportType: 'CAN',
    groundTransferMinutes: 0,
    groundTransferCost: 0,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Google Flights',
    notes: 'Best nonstop option to CAN. Summer peak pricing.',
    links: { googleFlights: 'https://www.google.com/travel/flights?q=JFK+to+CAN+July+28', airlineDirect: 'https://www.csair.com/us/en/' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'CZ', flightNumber: 'CZ600', aircraft: '777-300ER', cabin: 'Economy', origin: 'JFK', destination: 'CAN', departureTime: '01:45', arrivalTime: '05:35+1', durationMinutes: 950, layoverAfterMinutes: 0, bookingClass: 'L' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'CZ', flightNumber: 'CZ399', aircraft: '777-300ER', cabin: 'Economy', origin: 'CAN', destination: 'JFK', departureTime: '20:00', arrivalTime: '22:00', durationMinutes: 960, layoverAfterMinutes: 0, bookingClass: 'L' }
    ]
  },
  {
    id: 'ewr-can-tk-ist',
    title: 'EWR→IST→CAN Turkish',
    routeFamily: 'One-stop CAN',
    paymentType: 'cash',
    origin: 'EWR', destination: 'CAN',
    returnOrigin: 'CAN', returnDestination: 'EWR',
    airline: 'Turkish Airlines',
    alliance: 'Star Alliance',
    cashPricePerPerson: 1190,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: '$150 fee',
    cancellationPolicy: 'Non-refundable',
    outboundDate: '2026-07-29',
    returnDate: '2026-09-01',
    totalDurationMinutesOutbound: 1560,
    totalDurationMinutesReturn: 1500,
    stopsOutbound: 1,
    stopsReturn: 1,
    arrivalAirportType: 'CAN',
    groundTransferMinutes: 0,
    groundTransferCost: 0,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Google Flights',
    notes: 'Affordable but long. IST layover is comfortable.',
    links: { googleFlights: 'https://www.google.com/travel/flights?q=EWR+to+CAN+July+29', airlineDirect: 'https://www.turkishairlines.com/' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'TK', flightNumber: 'TK30', aircraft: '777-300ER', cabin: 'Economy', origin: 'EWR', destination: 'IST', departureTime: '22:30', arrivalTime: '16:30+1', durationMinutes: 630, layoverAfterMinutes: 195, bookingClass: 'T' },
      { segmentNumber: 2, marketingAirline: 'TK', flightNumber: 'TK72', aircraft: 'A330', cabin: 'Economy', origin: 'IST', destination: 'CAN', departureTime: '19:45', arrivalTime: '11:00+1', durationMinutes: 600, layoverAfterMinutes: 0, bookingClass: 'T' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'TK', flightNumber: 'TK73', aircraft: 'A330', cabin: 'Economy', origin: 'CAN', destination: 'IST', departureTime: '12:30', arrivalTime: '19:00', durationMinutes: 720, layoverAfterMinutes: 150, bookingClass: 'T' },
      { segmentNumber: 2, marketingAirline: 'TK', flightNumber: 'TK29', aircraft: '777-300ER', cabin: 'Economy', origin: 'IST', destination: 'EWR', departureTime: '21:30', arrivalTime: '01:30+1', durationMinutes: 630, layoverAfterMinutes: 0, bookingClass: 'T' }
    ]
  },
  {
    id: 'jfk-can-1stop-tk-cash',
    title: 'JFK→IST→CAN Turkish',
    routeFamily: 'One-stop CAN',
    paymentType: 'cash',
    origin: 'JFK', destination: 'CAN',
    returnOrigin: 'CAN', returnDestination: 'JFK',
    airline: 'Turkish Airlines',
    alliance: 'Star Alliance',
    cashPricePerPerson: 1190,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: '$150 fee',
    cancellationPolicy: 'Non-refundable',
    outboundDate: '2026-07-28',
    returnDate: '2026-09-01',
    totalDurationMinutesOutbound: 1590,
    totalDurationMinutesReturn: 1530,
    stopsOutbound: 1,
    stopsReturn: 1,
    arrivalAirportType: 'CAN',
    groundTransferMinutes: 0,
    groundTransferCost: 0,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Google Flights',
    notes: 'JFK alternative on Turkish. IST layover is 3h outbound, very secure.',
    links: { googleFlights: 'https://www.google.com/travel/flights?q=JFK+to+CAN+July+28', airlineDirect: 'https://www.turkishairlines.com/' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'TK', flightNumber: 'TK4', aircraft: '777-300ER', cabin: 'Economy', origin: 'JFK', destination: 'IST', departureTime: '13:00', arrivalTime: '06:00+1', durationMinutes: 600, layoverAfterMinutes: 390, bookingClass: 'T' },
      { segmentNumber: 2, marketingAirline: 'TK', flightNumber: 'TK72', aircraft: 'A330', cabin: 'Economy', origin: 'IST', destination: 'CAN', departureTime: '19:45', arrivalTime: '11:00+1', durationMinutes: 600, layoverAfterMinutes: 0, bookingClass: 'T' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'TK', flightNumber: 'TK73', aircraft: 'A330', cabin: 'Economy', origin: 'CAN', destination: 'IST', departureTime: '12:30', arrivalTime: '19:00', durationMinutes: 720, layoverAfterMinutes: 180, bookingClass: 'T' },
      { segmentNumber: 2, marketingAirline: 'TK', flightNumber: 'TK3', aircraft: '777-300ER', cabin: 'Economy', origin: 'IST', destination: 'JFK', departureTime: '22:00', arrivalTime: '02:10+1', durationMinutes: 630, layoverAfterMinutes: 0, bookingClass: 'T' }
    ]
  },
  {
    id: 'ewr-can-1stop-ua-cash',
    title: 'EWR→HND→CAN United/ANA',
    routeFamily: 'One-stop CAN',
    paymentType: 'cash',
    origin: 'EWR', destination: 'CAN',
    returnOrigin: 'CAN', returnDestination: 'EWR',
    airline: 'United + ANA',
    alliance: 'Star Alliance',
    cashPricePerPerson: 1280,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: '$100 fee',
    cancellationPolicy: 'Non-refundable',
    outboundDate: '2026-07-30',
    returnDate: '2026-08-31',
    totalDurationMinutesOutbound: 1320,
    totalDurationMinutesReturn: 1290,
    stopsOutbound: 1,
    stopsReturn: 1,
    arrivalAirportType: 'CAN',
    groundTransferMinutes: 0,
    groundTransferCost: 0,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-18',
    dataSource: 'Google Flights',
    notes: 'Via Tokyo Haneda. Fast connection and great onboard service on ANA leg.',
    links: { googleFlights: 'https://www.google.com/travel/flights', airlineDirect: 'https://www.united.com/' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'UA', flightNumber: 'UA79', aircraft: '777-200ER', cabin: 'Economy', origin: 'EWR', destination: 'HND', departureTime: '12:00', arrivalTime: '15:00+1', durationMinutes: 840, layoverAfterMinutes: 180, bookingClass: 'K' },
      { segmentNumber: 2, marketingAirline: 'NH', flightNumber: 'NH925', aircraft: '787-9', cabin: 'Economy', origin: 'HND', destination: 'CAN', departureTime: '18:00', arrivalTime: '21:30', durationMinutes: 300, layoverAfterMinutes: 0, bookingClass: 'K' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'NH', flightNumber: 'NH926', aircraft: '787-9', cabin: 'Economy', origin: 'CAN', destination: 'HND', departureTime: '13:00', arrivalTime: '18:15', durationMinutes: 255, layoverAfterMinutes: 195, bookingClass: 'K' },
      { segmentNumber: 2, marketingAirline: 'UA', flightNumber: 'UA130', aircraft: '777-200ER', cabin: 'Economy', origin: 'HND', destination: 'EWR', departureTime: '21:30', arrivalTime: '21:45', durationMinutes: 840, layoverAfterMinutes: 0, bookingClass: 'K' }
    ]
  },
  {
    id: 'jfk-hkg-cx-nonstop',
    title: 'JFK→HKG Nonstop Cathay',
    routeFamily: 'HKG Alternative',
    paymentType: 'cash',
    origin: 'JFK', destination: 'HKG',
    returnOrigin: 'HKG', returnDestination: 'JFK',
    airline: 'Cathay Pacific',
    alliance: 'Oneworld',
    cashPricePerPerson: 1150,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: '$150 fee',
    cancellationPolicy: 'Non-refundable',
    outboundDate: '2026-07-28',
    returnDate: '2026-08-30',
    totalDurationMinutesOutbound: 960,
    totalDurationMinutesReturn: 975,
    stopsOutbound: 0,
    stopsReturn: 0,
    arrivalAirportType: 'HKG',
    groundTransferMinutes: 90,
    groundTransferCost: 40,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Google Flights',
    notes: 'Nonstop to HKG, then high-speed rail to Guangzhou. Saves money & time.',
    links: { googleFlights: 'https://www.google.com/travel/flights?q=JFK+to+HKG+July+28', airlineDirect: 'https://www.cathaypacific.com/cx/en_US.html' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'CX', flightNumber: 'CX845', aircraft: 'A350-1000', cabin: 'Economy', origin: 'JFK', destination: 'HKG', departureTime: '00:30', arrivalTime: '05:30+1', durationMinutes: 960, layoverAfterMinutes: 0, bookingClass: 'N' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'CX', flightNumber: 'CX846', aircraft: 'A350-1000', cabin: 'Economy', origin: 'HKG', destination: 'JFK', departureTime: '18:00', arrivalTime: '21:15', durationMinutes: 975, layoverAfterMinutes: 0, bookingClass: 'N' }
    ]
  },
  {
    id: 'ewr-hkg-br-tpe',
    title: 'EWR→TPE→HKG EVA Air',
    routeFamily: 'HKG Alternative',
    paymentType: 'cash',
    origin: 'EWR', destination: 'HKG',
    returnOrigin: 'HKG', returnDestination: 'EWR',
    airline: 'EVA Air',
    alliance: 'Star Alliance',
    cashPricePerPerson: 1080,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: '$150 fee',
    cancellationPolicy: 'Non-refundable',
    outboundDate: '2026-07-30',
    returnDate: '2026-09-02',
    totalDurationMinutesOutbound: 1200,
    totalDurationMinutesReturn: 1230,
    stopsOutbound: 1,
    stopsReturn: 1,
    arrivalAirportType: 'HKG',
    groundTransferMinutes: 90,
    groundTransferCost: 40,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Google Flights',
    notes: 'Via TPE. Good connection, EVA is a top family-friendly airline.',
    links: { googleFlights: 'https://www.google.com/travel/flights?q=EWR+to+HKG+July+30', airlineDirect: 'https://www.evaair.com/' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'BR', flightNumber: 'BR31', aircraft: '777-300ER', cabin: 'Economy', origin: 'EWR', destination: 'TPE', departureTime: '00:05', arrivalTime: '05:45+1', durationMinutes: 900, layoverAfterMinutes: 135, bookingClass: 'K' },
      { segmentNumber: 2, marketingAirline: 'BR', flightNumber: 'BR857', aircraft: 'A321', cabin: 'Economy', origin: 'TPE', destination: 'HKG', departureTime: '08:00', arrivalTime: '09:55', durationMinutes: 115, layoverAfterMinutes: 0, bookingClass: 'K' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'BR', flightNumber: 'BR856', aircraft: 'A321', cabin: 'Economy', origin: 'HKG', destination: 'TPE', departureTime: '11:00', arrivalTime: '12:50', durationMinutes: 110, layoverAfterMinutes: 190, bookingClass: 'K' },
      { segmentNumber: 2, marketingAirline: 'BR', flightNumber: 'BR32', aircraft: '777-300ER', cabin: 'Economy', origin: 'TPE', destination: 'EWR', departureTime: '16:00', arrivalTime: '19:30', durationMinutes: 930, layoverAfterMinutes: 0, bookingClass: 'K' }
    ]
  },
  {
    id: 'ewr-szx-zh-1stop',
    title: 'EWR→PEK→SZX Air China',
    routeFamily: 'SZX Alternative',
    paymentType: 'cash',
    origin: 'EWR', destination: 'SZX',
    returnOrigin: 'SZX', returnDestination: 'EWR',
    airline: 'Air China + Shenzhen',
    alliance: 'Star Alliance',
    cashPricePerPerson: 1100,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: '$150 fee',
    cancellationPolicy: 'Non-refundable',
    outboundDate: '2026-07-29',
    returnDate: '2026-09-01',
    totalDurationMinutesOutbound: 1320,
    totalDurationMinutesReturn: 1350,
    stopsOutbound: 1,
    stopsReturn: 1,
    arrivalAirportType: 'SZX',
    groundTransferMinutes: 60,
    groundTransferCost: 20,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Google Flights',
    notes: 'Via PEK. Connects into SZX, which is very close to Guangzhou by road/rail.',
    links: { googleFlights: 'https://www.google.com/travel/flights', airlineDirect: 'https://www.airchina.us/' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'CA', flightNumber: 'CA820', aircraft: '777-300ER', cabin: 'Economy', origin: 'EWR', destination: 'PEK', departureTime: '13:00', arrivalTime: '16:00+1', durationMinutes: 840, layoverAfterMinutes: 180, bookingClass: 'L' },
      { segmentNumber: 2, marketingAirline: 'ZH', flightNumber: 'ZH9102', aircraft: 'A330', cabin: 'Economy', origin: 'PEK', destination: 'SZX', departureTime: '19:00', arrivalTime: '22:00', durationMinutes: 180, layoverAfterMinutes: 0, bookingClass: 'L' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'ZH', flightNumber: 'ZH9109', aircraft: 'A330', cabin: 'Economy', origin: 'SZX', destination: 'PEK', departureTime: '08:00', arrivalTime: '11:00', durationMinutes: 180, layoverAfterMinutes: 180, bookingClass: 'L' },
      { segmentNumber: 2, marketingAirline: 'CA', flightNumber: 'CA819', aircraft: '777-300ER', cabin: 'Economy', origin: 'PEK', destination: 'EWR', departureTime: '14:00', arrivalTime: '16:30', durationMinutes: 870, layoverAfterMinutes: 0, bookingClass: 'L' }
    ]
  },
  {
    id: 'jfk-szx-ke-icn',
    title: 'JFK→ICN→SZX Korean Air',
    routeFamily: 'SZX Alternative',
    paymentType: 'cash',
    origin: 'JFK', destination: 'SZX',
    returnOrigin: 'SZX', returnDestination: 'JFK',
    airline: 'Korean Air',
    alliance: 'SkyTeam',
    cashPricePerPerson: 1200,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: '$150 fee',
    cancellationPolicy: 'Non-refundable',
    outboundDate: '2026-07-28',
    returnDate: '2026-08-30',
    totalDurationMinutesOutbound: 1320,
    totalDurationMinutesReturn: 1350,
    stopsOutbound: 1,
    stopsReturn: 1,
    arrivalAirportType: 'SZX',
    groundTransferMinutes: 60,
    groundTransferCost: 20,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Google Flights',
    notes: 'Via ICN. Korean Air has outstanding service. Easy transfers to Guangzhou.',
    links: { googleFlights: 'https://www.google.com/travel/flights?q=JFK+to+SZX+July+28', airlineDirect: 'https://www.koreanair.com/' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'KE', flightNumber: 'KE82', aircraft: '747-8i', cabin: 'Economy', origin: 'JFK', destination: 'ICN', departureTime: '13:20', arrivalTime: '17:20+1', durationMinutes: 840, layoverAfterMinutes: 180, bookingClass: 'U' },
      { segmentNumber: 2, marketingAirline: 'KE', flightNumber: 'KE827', aircraft: 'A330', cabin: 'Economy', origin: 'ICN', destination: 'SZX', departureTime: '20:20', arrivalTime: '23:00', durationMinutes: 300, layoverAfterMinutes: 0, bookingClass: 'U' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'KE', flightNumber: 'KE828', aircraft: 'A330', cabin: 'Economy', origin: 'SZX', destination: 'ICN', departureTime: '00:10', arrivalTime: '04:30', durationMinutes: 260, layoverAfterMinutes: 330, bookingClass: 'U' },
      { segmentNumber: 2, marketingAirline: 'KE', flightNumber: 'KE81', aircraft: '747-8i', cabin: 'Economy', origin: 'ICN', destination: 'JFK', departureTime: '10:00', arrivalTime: '11:00', durationMinutes: 780, layoverAfterMinutes: 0, bookingClass: 'U' }
    ]
  },
  {
    id: 'jfk-pvg-mu-nonstop',
    title: 'JFK→PVG Nonstop Eastern',
    routeFamily: 'PVG/SHA Alternative',
    paymentType: 'cash',
    origin: 'JFK', destination: 'PVG',
    returnOrigin: 'PVG', returnDestination: 'JFK',
    airline: 'China Eastern',
    alliance: 'SkyTeam',
    cashPricePerPerson: 950,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: '$200 fee',
    cancellationPolicy: 'Non-refundable',
    outboundDate: '2026-07-28',
    returnDate: '2026-08-31',
    totalDurationMinutesOutbound: 900,
    totalDurationMinutesReturn: 930,
    stopsOutbound: 0,
    stopsReturn: 0,
    arrivalAirportType: 'PVG',
    groundTransferMinutes: 240,
    groundTransferCost: 150,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Google Flights',
    notes: 'Cheap flight to PVG, but requires long domestic flight/high-speed rail connection to CAN.',
    links: { googleFlights: 'https://www.google.com/travel/flights?q=JFK+to+PVG+July+28', airlineDirect: 'https://us.ceair.com/' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'MU', flightNumber: 'MU588', aircraft: '777-300ER', cabin: 'Economy', origin: 'JFK', destination: 'PVG', departureTime: '16:00', arrivalTime: '19:00+1', durationMinutes: 900, layoverAfterMinutes: 0, bookingClass: 'M' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'MU', flightNumber: 'MU587', aircraft: '777-300ER', cabin: 'Economy', origin: 'PVG', destination: 'JFK', departureTime: '11:00', arrivalTime: '12:30', durationMinutes: 930, layoverAfterMinutes: 0, bookingClass: 'M' }
    ]
  },
  {
    id: 'openjaw-jfk-can-hkg-jfk',
    title: 'Open-jaw: JFK→CAN, HKG→JFK',
    routeFamily: 'Open-jaw',
    paymentType: 'cash',
    origin: 'JFK', destination: 'CAN',
    returnOrigin: 'HKG', returnDestination: 'JFK',
    airline: 'CZ + CX',
    alliance: 'Mixed',
    cashPricePerPerson: 1350,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: false,
    baggageIncluded: 'Varies',
    changePolicy: 'Per airline',
    cancellationPolicy: 'Per airline',
    outboundDate: '2026-07-28',
    returnDate: '2026-09-01',
    totalDurationMinutesOutbound: 950,
    totalDurationMinutesReturn: 975,
    stopsOutbound: 0,
    stopsReturn: 0,
    arrivalAirportType: 'CAN',
    groundTransferMinutes: 0,
    groundTransferCost: 0,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Manual',
    notes: 'Arrive CAN directly, return from HKG. Flexible strategy. Separate tickets required.',
    links: { googleFlights: 'https://www.google.com/travel/flights', airlineDirect: null },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'CZ', flightNumber: 'CZ600', aircraft: '777-300ER', cabin: 'Economy', origin: 'JFK', destination: 'CAN', departureTime: '01:45', arrivalTime: '05:35+1', durationMinutes: 950, layoverAfterMinutes: 0, bookingClass: 'L' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'CX', flightNumber: 'CX846', aircraft: 'A350-1000', cabin: 'Economy', origin: 'HKG', destination: 'JFK', departureTime: '18:00', arrivalTime: '21:15', durationMinutes: 975, layoverAfterMinutes: 0, bookingClass: 'N' }
    ]
  },
  {
    id: 'openjaw-jfk-hkg-can-jfk',
    title: 'Open-jaw: JFK→HKG, CAN→JFK',
    routeFamily: 'Open-jaw',
    paymentType: 'cash',
    origin: 'JFK', destination: 'HKG',
    returnOrigin: 'CAN', returnDestination: 'JFK',
    airline: 'Cathay + China Southern',
    alliance: 'Mixed',
    cashPricePerPerson: 1380,
    pointsProgram: null,
    pointsPerPerson: null,
    taxesPerPerson: 0,
    awardSeatsAvailable: null,
    familyBookable: true,
    sameTicket: false,
    baggageIncluded: 'Varies',
    changePolicy: 'Per airline',
    cancellationPolicy: 'Per airline',
    outboundDate: '2026-07-29',
    returnDate: '2026-08-30',
    totalDurationMinutesOutbound: 960,
    totalDurationMinutesReturn: 960,
    stopsOutbound: 0,
    stopsReturn: 0,
    arrivalAirportType: 'HKG',
    groundTransferMinutes: 90,
    groundTransferCost: 40,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Manual',
    notes: 'Outbound to HKG (cheap nonstop), return directly from CAN. Separate bookings.',
    links: { googleFlights: 'https://www.google.com/travel/flights', airlineDirect: null },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'CX', flightNumber: 'CX845', aircraft: 'A350-1000', cabin: 'Economy', origin: 'JFK', destination: 'HKG', departureTime: '00:30', arrivalTime: '05:30+1', durationMinutes: 960, layoverAfterMinutes: 0, bookingClass: 'N' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'CZ', flightNumber: 'CZ399', aircraft: '777-300ER', cabin: 'Economy', origin: 'CAN', destination: 'JFK', departureTime: '20:00', arrivalTime: '22:00', durationMinutes: 960, layoverAfterMinutes: 0, bookingClass: 'L' }
    ]
  },
  {
    id: 'ewr-hkg-ua-award',
    title: 'EWR→HKG United Award',
    routeFamily: 'HKG Alternative',
    paymentType: 'points',
    origin: 'EWR', destination: 'HKG',
    returnOrigin: 'HKG', returnDestination: 'EWR',
    airline: 'United',
    alliance: 'Star Alliance',
    cashPricePerPerson: null,
    pointsProgram: 'United MileagePlus',
    pointsPerPerson: 55000,
    taxesPerPerson: 85,
    awardSeatsAvailable: 4,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: 'Free for members',
    cancellationPolicy: 'Redeposit miles free',
    outboundDate: '2026-07-28',
    returnDate: '2026-08-30',
    totalDurationMinutesOutbound: 960,
    totalDurationMinutesReturn: 1005,
    stopsOutbound: 0,
    stopsReturn: 0,
    arrivalAirportType: 'HKG',
    groundTransferMinutes: 90,
    groundTransferCost: 40,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'United.com',
    notes: 'Saver award, 4 seats confirmed. Excellent cpp. Transfer from Chase UR or use United miles.',
    links: { googleFlights: 'https://www.google.com/travel/flights?q=EWR+to+HKG', airlineDirect: null, united: 'https://www.united.com/en/us/fsr/choose-flights?f=EWR&t=HKG', chase: 'https://ultimaterewardspoints.chase.com/travel' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'UA', flightNumber: 'UA179', aircraft: '777-200ER', cabin: 'Economy', origin: 'EWR', destination: 'HKG', departureTime: '00:35', arrivalTime: '05:35+1', durationMinutes: 960, layoverAfterMinutes: 0, bookingClass: 'X' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'UA', flightNumber: 'UA180', aircraft: '777-200ER', cabin: 'Economy', origin: 'HKG', destination: 'EWR', departureTime: '10:00', arrivalTime: '13:45', durationMinutes: 1005, layoverAfterMinutes: 0, bookingClass: 'X' }
    ]
  },
  {
    id: 'ewr-can-ac-yvr-award',
    title: 'EWR→YVR→CAN Aeroplan',
    routeFamily: 'One-stop CAN',
    paymentType: 'points',
    origin: 'EWR', destination: 'CAN',
    returnOrigin: 'CAN', returnDestination: 'EWR',
    airline: 'Air Canada',
    alliance: 'Star Alliance',
    cashPricePerPerson: null,
    pointsProgram: 'Chase UR → Aeroplan',
    pointsPerPerson: 50000,
    taxesPerPerson: 110,
    awardSeatsAvailable: 4,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: 'Free',
    cancellationPolicy: 'Redeposit free',
    outboundDate: '2026-07-30',
    returnDate: '2026-08-31',
    totalDurationMinutesOutbound: 1440,
    totalDurationMinutesReturn: 1380,
    stopsOutbound: 1,
    stopsReturn: 1,
    arrivalAirportType: 'CAN',
    groundTransferMinutes: 0,
    groundTransferCost: 0,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Aeroplan',
    notes: 'Via YVR. 4 seats available, long but bookable with points. Transfer from Chase UR.',
    links: { aeroplan: 'https://www.aircanada.com/aeroplan', chase: 'https://ultimaterewardspoints.chase.com/travel' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'AC', flightNumber: 'AC735', aircraft: '737 MAX 8', cabin: 'Economy', origin: 'EWR', destination: 'YVR', departureTime: '08:00', arrivalTime: '10:45', durationMinutes: 345, layoverAfterMinutes: 195, bookingClass: 'I' },
      { segmentNumber: 2, marketingAirline: 'AC', flightNumber: 'AC025', aircraft: '787-9', cabin: 'Economy', origin: 'YVR', destination: 'CAN', departureTime: '14:00', arrivalTime: '18:00+1', durationMinutes: 720, layoverAfterMinutes: 0, bookingClass: 'I' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'AC', flightNumber: 'AC026', aircraft: '787-9', cabin: 'Economy', origin: 'CAN', destination: 'YVR', departureTime: '20:00', arrivalTime: '17:00', durationMinutes: 660, layoverAfterMinutes: 180, bookingClass: 'I' },
      { segmentNumber: 2, marketingAirline: 'AC', flightNumber: 'AC736', aircraft: '737 MAX 8', cabin: 'Economy', origin: 'YVR', destination: 'EWR', departureTime: '20:00', arrivalTime: '04:00+1', durationMinutes: 300, layoverAfterMinutes: 0, bookingClass: 'I' }
    ]
  },
  {
    id: 'jfk-can-ua-award',
    title: 'JFK→TPE→CAN United Award',
    routeFamily: 'One-stop CAN',
    paymentType: 'points',
    origin: 'JFK', destination: 'CAN',
    returnOrigin: 'CAN', returnDestination: 'JFK',
    airline: 'United / EVA',
    alliance: 'Star Alliance',
    cashPricePerPerson: null,
    pointsProgram: 'United MileagePlus',
    pointsPerPerson: 70000,
    taxesPerPerson: 95,
    awardSeatsAvailable: 2,
    familyBookable: false,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: 'Free',
    cancellationPolicy: 'Redeposit free',
    outboundDate: '2026-07-30',
    returnDate: '2026-09-01',
    totalDurationMinutesOutbound: 1320,
    totalDurationMinutesReturn: 1290,
    stopsOutbound: 1,
    stopsReturn: 1,
    arrivalAirportType: 'CAN',
    groundTransferMinutes: 0,
    groundTransferCost: 0,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'United.com',
    notes: 'Only 2 saver seats, remaining requires high dynamic pricing. Best for split family booking.',
    links: { united: 'https://www.united.com/en/us/fsr/choose-flights?f=JFK&t=CAN' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'BR', flightNumber: 'BR31', aircraft: '777-300ER', cabin: 'Economy', origin: 'JFK', destination: 'TPE', departureTime: '00:05', arrivalTime: '05:45+1', durationMinutes: 900, layoverAfterMinutes: 135, bookingClass: 'X' },
      { segmentNumber: 2, marketingAirline: 'BR', flightNumber: 'BR827', aircraft: 'A321', cabin: 'Economy', origin: 'TPE', destination: 'CAN', departureTime: '08:00', arrivalTime: '09:55', durationMinutes: 115, layoverAfterMinutes: 0, bookingClass: 'X' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'BR', flightNumber: 'BR828', aircraft: 'A321', cabin: 'Economy', origin: 'CAN', destination: 'TPE', departureTime: '13:00', arrivalTime: '15:00', durationMinutes: 120, layoverAfterMinutes: 180, bookingClass: 'X' },
      { segmentNumber: 2, marketingAirline: 'BR', flightNumber: 'BR32', aircraft: '777-300ER', cabin: 'Economy', origin: 'TPE', destination: 'JFK', departureTime: '19:00', arrivalTime: '22:00', durationMinutes: 900, layoverAfterMinutes: 0, bookingClass: 'X' }
    ]
  },
  {
    id: 'jfk-hkg-cx-award',
    title: 'JFK→HKG Cathay Award',
    routeFamily: 'HKG Alternative',
    paymentType: 'points',
    origin: 'JFK', destination: 'HKG',
    returnOrigin: 'HKG', returnDestination: 'JFK',
    airline: 'Cathay Pacific',
    alliance: 'Oneworld',
    cashPricePerPerson: null,
    pointsProgram: 'Amex MR → Asia Miles',
    pointsPerPerson: 60000,
    taxesPerPerson: 120,
    awardSeatsAvailable: 3,
    familyBookable: false,
    sameTicket: true,
    baggageIncluded: '1x30kg',
    changePolicy: '$50 fee',
    cancellationPolicy: '$120 fee',
    outboundDate: '2026-07-28',
    returnDate: '2026-08-30',
    totalDurationMinutesOutbound: 960,
    totalDurationMinutesReturn: 975,
    stopsOutbound: 0,
    stopsReturn: 0,
    arrivalAirportType: 'HKG',
    groundTransferMinutes: 90,
    groundTransferCost: 40,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'Cathay Pacific',
    notes: 'Only 3 award seats. Nonstop flights, great experience, but requires mixed strategy for 4th person.',
    links: { cathayAsiaMiles: 'https://www.cathaypacific.com/cx/en_US/redeem-miles/flights.html' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'CX', flightNumber: 'CX845', aircraft: 'A350-1000', cabin: 'Economy', origin: 'JFK', destination: 'HKG', departureTime: '00:30', arrivalTime: '05:30+1', durationMinutes: 960, layoverAfterMinutes: 0, bookingClass: 'U' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'CX', flightNumber: 'CX846', aircraft: 'A350-1000', cabin: 'Economy', origin: 'HKG', destination: 'JFK', departureTime: '18:00', arrivalTime: '21:15', durationMinutes: 975, layoverAfterMinutes: 0, bookingClass: 'U' }
    ]
  },
  {
    id: 'jfk-pvg-ana-award',
    title: 'JFK→HND/NRT→PVG ANA',
    routeFamily: 'PVG/SHA Alternative',
    paymentType: 'points',
    origin: 'JFK', destination: 'PVG',
    returnOrigin: 'PVG', returnDestination: 'JFK',
    airline: 'ANA',
    alliance: 'Star Alliance',
    cashPricePerPerson: null,
    pointsProgram: 'Amex MR → ANA',
    pointsPerPerson: 45000,
    taxesPerPerson: 60,
    awardSeatsAvailable: 4,
    familyBookable: true,
    sameTicket: true,
    baggageIncluded: '2x23kg',
    changePolicy: 'Free',
    cancellationPolicy: '3,000 miles fee',
    outboundDate: '2026-07-29',
    returnDate: '2026-09-01',
    totalDurationMinutesOutbound: 1200,
    totalDurationMinutesReturn: 1170,
    stopsOutbound: 1,
    stopsReturn: 1,
    arrivalAirportType: 'PVG',
    groundTransferMinutes: 240,
    groundTransferCost: 150,
    verificationStatus: 'Verified',
    lastCheckedAt: '2026-05-19',
    dataSource: 'ANA website',
    notes: '4 seats available. Cheap mileage rate, ANA is super premium, but PVG connection to Guangzhou is tiring.',
    links: { amex: 'https://travel.americanexpress.com/flights', airlineDirect: 'https://www.ana.co.jp/en/us/' },
    outboundSegments: [
      { segmentNumber: 1, marketingAirline: 'NH', flightNumber: 'NH109', aircraft: '777-300ER', cabin: 'Economy', origin: 'JFK', destination: 'HND', departureTime: '13:00', arrivalTime: '16:00+1', durationMinutes: 840, layoverAfterMinutes: 180, bookingClass: 'X' },
      { segmentNumber: 2, marketingAirline: 'NH', flightNumber: 'NH969', aircraft: '787-9', cabin: 'Economy', origin: 'HND', destination: 'PVG', departureTime: '19:00', arrivalTime: '22:00', durationMinutes: 180, layoverAfterMinutes: 0, bookingClass: 'X' }
    ],
    returnSegments: [
      { segmentNumber: 1, marketingAirline: 'NH', flightNumber: 'NH922', aircraft: '787-9', cabin: 'Economy', origin: 'PVG', destination: 'NRT', departureTime: '10:00', arrivalTime: '14:15', durationMinutes: 195, layoverAfterMinutes: 135, bookingClass: 'X' },
      { segmentNumber: 2, marketingAirline: 'NH', flightNumber: 'NH10', aircraft: '777-300ER', cabin: 'Economy', origin: 'NRT', destination: 'JFK', departureTime: '16:30', arrivalTime: '16:00', durationMinutes: 840, layoverAfterMinutes: 0, bookingClass: 'X' }
    ]
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
    cashItineraryId: 'jfk-hkg-cx-nonstop',
    awardItineraryId: 'jfk-hkg-cx-award',
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

// ─── DATE HEATMAP CONFIG & DATA ───────────────────────
const heatmapOutboundDates = ['2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03'];
const heatmapReturnDates = ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];

function generateHeatmapData() {
  const data = [];
  const allItins = getAllItineraries();
  
  // Custom manual snapshots to enrich cells that don't have matching active itineraries
  const manualSnapshots = {
    '2026-07-28_2026-08-31': { pricePerPerson: 1350, route: 'JFK-PVG', status: 'Manual', lastChecked: '2026-05-18' },
    '2026-07-29_2026-08-30': { pricePerPerson: 1400, route: 'JFK-SZX', status: 'Manual', lastChecked: '2026-05-17' },
    '2026-07-30_2026-08-31': { pricePerPerson: 1280, route: 'EWR-CAN', status: 'Verified', lastChecked: '2026-05-19' },
    '2026-07-31_2026-09-02': { pricePerPerson: 1420, route: 'JFK-CAN', status: 'Manual', lastChecked: '2026-05-18' },
  };

  for (let i = 0; i < heatmapOutboundDates.length; i++) {
    const row = [];
    const outDateStr = heatmapOutboundDates[i];
    for (let j = 0; j < heatmapReturnDates.length; j++) {
      const retDateStr = heatmapReturnDates[j];
      const key = `${outDateStr}_${retDateStr}`;

      // Search itineraries
      const matches = allItins.filter(it => it.outboundDate === outDateStr && it.returnDate === retDateStr);
      if (matches.length > 0) {
        let best = null;
        let minPrice = Infinity;
        for (const it of matches) {
          const enriched = enrichItinerary(it);
          let price = 0;
          if (it.paymentType === 'points') {
            price = enriched.awardCost ? enriched.awardCost.totalCost : Infinity;
          } else {
            price = (enriched.cashPricePerPerson || it.cashPricePerPerson || 0) * passengerConfig.total;
          }
          if (price < minPrice) {
            minPrice = price;
            best = enriched;
          }
        }
        if (best && minPrice !== Infinity) {
          row.push({
            price: minPrice,
            pricePerPerson: minPrice / passengerConfig.total,
            routeType: `${best.origin}→${best.destination}`,
            rec: best.recommendation ? best.recommendation.label.toLowerCase() : 'watch',
            status: best.verificationStatus || 'Verified',
            verifiedAt: best.lastCheckedAt || '2026-05-19'
          });
          continue;
        }
      }

      // Fallback 1: Manual Snapshots
      if (manualSnapshots[key]) {
        const snap = manualSnapshots[key];
        const totalPrice = snap.pricePerPerson * passengerConfig.total;
        let rec = 'watch';
        if (snap.pricePerPerson < 1200) rec = 'buy';
        else if (snap.pricePerPerson < 1350) rec = 'strong';
        else if (snap.pricePerPerson > 1500) rec = 'avoid';

        row.push({
          price: totalPrice,
          pricePerPerson: snap.pricePerPerson,
          routeType: snap.route,
          rec: rec,
          status: snap.status,
          verifiedAt: snap.lastChecked
        });
        continue;
      }

      // Fallback 2: Deterministic Mock Data for other cells (some check date patterns)
      // Some cells will be "unknown / not checked" (e.g. if we want to show unknown states)
      const isUnknown = (i + j) % 3 === 1; // Mark some cells as unknown
      if (isUnknown) {
        row.push({
          price: null,
          pricePerPerson: null,
          routeType: '—',
          rec: 'unknown',
          status: 'Not Checked',
          verifiedAt: '—'
        });
      } else {
        const basePrice = 1200;
        const weekendPenalty = (i % 7 === 0 || i % 7 === 6 || j % 7 === 0 || j % 7 === 6) ? 120 : 0;
        const ppp = basePrice + weekendPenalty + (i * 20) - (j * 15);
        let rec = 'watch';
        if (ppp < 1200) rec = 'buy';
        else if (ppp < 1350) rec = 'strong';

        row.push({
          price: ppp * passengerConfig.total,
          pricePerPerson: ppp,
          routeType: 'CAN 1-stop',
          rec: rec,
          status: 'Mock',
          verifiedAt: '2026-05-19'
        });
      }
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
  const prog = (it.pointsProgram || it.program || '').toLowerCase();
  if (prog.includes('united') || it.paymentType === 'cash') {
    links.push({ name: 'United', url: SEARCH_LINKS.united(it.origin, it.destination.split('→')[0]), icon: '✈️' });
  }
  if (prog.includes('chase') || prog.includes('aeroplan')) {
    links.push({ name: 'Chase Travel', url: SEARCH_LINKS.chaseTravel(), icon: '💳' });
    links.push({ name: 'Aeroplan', url: SEARCH_LINKS.aeroplan(it.origin, it.destination.split('→')[0]), icon: '🍁' });
  }
  if (prog.includes('amex') || prog.includes('ana') || prog.includes('asia') || prog.includes('cathay')) {
    links.push({ name: 'Amex Travel', url: SEARCH_LINKS.amexTravel(), icon: '💎' });
  }
  if (prog.includes('ana') || prog.includes('amex')) {
    links.push({ name: 'ANA', url: SEARCH_LINKS.ana(), icon: '🇯🇵' });
  }
  if (prog.includes('cathay') || prog.includes('asia') || it.destination.includes('HKG')) {
    links.push({ name: 'Cathay Asia Miles', url: SEARCH_LINKS.cathayAsiaMiles(), icon: '🐉' });
  }
  if (it.paymentType === 'cash') {
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
  { id: 'separate_tickets', label: 'Separate tickets', weight: 'High', applies: it => !it.sameTicket },
  { id: 'mixed_pnr', label: 'Mixed PNR', weight: 'Medium', applies: it => it.paymentType === 'points' && !it.familyBookable },
  { id: 'tight_connection', label: 'Tight connection', weight: 'High', applies: it => {
      const outTight = it.outboundSegments && it.outboundSegments.some(s => s.layoverAfterMinutes > 0 && s.layoverAfterMinutes < 75);
      const retTight = it.returnSegments && it.returnSegments.some(s => s.layoverAfterMinutes > 0 && s.layoverAfterMinutes < 75);
      return outTight || retTight;
    } 
  },
  { id: 'overnight_layover', label: 'Overnight layover', weight: 'Medium', applies: it => {
      const outOver = it.outboundSegments && it.outboundSegments.some(s => s.layoverAfterMinutes >= 720);
      const retOver = it.returnSegments && it.returnSegments.some(s => s.layoverAfterMinutes >= 720);
      return outOver || retOver || (it.totalDurationMinutesOutbound / 60) > 24 || (it.totalDurationMinutesReturn / 60) > 24;
    } 
  },
  { id: 'late_arrival', label: 'Late arrival risk', weight: 'Low', applies: it => {
      const outLate = it.outboundSegments && it.outboundSegments.some(s => {
        if (!s.arrivalTime) return false;
        const hr = parseInt(s.arrivalTime.split(':')[0]);
        return s.arrivalTime.includes('+1') || hr >= 22 || hr < 6;
      });
      return outLate;
    } 
  },
  { id: 'domestic_addon', label: 'Domestic add-on flight', weight: 'Medium', applies: it => it.destination === 'PVG' || it.destination === 'SHA' },
  { id: 'airport_transfer', label: 'Airport transfer needed', weight: 'Low', applies: it => it.destination !== 'CAN' },
  { id: 'few_award_seats', label: 'Fewer than 4 award seats', weight: 'High', applies: it => it.paymentType === 'points' && (it.awardSeatsAvailable !== null && it.awardSeatsAvailable < 4) }
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
  weights: { price: 30, duration: 20, family: 25, risk: 20, points: 5 }, // new weights support
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
    if (saved) {
      // Deep merge weights to ensure they exist
      return { 
        ...DEFAULT_SETTINGS, 
        ...saved,
        weights: { ...DEFAULT_SETTINGS.weights, ...(saved.weights || {}) }
      };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  localStorage.setItem('flightSettings', JSON.stringify(settings));
}

// ─── HARD-NO RULES ───────────────────────────────────
const HARD_NO_RULES = [
  { id: 'max_duration', test: it => (it.totalDurationMinutesOutbound / 60) > 32 || (it.totalDurationMinutesReturn / 60) > 32, reason: 'Total duration > 32h' },
  { id: 'multi_stop_kids', test: it => it.stopsOutbound >= 2 || it.stopsReturn >= 2, reason: '2+ stops with children' },
  { id: 'hkg_low_savings', test: it => {
      if (it.destination !== 'HKG') return false;
      const savings = calculateSavingsVsCAN(it);
      return savings !== null && savings < 150;
    }, reason: 'HKG saves < $150 vs CAN' 
  },
  { id: 'pvg_low_savings', test: it => {
      if (it.destination !== 'PVG' && it.destination !== 'SHA') return false;
      const savings = calculateSavingsVsCAN(it);
      return savings !== null && savings < 400;
    }, reason: 'PVG/SHA saves < $400 vs CAN' 
  },
  { id: 'separate_same_day', test: it => it.sameTicket === false && it.sameDayInternationalConnection === true, reason: 'Separate tickets with same-day international connection' },
  { id: 'overnight_with_children', test: it => it.riskChips && it.riskChips.some(r => /overnight/i.test(r)), reason: 'Overnight airport stay with children' },
  { id: 'basic_economy_unclear_seats', test: it => /basic/i.test(it.fareBrand || '') && !it.seatSelectionConfirmed, reason: 'Basic Economy without seat selection clarity' },
  { id: 'few_award_no_mixed', test: it => {
      if (it.paymentType === 'cash') return false;
      return it.awardSeatsAvailable !== null && it.awardSeatsAvailable < 4;
    }, reason: 'Fewer than 4 award seats (consider mixed)' 
  },
  { id: 'low_cpp', test: it => {
      if (it.paymentType === 'cash') return false;
      const cpp = calculateCPP(it);
      return cpp !== null && cpp < 1.2;
    }, reason: 'CPP < 1.2 — use cash instead' 
  }
];

function checkHardNos(itinerary) {
  return HARD_NO_RULES.filter(rule => rule.test(itinerary));
}

// ─── ALERT RULE TEMPLATES ────────────────────────────
const ALERT_RULES = [
  { label: 'JFK–CAN nonstop < $1,500', condition: 'JFK-CAN nonstop cashPricePerPerson < 1500' },
  { label: 'NYC–CAN 1-stop < $1,250 and < 24h', condition: 'CAN 1-stop cashPricePerPerson < 1250 AND totalDurationHours < 24' },
  { label: 'HKG adjusted saves $250+', condition: 'HKG adjustedSavingsVsCAN >= 250' },
  { label: 'United award ≥ 4 seats and cpp ≥ 1.5', condition: 'United awardSeatsAvailable >= 4 AND cpp ≥ 1.5' },
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
  const localList = getCustomItineraries();
  // Ensure custom itineraries get parsed correctly and inherit defaults
  return [...itineraries, ...localList];
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

// ─── ROUTE GROUPS ────────────────────────────────────
const ROUTE_GROUPS = [
  { id: 'direct-can', label: 'Direct CAN', filter: it => it.routeFamily === 'Direct CAN' && it.paymentType === 'cash' },
  { id: '1stop-can', label: 'One-stop CAN', filter: it => it.routeFamily === 'One-stop CAN' && it.paymentType === 'cash' },
  { id: 'hkg-alt', label: 'HKG Alternative', filter: it => it.routeFamily === 'HKG Alternative' && it.paymentType === 'cash' },
  { id: 'szx-alt', label: 'SZX Alternative', filter: it => it.routeFamily === 'SZX Alternative' && it.paymentType === 'cash' },
  { id: 'pvg-alt', label: 'Shanghai Backup', filter: it => it.routeFamily === 'PVG/SHA Alternative' && it.paymentType === 'cash' },
  { id: 'open-jaw', label: 'Open-jaw', filter: it => it.routeFamily.includes('Open-jaw') },
  { id: 'points', label: 'Points Awards', filter: it => it.paymentType === 'points' },
  { id: 'mixed', label: 'Mixed Strategy', filter: () => false }
];
