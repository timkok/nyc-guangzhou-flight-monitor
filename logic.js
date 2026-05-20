/* ═══════════════════════════════════════════════════════
   LOGIC LAYER — Calculations, scoring, recommendations
   ═══════════════════════════════════════════════════════ */

// Capture original cash baselines (before overrides), then apply persisted overrides.
(function applyPriceOverrides() {
  const baselines = {};
  for (const it of itineraries) {
    if (it.paymentType === 'cash') baselines[it.id] = it.cashPricePerPerson;
  }
  window._baselineCashPrice = baselines;
  const ov = (typeof window !== 'undefined' && window.priceOverrides) || {};
  for (const it of itineraries) {
    const o = ov[it.id];
    if (o && typeof o === 'object') {
      Object.assign(it, o);
    }
  }
})();

// ─── COST CALCULATIONS ────────────────────────────────

function calculateTotalCash(pricePerPerson, paxCount = passengerConfig.total) {
  if (pricePerPerson == null) return null;
  return pricePerPerson * paxCount;
}

function getDestAdjustment(destination) {
  const dest = destination.split('→')[0].trim(); // handle open-jaw like "CAN→HKG"
  return ADJUSTMENTS[dest] || 0;
}

function calculateAdjustedCostPerPerson(itinerary) {
  const base = itinerary.cashPricePerPerson;
  if (base == null) return null;
  const adj = getDestAdjustment(itinerary.destination);
  return base + adj;
}

function calculateAdjustedTotalCost(itinerary) {
  const perPerson = calculateAdjustedCostPerPerson(itinerary);
  if (perPerson == null) return null;
  return perPerson * passengerConfig.total;
}

// ─── POINTS CALCULATIONS ──────────────────────────────

function calculateCPP(itinerary) {
  if (!itinerary.pointsPerPerson || itinerary.pointsPerPerson === 0) return null;
  // Find comparable cash price for the same route type
  const comparableCash = findComparableCashPrice(itinerary);
  if (!comparableCash) return null;
  const cashValue = comparableCash - (itinerary.taxesPerPerson || 0);
  return (cashValue / itinerary.pointsPerPerson) * 100;
}

function findComparableCashPrice(awardItinerary) {
  // Find the cheapest cash itinerary for a similar route
  const dest = awardItinerary.destination;
  const cashOptions = itineraries.filter(it =>
    it.paymentType === 'cash' &&
    it.destination === dest
  );
  if (cashOptions.length === 0) {
    // Try matching route type
    const byType = itineraries.filter(it =>
      it.paymentType === 'cash' &&
      it.routeFamily === awardItinerary.routeFamily
    );
    if (byType.length > 0) return Math.min(...byType.map(it => it.cashPricePerPerson));
    return null;
  }
  return Math.min(...cashOptions.map(it => it.cashPricePerPerson));
}

function getCPPRating(cpp) {
  if (cpp == null) return { label: '—', class: 'neutral' };
  if (cpp >= 1.8) return { label: 'Excellent', class: 'excellent' };
  if (cpp >= 1.5) return { label: 'Good', class: 'good' };
  if (cpp >= 1.2) return { label: 'Okay', class: 'okay' };
  return { label: 'Use Cash', class: 'poor' };
}

function calculateAwardTotalCost(itinerary) {
  if (!itinerary.pointsPerPerson) return null;
  const totalTaxes = (itinerary.taxesPerPerson || 0) * passengerConfig.total;
  const totalPoints = itinerary.pointsPerPerson * passengerConfig.total;
  // Use the best available point value
  const programValue = getPointValueForProgram(itinerary.pointsProgram || itinerary.program);
  const pointsCashEquiv = totalPoints * programValue;
  return { totalTaxes, totalPoints, pointsCashEquiv, totalCost: pointsCashEquiv + totalTaxes };
}

function getPointValueForProgram(program) {
  if (!program) return 0.015;
  const p = program.toLowerCase();
  const settings = loadSettings();
  if (p.includes('chase') || p.includes('aeroplan')) return settings.pointValues.chaseUR;
  if (p.includes('amex') || p.includes('ana') || p.includes('asia miles') || p.includes('cathay')) return settings.pointValues.amexMR;
  if (p.includes('united')) return settings.pointValues.unitedMiles;
  return 0.015;
}

