/* ═══════════════════════════════════════════════════════
   LOGIC LAYER — Calculations, scoring, recommendations
   ═══════════════════════════════════════════════════════ */

// Capture original cash baselines (before overrides), then apply persisted overrides.
(function applyPriceOverrides() {
  const baselines = {};
  for (const it of itineraries) {
    if (it.program === 'cash') baselines[it.id] = it.cashPricePerPerson;
  }
  window._baselineCashPrice = baselines;
  const ov = (typeof window !== 'undefined' && window.priceOverrides) || {};
  for (const it of itineraries) {
    const o = ov[it.id];
    if (o && typeof o === 'object') Object.assign(it, o);
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
    it.program === 'cash' &&
    it.destination === dest
  );
  if (cashOptions.length === 0) {
    // Try matching route type
    const byType = itineraries.filter(it =>
      it.program === 'cash' &&
      it.routeType === awardItinerary.routeType
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
  const programValue = getPointValueForProgram(itinerary.program);
  const pointsCashEquiv = totalPoints * programValue;
  return { totalTaxes, totalPoints, pointsCashEquiv, totalCost: pointsCashEquiv + totalTaxes };
}

function getPointValueForProgram(program) {
  if (!program) return 0.015;
  const p = program.toLowerCase();
  if (p.includes('chase') || p.includes('aeroplan')) return pointValues.chaseUR;
  if (p.includes('amex') || p.includes('ana') || p.includes('asia miles') || p.includes('cathay')) return pointValues.amexMR;
  if (p.includes('united')) return pointValues.unitedMiles;
  return 0.015;
}

// ─── AWARD AVAILABILITY ───────────────────────────────

function evaluateAwardAvailability(itinerary) {
  if (itinerary.program === 'cash') return { status: 'cash', bookable: true, label: 'Cash Fare' };
  const available = itinerary.awardSeatsAvailable || 0;
  const needed = passengerConfig.total;
  if (available >= needed) return { status: 'available', bookable: true, label: 'Family Bookable' };
  if (available >= 2) return { status: 'partial', bookable: false, label: `${available}/${needed} seats` };
  if (available >= 1) return { status: 'limited', bookable: false, label: `${available}/${needed} seats` };
  return { status: 'none', bookable: false, label: 'Not Available' };
}

// ─── FAMILY FRIENDLINESS SCORE ────────────────────────

function getFamilyScore(itinerary) {
  let score = 10;
  const dur = itinerary.totalDurationHours || 20;
  const stops = itinerary.stops || 0;
  const dest = itinerary.destination.split('→')[0].trim();

  // Travel time: 30% weight
  if (dur <= 16) score -= 0;
  else if (dur <= 20) score -= 0.6;
  else if (dur <= 24) score -= 1.2;
  else if (dur <= 30) score -= 2.0;
  else score -= 3.0;

  // Stops: 25% weight
  if (stops === 0) score -= 0;
  else if (stops === 1) score -= 0.8;
  else if (stops === 2) score -= 1.8;
  else score -= 2.5;

  // Transfer ease to Guangzhou: 20% weight
  if (dest === 'CAN') score -= 0;
  else if (dest === 'HKG') score -= 0.8;
  else if (dest === 'SZX') score -= 0.8;
  else if (dest === 'PVG' || dest === 'SHA') score -= 1.6;
  else score -= 1.0;

  // Baggage/same-ticket: 15% weight
  if (itinerary.program === 'cash' && stops <= 1) score -= 0;
  else if (itinerary.routeType.includes('Open-jaw')) score -= 0.6;
  else if (itinerary.program !== 'cash') score -= 0.5;
  else score -= 1.0;

  // Arrival time: 10% (simplified)
  if (dur <= 18) score -= 0;
  else if (dur <= 24) score -= 0.3;
  else score -= 0.8;

  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
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
  const dur = itinerary.totalDurationHours || 99;
  const stops = itinerary.stops || 0;
  const dest = itinerary.destination.split('→')[0].trim();
  const directCANPrice = getDirectCANPrice();
  const hardNos = typeof checkHardNos === 'function' ? checkHardNos(itinerary) : [];

  // AVOID checks first
  if (hardNos.length > 0) return { label: 'Avoid', class: 'avoid', reason: hardNos[0].reason };
  if (dur > 32) return { label: 'Avoid', class: 'avoid', reason: 'Duration > 32h' };

  if (cashPrice != null) {
    // Cash fare recommendations
    if (dest === 'CAN' && stops === 0 && cashPrice < 1500) {
      return { label: 'Buy Now', class: 'buy', reason: 'Nonstop CAN under $1,500' };
    }
    if (dest === 'CAN' && stops <= 1 && cashPrice < 1250 && dur < 24) {
      return { label: 'Buy Now', class: 'buy', reason: '1-stop CAN under $1,250, under 24h' };
    }
    if (dest === 'HKG' && adjustedCost && directCANPrice && (directCANPrice - adjustedCost) >= 250) {
      return { label: 'Buy Now', class: 'buy', reason: 'HKG saves $250+ vs CAN' };
    }
    if (itinerary.routeType.includes('Open-jaw') && adjustedCost && adjustedCost < 1300) {
      return { label: 'Buy Now', class: 'buy', reason: 'Open-jaw under $1,300 adjusted' };
    }

    // Strong Candidate
    if (dest === 'CAN' && stops <= 1 && cashPrice >= 1250 && cashPrice <= 1350) {
      return { label: 'Strong', class: 'strong', reason: 'CAN 1-stop $1,250-$1,350' };
    }
    if (dest === 'CAN' && stops === 0 && cashPrice >= 1500 && cashPrice <= 1650) {
      return { label: 'Strong', class: 'strong', reason: 'Nonstop CAN $1,500-$1,650' };
    }
    if ((dest === 'HKG' || dest === 'SZX') && adjustedCost && directCANPrice && (directCANPrice - adjustedCost) >= 200) {
      return { label: 'Strong', class: 'strong', reason: `${dest} saves $200+ vs CAN` };
    }
    if ((dest === 'PVG' || dest === 'SHA') && adjustedCost && directCANPrice && (directCANPrice - adjustedCost) >= 400) {
      return { label: 'Strong', class: 'strong', reason: 'PVG/SHA saves $400+ vs CAN' };
    }

    // Watch
    if (dest === 'CAN' && cashPrice >= 1350 && cashPrice <= 1500) {
      return { label: 'Watch', class: 'watch', reason: 'CAN $1,350-$1,500' };
    }
    if (dest === 'HKG' && adjustedCost && directCANPrice) {
      const savings = directCANPrice - adjustedCost;
      if (savings >= 100 && savings < 200) {
        return { label: 'Watch', class: 'watch', reason: 'HKG saves only $100-$200' };
      }
      if (savings < 150) {
        return { label: 'Avoid', class: 'avoid', reason: 'HKG saves < $150' };
      }
    }
    if ((dest === 'PVG' || dest === 'SHA') && adjustedCost && directCANPrice && (directCANPrice - adjustedCost) < 400) {
      return { label: 'Avoid', class: 'avoid', reason: 'PVG/SHA saves < $400' };
    }
  }

  // Award fare recommendations
  if (itinerary.pointsPerPerson) {
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
  const canCash = itineraries.filter(it => it.program === 'cash' && it.destination === 'CAN');
  if (canCash.length === 0) return null;
  return Math.min(...canCash.map(it => it.cashPricePerPerson));
}

// ─── PAYMENT METHOD RECOMMENDATION ───────────────────

function recommendPaymentMethod(itinerary) {
  if (itinerary.program === 'cash') {
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
  const cashTotal = calculateTotalCash(it.cashPricePerPerson);
  const adjustedPerPerson = calculateAdjustedCostPerPerson(it);
  const adjustedTotal = calculateAdjustedTotalCost(it);
  const familyScore = getFamilyScore(it);
  const familyLabel = getFamilyScoreLabel(familyScore);
  const recommendation = getRecommendation(it);
  const savings = calculateSavingsVsCAN(it);
  const cpp = calculateCPP(it);
  const cppRating = getCPPRating(cpp);
  const availability = evaluateAwardAvailability(it);
  const payment = recommendPaymentMethod(it);
  const awardCost = calculateAwardTotalCost(it);

  return {
    ...it,
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
    awardCost
  };
}

function getEnrichedItineraries() {
  return itineraries.map(enrichItinerary);
}

// ─── SUMMARY CARD SELECTORS ──────────────────────────

function getBestOverallOption(enriched) {
  const cashOpts = enriched.filter(it => it.cashPricePerPerson != null);
  if (cashOpts.length === 0) return null;
  return cashOpts.reduce((best, it) => {
    const score = (it.adjustedPerPerson || 9999) - it.familyScore * 30;
    const bestScore = (best.adjustedPerPerson || 9999) - best.familyScore * 30;
    return score < bestScore ? it : best;
  });
}

function getCheapestOption(enriched) {
  const cashOpts = enriched.filter(it => it.cashPricePerPerson != null);
  if (cashOpts.length === 0) return null;
  return cashOpts.reduce((a, b) =>
    (a.adjustedPerPerson || 9999) < (b.adjustedPerPerson || 9999) ? a : b
  );
}

function getBestFamilyOption(enriched) {
  return enriched.reduce((a, b) => a.familyScore > b.familyScore ? a : b);
}

function getBestBackupRoute(enriched) {
  const alts = enriched.filter(it =>
    it.destination !== 'CAN' && !it.routeType.includes('Open-jaw') && it.cashPricePerPerson != null
  );
  if (alts.length === 0) return null;
  return alts.reduce((a, b) =>
    (a.adjustedPerPerson || 9999) < (b.adjustedPerPerson || 9999) ? a : b
  );
}

function getBestCashFor4(enriched) {
  const cashOpts = enriched.filter(it => it.cashPricePerPerson != null);
  if (cashOpts.length === 0) return null;
  return cashOpts.reduce((a, b) => (a.cashTotal || 99999) < (b.cashTotal || 99999) ? a : b);
}

function getBestPointsFor4(enriched) {
  const pointsOpts = enriched.filter(it => it.pointsPerPerson != null && it.availability.bookable);
  if (pointsOpts.length === 0) return null;
  return pointsOpts.reduce((a, b) => (a.cpp || 0) > (b.cpp || 0) ? a : b);
}

function getBestChaseUR(enriched) {
  const chaseOpts = enriched.filter(it =>
    it.program && (it.program.toLowerCase().includes('chase') || it.program.toLowerCase().includes('aeroplan') || it.program.toLowerCase().includes('united'))
  );
  if (chaseOpts.length === 0) return null;
  return chaseOpts.reduce((a, b) => (a.cpp || 0) > (b.cpp || 0) ? a : b);
}

function getBestAmexMR(enriched) {
  const amexOpts = enriched.filter(it =>
    it.program && (it.program.toLowerCase().includes('amex') || it.program.toLowerCase().includes('ana') || it.program.toLowerCase().includes('asia miles') || it.program.toLowerCase().includes('cathay'))
  );
  if (amexOpts.length === 0) return null;
  return amexOpts.reduce((a, b) => (a.cpp || 0) > (b.cpp || 0) ? a : b);
}

function getBestUnitedMiles(enriched) {
  const uaOpts = enriched.filter(it =>
    it.program && it.program.toLowerCase().includes('united')
  );
  if (uaOpts.length === 0) return null;
  return uaOpts.reduce((a, b) => (a.cpp || 0) > (b.cpp || 0) ? a : b);
}

// ─── FILTER LOGIC ────────────────────────────────────

function applyFilters(enriched, filters) {
  return enriched.filter(it => {
    if (filters.maxPrice && it.adjustedPerPerson && it.adjustedPerPerson > filters.maxPrice) return false;
    if (filters.maxDuration && it.totalDurationHours > filters.maxDuration) return false;
    if (!filters.includeHKG && (it.destination.includes('HKG'))) return false;
    if (!filters.includePVG && (it.destination.includes('PVG') || it.destination.includes('SHA'))) return false;
    if (filters.nonstopOnly && it.stops > 0) return false;
    if (!filters.oneStopAllowed && it.stops > 1) return false;
    if (filters.familyFriendlyOnly && it.familyScore < 7) return false;
    if (filters.familyBookableOnly && it.program !== 'cash' && !it.availability.bookable) return false;
    return true;
  });
}