// ─── AWARD AVAILABILITY ───────────────────────────────

function evaluateAwardAvailability(itinerary) {
  if (itinerary.paymentType === 'cash') return { status: 'cash', bookable: true, label: 'Cash Fare' };
  const available = itinerary.awardSeatsAvailable || 0;
  const needed = passengerConfig.total;
  if (available >= needed) return { status: 'available', bookable: true, label: 'Family Bookable' };
  if (available >= 2) return { status: 'partial', bookable: false, label: `${available}/${needed} seats` };
  if (available >= 1) return { status: 'limited', bookable: false, label: `${available}/${needed} seats` };
  return { status: 'none', bookable: false, label: 'Not Available' };
}

// ─── NEW SCORING ENGINE (0-100 SCALE) ─────────────────

function calculateDetailedScores(it, weights) {
  // 1. Price Score (0-100)
  let totalCost = 0;
  if (it.paymentType === 'points') {
    const val = getPointValueForProgram(it.pointsProgram);
    totalCost = (it.pointsPerPerson * 4 * val) + (it.taxesPerPerson * 4) + (it.groundTransferCost || 0);
  } else {
    totalCost = ((it.cashPricePerPerson || 0) * 4) + (it.groundTransferCost || 0);
  }
  // Linear interpolation: $3000 total = 100 points, $8000 total = 0 points
  let priceScore = 100 - ((totalCost - 3000) / 5000) * 100;
  priceScore = Math.max(0, Math.min(100, Math.round(priceScore)));

  // 2. Duration Score (0-100)
  const totalDurationHours = ((it.totalDurationMinutesOutbound || 0) + (it.totalDurationMinutesReturn || 0)) / 60;
  // Linear interpolation: 32h roundtrip = 100 points, 64h roundtrip = 0 points
  let durationScore = 100 - ((totalDurationHours - 32) / 32) * 100;
  durationScore = Math.max(0, Math.min(100, Math.round(durationScore)));

  // 3. Family Comfort Score (0-100)
  let comfortPoints = 0;
  const stopsOut = it.stopsOutbound ?? it.stops ?? 0;
  const stopsRet = it.stopsReturn ?? it.stops ?? 0;
  const totalStops = stopsOut + stopsRet;

  // Stops
  if (totalStops === 0) comfortPoints += 45;
  else if (totalStops === 2) comfortPoints += 25;
  else if (totalStops === 3) comfortPoints += 15;

  // Layovers (ideal is between 90 and 240 mins)
  let goodLayovers = true;
  let hasLayover = false;
  const segments = [...(it.outboundSegments || []), ...(it.returnSegments || [])];
  for (const seg of segments) {
    if (seg.layoverAfterMinutes > 0) {
      hasLayover = true;
      if (seg.layoverAfterMinutes < 90 || seg.layoverAfterMinutes > 240) {
        goodLayovers = false;
      }
    }
  }
  if (hasLayover && goodLayovers) comfortPoints += 20;
  else if (!hasLayover) comfortPoints += 20;

  // Arrival time (Daytime preferred: arrival local time between 07:00 and 21:00)
  let goodArrival = true;
  if (it.outboundSegments && it.outboundSegments.length > 0) {
    const lastSeg = it.outboundSegments[it.outboundSegments.length - 1];
    if (lastSeg.arrivalTime) {
      const hr = parseInt(lastSeg.arrivalTime.split(':')[0]);
      if (lastSeg.arrivalTime.includes('+1') || hr < 7 || hr > 21) goodArrival = false;
    }
  }
  if (goodArrival) comfortPoints += 15;

  // Destination (CAN direct = 10, HKG/SZX = 5, PVG/SHA = 0)
  const dest = it.destination.split('→')[0].trim();
  if (dest === 'CAN') comfortPoints += 10;
  else if (dest === 'HKG' || dest === 'SZX') comfortPoints += 5;

  // Connection safety (same ticket)
  if (it.sameTicket) comfortPoints += 10;

  let familyScore = Math.max(0, Math.min(100, comfortPoints));

  // 4. Risk Score (0-100)
  let riskDeductions = 0;

  // Separate ticket risk
  if (!it.sameTicket) riskDeductions += 30;

  // Overnight risk
  let hasOvernight = false;
  for (const seg of segments) {
    if (seg.layoverAfterMinutes >= 720) hasOvernight = true;
  }
  if (hasOvernight || totalDurationHours > 48) riskDeductions += 20;

  // Ground transfer risk/clearance (HKG/SZX = 15, PVG/SHA = 30)
  if (dest === 'HKG' || dest === 'SZX') riskDeductions += 15;
  else if (dest === 'PVG' || dest === 'SHA') riskDeductions += 30;

  // Tight connection risk (< 90 mins layover)
  let tightConnection = false;
  for (const seg of segments) {
    if (seg.layoverAfterMinutes > 0 && seg.layoverAfterMinutes < 90) tightConnection = true;
  }
  if (tightConnection) riskDeductions += 15;

  // Award availability risk (fewer than 4 seats)
  if (it.paymentType === 'points' && it.awardSeatsAvailable !== null && it.awardSeatsAvailable < 4) {
    riskDeductions += 25;
  }

  let riskScore = Math.max(0, 100 - riskDeductions);

  // 5. Points Value Score (0-100)
  let pointsScore = 70;
  if (it.paymentType === 'points') {
    const cpp = calculateCPP(it) || 1.0;
    // Scale: 1.0 cpp = 0, 2.0 cpp = 100
    pointsScore = ((cpp - 1.0) / 1.0) * 100;
    pointsScore = Math.max(0, Math.min(100, Math.round(pointsScore)));
  }

  // Weighted overall score
  const wPrice = (weights.price ?? 30) / 100;
  const wDuration = (weights.duration ?? 20) / 100;
  const wFamily = (weights.family ?? 25) / 100;
  const wRisk = (weights.risk ?? 20) / 100;
  const wPoints = (weights.points ?? 5) / 100;

  const overallScore = Math.round(
    (priceScore * wPrice) +
    (durationScore * wDuration) +
    (familyScore * wFamily) +
    (riskScore * wRisk) +
    (pointsScore * wPoints)
  );

  return {
    priceScore,
    durationScore,
    familyScore,
    riskScore,
    pointsScore,
    overallScore,
    totalCost
  };
}

function getFamilyScore(itinerary) {
  // Legacy support: mapping 0-100 family score to 1-10
  const weights = loadSettings().weights;
  const scores = calculateDetailedScores(itinerary, weights);
  return Math.max(1, Math.min(10, Math.round(scores.familyScore / 10 * 10) / 10));
}

function getFamilyScoreLabel(score) {
  if (score >= 9) return { label: 'Excellent', class: 'excellent' };
  if (score >= 8) return { label: 'Very Good', class: 'good' };
  if (score >= 7) return { label: 'Good', class: 'okay' };
  if (score >= 5) return { label: 'Fair', class: 'fair' };
  return { label: 'Poor', class: 'poor' };
}

// ─── RECOMMENDATION ENGINE ───────────────────────────

function getRecommendation(itinerary) {
  const cashPrice = itinerary.cashPricePerPerson;
  const adjustedCost = calculateAdjustedCostPerPerson(itinerary);
  const dur = ((itinerary.totalDurationMinutesOutbound || 0) + (itinerary.totalDurationMinutesReturn || 0)) / 60;
  const dest = itinerary.destination.split('→')[0].trim();
  const directCANPrice = getDirectCANPrice();

  if (dur > 64) return { label: 'Avoid', class: 'avoid', reason: 'Roundtrip duration > 64h' };

  if (itinerary.paymentType === 'cash') {
    if (dest === 'CAN' && (itinerary.stops || itinerary.stopsOutbound || 0) === 0 && cashPrice < 1500) {
      return { label: 'Buy Now', class: 'buy', reason: 'Nonstop CAN under $1,500' };
    }
    if (dest === 'CAN' && (itinerary.stops || itinerary.stopsOutbound || 0) <= 1 && cashPrice < 1250 && dur < 48) {
      return { label: 'Buy Now', class: 'buy', reason: '1-stop CAN under $1,250, under 48h RT' };
    }
    if (dest === 'HKG' && adjustedCost && directCANPrice && (directCANPrice - adjustedCost) >= 250) {
      return { label: 'Buy Now', class: 'buy', reason: 'HKG saves $250+ vs CAN' };
    }
    if (itinerary.routeFamily.includes('Open-jaw') && adjustedCost && adjustedCost < 1300) {
      return { label: 'Buy Now', class: 'buy', reason: 'Open-jaw under $1,300 adjusted' };
    }

    if (dest === 'CAN' && (itinerary.stops || itinerary.stopsOutbound || 0) <= 1 && cashPrice >= 1250 && cashPrice <= 1350) {
      return { label: 'Strong', class: 'strong', reason: 'CAN 1-stop $1,250-$1,350' };
    }
    if (dest === 'CAN' && (itinerary.stops || itinerary.stopsOutbound || 0) === 0 && cashPrice >= 1500 && cashPrice <= 1650) {
      return { label: 'Strong', class: 'strong', reason: 'Nonstop CAN $1,500-$1,650' };
    }
    if ((dest === 'HKG' || dest === 'SZX') && adjustedCost && directCANPrice && (directCANPrice - adjustedCost) >= 200) {
      return { label: 'Strong', class: 'strong', reason: `${dest} saves $200+ vs CAN` };
    }
    if ((dest === 'PVG' || dest === 'SHA') && adjustedCost && directCANPrice && (directCANPrice - adjustedCost) >= 400) {
      return { label: 'Strong', class: 'strong', reason: 'PVG/SHA saves $400+ vs CAN' };
    }

    if (dest === 'CAN' && cashPrice >= 1350 && cashPrice <= 1500) {
      return { label: 'Watch', class: 'watch', reason: 'CAN $1,350-$1,500' };
    }
    if (dest === 'HKG' && adjustedCost && directCANPrice) {
      const savings = directCANPrice - adjustedCost;
      if (savings >= 100 && savings < 200) return { label: 'Watch', class: 'watch', reason: 'HKG saves only $100-$200' };
      if (savings < 150) return { label: 'Avoid', class: 'avoid', reason: 'HKG saves < $150' };
    }
    if ((dest === 'PVG' || dest === 'SHA') && adjustedCost && directCANPrice && (directCANPrice - adjustedCost) < 300) {
      return { label: 'Avoid', class: 'avoid', reason: 'PVG/SHA saves < $300' };
    }
  }

  if (itinerary.paymentType === 'points') {
    const cpp = calculateCPP(itinerary);
    const avail = evaluateAwardAvailability(itinerary);
    if (cpp && cpp >= 1.5 && avail.bookable) {
      return { label: 'Strong', class: 'strong', reason: `${cpp.toFixed(1)} cpp, family bookable` };
    }
    if (cpp && cpp >= 1.5 && !avail.bookable) {
      return { label: 'Watch', class: 'watch', reason: `Good cpp but only ${itinerary.awardSeatsAvailable} seats` };
    }
    if (cpp && cpp < 1.2) {
      return { label: 'Avoid', class: 'avoid', reason: `Poor cpp (${cpp.toFixed(1)})` };
    }
  }

  return { label: 'Watch', class: 'watch', reason: 'Default — review manually' };
}

function getDirectCANPrice() {
  const canCash = itineraries.filter(it => it.paymentType === 'cash' && it.destination === 'CAN');
  if (canCash.length === 0) return null;
  return Math.min(...canCash.map(it => it.cashPricePerPerson));
}

// ─── PAYMENT METHOD RECOMMENDATION ───────────────────

function recommendPaymentMethod(itinerary) {
  if (itinerary.paymentType === 'cash') {
    return { method: 'Cash', class: 'cash', reason: 'Cash fare — earns miles and simpler booking' };
  }

  const cpp = calculateCPP(itinerary);
  const avail = evaluateAwardAvailability(itinerary);
  const comparableCash = findComparableCashPrice(itinerary);

  if (!avail.bookable) {
    if (itinerary.awardSeatsAvailable >= 2 && cpp && cpp >= 1.5) {
      return { method: 'Mixed', class: 'mixed', reason: `Only ${itinerary.awardSeatsAvailable} award seats, use mixed cash+points` };
    }
    return { method: 'Cash', class: 'cash', reason: 'Not enough award seats for family' };
  }

  if (cpp && cpp >= 1.5 && avail.bookable) {
    return { method: 'Points', class: 'points', reason: `Good redemption at ${cpp.toFixed(1)} cpp` };
  }

  if (cpp && cpp < 1.2) {
    return { method: 'Cash', class: 'cash', reason: `Poor cpp (${cpp.toFixed(1)}), cash is better` };
  }

  if (comparableCash && comparableCash < 1250) {
    return { method: 'Cash', class: 'cash', reason: 'Cash fare is already low' };
  }

  return { method: 'Points', class: 'points', reason: 'Decent redemption value' };
}

// ─── SAVINGS CALCULATION ──────────────────────────────

function calculateSavingsVsCAN(itinerary) {
  const directPrice = getDirectCANPrice();
  if (!directPrice) return null;
  const adjusted = calculateAdjustedCostPerPerson(itinerary);
  if (adjusted == null) return null;
  return directPrice - adjusted;
}

// ─── ENRICHMENT ──────────────────────────────────────

function enrichItinerary(it) {
  const settings = loadSettings();
  const weights = settings.weights;
  
  // Calculate raw scores
  const scores = calculateDetailedScores(it, weights);

  const cashTotal = calculateTotalCash(it.cashPricePerPerson);
  const adjustedPerPerson = calculateAdjustedCostPerPerson(it);
  const adjustedTotal = calculateAdjustedTotalCost(it);
  const familyScore = scores.familyScore / 10;
  const familyLabel = getFamilyScoreLabel(familyScore);
  const recommendation = getRecommendation(it);
  const savings = calculateSavingsVsCAN(it);
  const cpp = calculateCPP(it);
  const cppRating = getCPPRating(cpp);
  const availability = evaluateAwardAvailability(it);
  const payment = recommendPaymentMethod(it);
  const awardCost = calculateAwardTotalCost(it);

  // Flight numbers and route string mappings
  const flightNumbers = it.flightNumbers || (
    (it.outboundSegments && it.outboundSegments.map(s => s.flightNumber).join(' / ')) || ''
  );
  const totalHours = ((it.totalDurationMinutesOutbound || 0) + (it.totalDurationMinutesReturn || 0)) / 60;
  const stops = it.stopsOutbound ?? it.stops ?? 0;

  return {
    ...it,
    route: `${it.origin} → ${it.destination}`,
    flightNumbers,
    totalHours,
    stops,
    cashTotal,
    adjustedPerPerson,
    adjustedTotal,
    familyScore,
    familyLabel,
    recommendation,
    savings,
    cpp,
    cppRating,
    availability,
    payment,
    awardCost,
    
    // Detailed score fields for dynamic breakdown display
    overallScore: scores.overallScore,
    priceScore: scores.priceScore,
    durationScore: scores.durationScore,
    familyScorePercent: scores.familyScore,
    riskScore: scores.riskScore,
    pointsScore: scores.pointsScore,
    totalCostCalculated: scores.totalCost
  };
}

function getEnrichedItineraries() {
  return getAllItineraries().map(enrichItinerary);
}

// ─── SUMMARY CARD SELECTORS (UPDATED OVERALL RECOMMENDATIONS) ───

function getBestOverallOption(enriched) {
  if (enriched.length === 0) return null;
  return enriched.reduce((a, b) => (a.overallScore || 0) > (b.overallScore || 0) ? a : b);
}

function getCheapestOption(enriched) {
  const cash = enriched.filter(it => it.paymentType === 'cash');
  if (cash.length === 0) return null;
  return cash.reduce((a, b) => (a.cashPricePerPerson || 9999) < (b.cashPricePerPerson || 9999) ? a : b);
}

function getBestPointsOption(enriched) {
  const points = enriched.filter(it => it.paymentType === 'points' && it.availability.bookable);
  if (points.length === 0) {
    const anyPoints = enriched.filter(it => it.paymentType === 'points');
    if (anyPoints.length === 0) return null;
    return anyPoints.reduce((a, b) => (a.pointsScore || 0) > (b.pointsScore || 0) ? a : b);
  }
  return points.reduce((a, b) => (a.pointsScore || 0) > (b.pointsScore || 0) ? a : b);
}

function getBestLowRiskOption(enriched) {
  if (enriched.length === 0) return null;
  return enriched.reduce((best, it) => {
    if (it.riskScore !== best.riskScore) {
      return it.riskScore > best.riskScore ? it : best;
    }
    return it.familyScorePercent > best.familyScorePercent ? it : best;
  });
}

function getBestBackupRoute(enriched) {
  const alts = enriched.filter(it =>
    it.destination !== 'CAN' && !it.routeFamily.includes('Open-jaw') && it.paymentType === 'cash'
  );
  if (alts.length === 0) return null;
  return alts.reduce((a, b) =>
    (a.adjustedPerPerson || 9999) < (b.adjustedPerPerson || 9999) ? a : b
  );
}

function getBestCashFor4(enriched) {
  const cashOpts = enriched.filter(it => it.paymentType === 'cash');
  if (cashOpts.length === 0) return null;
  return cashOpts.reduce((a, b) => (a.cashTotal || 99999) < (b.cashTotal || 99999) ? a : b);
}

function getBestPointsFor4(enriched) {
  const pointsOpts = enriched.filter(it => it.paymentType === 'points' && it.availability.bookable);
  if (pointsOpts.length === 0) return null;
  return pointsOpts.reduce((a, b) => (a.cpp || 0) > (b.cpp || 0) ? a : b);
}

function getBestChaseUR(enriched) {
  const chaseOpts = enriched.filter(it =>
    it.pointsProgram && (it.pointsProgram.toLowerCase().includes('chase') || it.pointsProgram.toLowerCase().includes('aeroplan') || it.pointsProgram.toLowerCase().includes('united'))
  );
  if (chaseOpts.length === 0) return null;
  return chaseOpts.reduce((a, b) => (a.cpp || 0) > (b.cpp || 0) ? a : b);
}

function getBestAmexMR(enriched) {
  const amexOpts = enriched.filter(it =>
    it.pointsProgram && (it.pointsProgram.toLowerCase().includes('amex') || it.pointsProgram.toLowerCase().includes('ana') || it.pointsProgram.toLowerCase().includes('asia') || it.pointsProgram.toLowerCase().includes('cathay'))
  );
  if (amexOpts.length === 0) return null;
  return amexOpts.reduce((a, b) => (a.cpp || 0) > (b.cpp || 0) ? a : b);
}

function getBestUnitedMiles(enriched) {
  const uaOpts = enriched.filter(it =>
    it.pointsProgram && it.pointsProgram.toLowerCase().includes('united')
  );
  if (uaOpts.length === 0) return null;
  return uaOpts.reduce((a, b) => (a.cpp || 0) > (b.cpp || 0) ? a : b);
}

// ─── FILTER LOGIC ────────────────────────────────────

function applyFilters(enriched, filters) {
  return enriched.filter(it => {
    if (window.filterOutboundDate && it.outboundDate !== window.filterOutboundDate) return false;
    if (window.filterReturnDate && it.returnDate !== window.filterReturnDate) return false;
    // Price filter (compare per-person cash or cash equivalent cost)
    if (filters.maxPrice) {
      const ppp = it.paymentType === 'points' ? (it.totalCostCalculated / 4) : it.cashPricePerPerson;
      if (ppp && ppp > filters.maxPrice) return false;
    }
    if (filters.maxDuration && it.totalHours > filters.maxDuration) return false;
    if (!filters.includeHKG && (it.destination.includes('HKG'))) return false;
    if (!filters.includePVG && (it.destination.includes('PVG') || it.destination.includes('SHA'))) return false;
    if (filters.nonstopOnly && it.stops > 0) return false;
    if (!filters.oneStopAllowed && it.stops > 1) return false;
    if (filters.familyFriendlyOnly && it.familyScore < 7) return false;
    if (filters.familyBookableOnly && it.paymentType === 'points' && !it.availability.bookable) return false;
    return true;
  });
}
