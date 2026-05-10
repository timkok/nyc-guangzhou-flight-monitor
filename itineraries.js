const ITINERARIES=[
{id:"jfk-can-cz328",title:"JFK→CAN Nonstop",routeFamily:"Direct CAN",paymentType:"cash",recommendation:"Strong",recommendationReason:"Nonstop CAN $1,520/pp",outboundDate:"2026-07-28",returnDate:"2026-08-30",origin:"JFK",destination:"CAN",returnOrigin:"CAN",returnDestination:"JFK",airline:"China Southern",alliance:"SkyTeam",cashPricePerPerson:1520,totalCashForFamily:6080,adjustedTotalForFamily:6080,pointsProgram:null,pointsPerPerson:null,totalPointsForFamily:null,taxesPerPerson:0,cpp:null,passengerCount:4,adults:2,children:2,totalDurationMinutesOutbound:950,totalDurationMinutesReturn:960,stopsOutbound:0,stopsReturn:0,sameTicket:true,baggageIncluded:"2x23kg",changePolicy:"$200 fee",cancellationPolicy:"Non-refundable",awardSeatsAvailable:null,familyBookable:true,riskLevel:"Low",riskChips:[],
outboundSegments:[{segmentNumber:1,marketingAirline:"CZ",flightNumber:"CZ600",aircraft:"A380",cabin:"Economy",origin:"JFK",destination:"CAN",departureTime:"01:45",arrivalTime:"05:35+1",durationMinutes:950,layoverAfterMinutes:0,bookingClass:"L"}],
returnSegments:[{segmentNumber:1,marketingAirline:"CZ",flightNumber:"CZ399",aircraft:"A380",cabin:"Economy",origin:"CAN",destination:"JFK",departureTime:"20:00",arrivalTime:"22:00",durationMinutes:960,layoverAfterMinutes:0,bookingClass:"L"}],
links:{googleFlights:"https://www.google.com/travel/flights?q=JFK+to+CAN+July+28",airlineDirect:"https://www.csair.com/us/en/",united:null,chase:null},notes:"Best nonstop option. Summer peak pricing.",lastCheckedAt:"2026-05-09",dataSource:"Google Flights"},

{id:"ewr-can-tk-ist",title:"EWR→IST→CAN via Turkish",routeFamily:"One-stop CAN",paymentType:"cash",recommendation:"Strong",recommendationReason:"CAN 1-stop $1,190/pp, 26h",outboundDate:"2026-07-29",returnDate:"2026-09-01",origin:"EWR",destination:"CAN",returnOrigin:"CAN",returnDestination:"EWR",airline:"Turkish Airlines",alliance:"Star Alliance",cashPricePerPerson:1190,totalCashForFamily:4760,adjustedTotalForFamily:4760,pointsProgram:null,pointsPerPerson:null,totalPointsForFamily:null,taxesPerPerson:0,cpp:null,passengerCount:4,adults:2,children:2,totalDurationMinutesOutbound:1560,totalDurationMinutesReturn:1500,stopsOutbound:1,stopsReturn:1,sameTicket:true,baggageIncluded:"2x23kg",changePolicy:"$150 fee",cancellationPolicy:"Non-refundable",awardSeatsAvailable:null,familyBookable:true,riskLevel:"Low",riskChips:["Long duration"],
outboundSegments:[
{segmentNumber:1,marketingAirline:"TK",flightNumber:"TK30",aircraft:"777-300ER",cabin:"Economy",origin:"EWR",destination:"IST",departureTime:"22:30",arrivalTime:"16:30+1",durationMinutes:630,layoverAfterMinutes:195,bookingClass:"T"},
{segmentNumber:2,marketingAirline:"TK",flightNumber:"TK72",aircraft:"A330",cabin:"Economy",origin:"IST",destination:"CAN",departureTime:"19:45",arrivalTime:"11:00+1",durationMinutes:600,layoverAfterMinutes:0,bookingClass:"T"}],
returnSegments:[
{segmentNumber:1,marketingAirline:"TK",flightNumber:"TK73",aircraft:"A330",cabin:"Economy",origin:"CAN",destination:"IST",departureTime:"12:30",arrivalTime:"19:00",durationMinutes:720,layoverAfterMinutes:150,bookingClass:"T"},
{segmentNumber:2,marketingAirline:"TK",flightNumber:"TK29",aircraft:"777-300ER",cabin:"Economy",origin:"IST",destination:"EWR",departureTime:"21:30",arrivalTime:"01:30+1",durationMinutes:630,layoverAfterMinutes:0,bookingClass:"T"}],
links:{googleFlights:"https://www.google.com/travel/flights?q=EWR+to+CAN+July+29",airlineDirect:"https://www.turkishairlines.com/"},notes:"Affordable but long. IST layover is comfortable.",lastCheckedAt:"2026-05-09",dataSource:"Google Flights"},

{id:"jfk-hkg-cx-nonstop",title:"JFK→HKG Nonstop Cathay",routeFamily:"HKG Alternative",paymentType:"cash",recommendation:"Strong",recommendationReason:"HKG saves $320 vs CAN adjusted",outboundDate:"2026-07-28",returnDate:"2026-08-30",origin:"JFK",destination:"HKG",returnOrigin:"HKG",returnDestination:"JFK",airline:"Cathay Pacific",alliance:"Oneworld",cashPricePerPerson:1150,totalCashForFamily:4600,adjustedTotalForFamily:5400,pointsProgram:null,pointsPerPerson:null,totalPointsForFamily:null,taxesPerPerson:0,cpp:null,passengerCount:4,adults:2,children:2,totalDurationMinutesOutbound:960,totalDurationMinutesReturn:975,stopsOutbound:0,stopsReturn:0,sameTicket:true,baggageIncluded:"1x30kg",changePolicy:"$250 fee",cancellationPolicy:"Non-refundable",awardSeatsAvailable:null,familyBookable:true,riskLevel:"Low",riskChips:["Airport transfer"],
outboundSegments:[{segmentNumber:1,marketingAirline:"CX",flightNumber:"CX845",aircraft:"A350-1000",cabin:"Economy",origin:"JFK",destination:"HKG",departureTime:"00:30",arrivalTime:"05:30+1",durationMinutes:960,layoverAfterMinutes:0,bookingClass:"N"}],
returnSegments:[{segmentNumber:1,marketingAirline:"CX",flightNumber:"CX846",aircraft:"A350-1000",cabin:"Economy",origin:"HKG",destination:"JFK",departureTime:"18:00",arrivalTime:"21:15",durationMinutes:975,layoverAfterMinutes:0,bookingClass:"N"}],
links:{googleFlights:"https://www.google.com/travel/flights?q=JFK+to+HKG+July+28",airlineDirect:"https://www.cathaypacific.com/cx/en_US.html",cathayAsiaMiles:"https://www.cathaypacific.com/cx/en_US/redeem-miles/flights.html"},notes:"Nonstop HKG, then high-speed rail to GZ (~1h). Cathay A350 is very comfortable.",lastCheckedAt:"2026-05-09",dataSource:"Google Flights"},

{id:"ewr-hkg-br-tpe",title:"EWR→TPE→HKG via EVA Air",routeFamily:"HKG Alternative",paymentType:"cash",recommendation:"Watch",recommendationReason:"HKG 1-stop, decent price",outboundDate:"2026-07-30",returnDate:"2026-09-02",origin:"EWR",destination:"HKG",returnOrigin:"HKG",returnDestination:"EWR",airline:"EVA Air",alliance:"Star Alliance",cashPricePerPerson:1080,totalCashForFamily:4320,adjustedTotalForFamily:5120,pointsProgram:null,pointsPerPerson:null,totalPointsForFamily:null,taxesPerPerson:0,cpp:null,passengerCount:4,adults:2,children:2,totalDurationMinutesOutbound:1200,totalDurationMinutesReturn:1230,stopsOutbound:1,stopsReturn:1,sameTicket:true,baggageIncluded:"2x23kg",changePolicy:"$150 fee",cancellationPolicy:"Non-refundable",awardSeatsAvailable:null,familyBookable:true,riskLevel:"Low",riskChips:["Airport transfer"],
outboundSegments:[
{segmentNumber:1,marketingAirline:"BR",flightNumber:"BR31",aircraft:"777-300ER",cabin:"Economy",origin:"EWR",destination:"TPE",departureTime:"00:05",arrivalTime:"05:45+1",durationMinutes:900,layoverAfterMinutes:135,bookingClass:"K"},
{segmentNumber:2,marketingAirline:"BR",flightNumber:"BR857",aircraft:"A321",cabin:"Economy",origin:"TPE",destination:"HKG",departureTime:"08:00",arrivalTime:"09:55",durationMinutes:115,layoverAfterMinutes:0,bookingClass:"K"}],
returnSegments:[
{segmentNumber:1,marketingAirline:"BR",flightNumber:"BR856",aircraft:"A321",cabin:"Economy",origin:"HKG",destination:"TPE",departureTime:"11:00",arrivalTime:"12:50",durationMinutes:110,layoverAfterMinutes:190,bookingClass:"K"},
{segmentNumber:2,marketingAirline:"BR",flightNumber:"BR32",aircraft:"777-300ER",cabin:"Economy",origin:"TPE",destination:"EWR",departureTime:"16:00",arrivalTime:"19:30",durationMinutes:930,layoverAfterMinutes:0,bookingClass:"K"}],
links:{googleFlights:"https://www.google.com/travel/flights?q=EWR+to+HKG+July+30",airlineDirect:"https://www.evaair.com/"},notes:"Via TPE. Good connection, EVA is family-friendly airline.",lastCheckedAt:"2026-05-09",dataSource:"Google Flights"},

{id:"jfk-pvg-mu-nonstop",title:"JFK→PVG Nonstop China Eastern",routeFamily:"PVG/SHA Alternative",paymentType:"cash",recommendation:"Watch",recommendationReason:"PVG saves < $400 adjusted",outboundDate:"2026-07-28",returnDate:"2026-08-31",origin:"JFK",destination:"PVG",returnOrigin:"PVG",returnDestination:"JFK",airline:"China Eastern",alliance:"SkyTeam",cashPricePerPerson:950,totalCashForFamily:3800,adjustedTotalForFamily:5400,pointsProgram:null,pointsPerPerson:null,totalPointsForFamily:null,taxesPerPerson:0,cpp:null,passengerCount:4,adults:2,children:2,totalDurationMinutesOutbound:900,totalDurationMinutesReturn:930,stopsOutbound:0,stopsReturn:0,sameTicket:true,baggageIncluded:"2x23kg",changePolicy:"$200 fee",cancellationPolicy:"Non-refundable",awardSeatsAvailable:null,familyBookable:true,riskLevel:"Medium",riskChips:["Domestic add-on","Airport transfer"],
outboundSegments:[{segmentNumber:1,marketingAirline:"MU",flightNumber:"MU588",aircraft:"777-300ER",cabin:"Economy",origin:"JFK",destination:"PVG",departureTime:"16:00",arrivalTime:"19:00+1",durationMinutes:900,layoverAfterMinutes:0,bookingClass:"M"}],
returnSegments:[{segmentNumber:1,marketingAirline:"MU",flightNumber:"MU587",aircraft:"777-300ER",cabin:"Economy",origin:"PVG",destination:"JFK",departureTime:"11:00",arrivalTime:"12:30",durationMinutes:930,layoverAfterMinutes:0,bookingClass:"M"}],
links:{googleFlights:"https://www.google.com/travel/flights?q=JFK+to+PVG+July+28",airlineDirect:"https://us.ceair.com/"},notes:"Cheap but need domestic flight/train CAN→PVG. Add ~$100-200 + 2.5h.",lastCheckedAt:"2026-05-09",dataSource:"Google Flights"},

{id:"jfk-szx-ke-icn",title:"JFK→ICN→SZX via Korean Air",routeFamily:"SZX Alternative",paymentType:"cash",recommendation:"Watch",recommendationReason:"SZX alternative, decent price",outboundDate:"2026-07-28",returnDate:"2026-08-30",origin:"JFK",destination:"SZX",returnOrigin:"SZX",returnDestination:"JFK",airline:"Korean Air",alliance:"SkyTeam",cashPricePerPerson:1200,totalCashForFamily:4800,adjustedTotalForFamily:5200,pointsProgram:null,pointsPerPerson:null,totalPointsForFamily:null,taxesPerPerson:0,cpp:null,passengerCount:4,adults:2,children:2,totalDurationMinutesOutbound:1320,totalDurationMinutesReturn:1350,stopsOutbound:1,stopsReturn:1,sameTicket:true,baggageIncluded:"2x23kg",changePolicy:"$150 fee",cancellationPolicy:"Non-refundable",awardSeatsAvailable:null,familyBookable:true,riskLevel:"Low",riskChips:["Airport transfer"],
outboundSegments:[
{segmentNumber:1,marketingAirline:"KE",flightNumber:"KE82",aircraft:"747-8i",cabin:"Economy",origin:"JFK",destination:"ICN",departureTime:"13:20",arrivalTime:"17:20+1",durationMinutes:840,layoverAfterMinutes:180,bookingClass:"U"},
{segmentNumber:2,marketingAirline:"KE",flightNumber:"KE827",aircraft:"A330",cabin:"Economy",origin:"ICN",destination:"SZX",departureTime:"20:20",arrivalTime:"23:00",durationMinutes:300,layoverAfterMinutes:0,bookingClass:"U"}],
returnSegments:[
{segmentNumber:1,marketingAirline:"KE",flightNumber:"KE828",aircraft:"A330",cabin:"Economy",origin:"SZX",destination:"ICN",departureTime:"00:10",arrivalTime:"04:30",durationMinutes:260,layoverAfterMinutes:330,bookingClass:"U"},
{segmentNumber:2,marketingAirline:"KE",flightNumber:"KE81",aircraft:"747-8i",cabin:"Economy",origin:"ICN",destination:"JFK",departureTime:"10:00",arrivalTime:"11:00",durationMinutes:780,layoverAfterMinutes:0,bookingClass:"U"}],
links:{googleFlights:"https://www.google.com/travel/flights?q=JFK+to+SZX+July+28",airlineDirect:"https://www.koreanair.com/"},notes:"Via ICN. Good connection, Korean Air is excellent.",lastCheckedAt:"2026-05-09",dataSource:"Google Flights"},

{id:"openjaw-jfk-can-hkg-jfk",title:"Open-jaw: JFK→CAN, HKG→JFK",routeFamily:"Open-jaw",paymentType:"cash",recommendation:"Strong",recommendationReason:"Fly into CAN, return from HKG",outboundDate:"2026-07-28",returnDate:"2026-09-01",origin:"JFK",destination:"CAN",returnOrigin:"HKG",returnDestination:"JFK",airline:"CZ + CX",alliance:"Mixed",cashPricePerPerson:1350,totalCashForFamily:5400,adjustedTotalForFamily:5400,pointsProgram:null,pointsPerPerson:null,totalPointsForFamily:null,taxesPerPerson:0,cpp:null,passengerCount:4,adults:2,children:2,totalDurationMinutesOutbound:950,totalDurationMinutesReturn:975,stopsOutbound:0,stopsReturn:0,sameTicket:false,baggageIncluded:"Varies",changePolicy:"Per airline",cancellationPolicy:"Per airline",awardSeatsAvailable:null,familyBookable:true,riskLevel:"Medium",riskChips:["Separate tickets"],
outboundSegments:[{segmentNumber:1,marketingAirline:"CZ",flightNumber:"CZ600",aircraft:"A380",cabin:"Economy",origin:"JFK",destination:"CAN",departureTime:"01:45",arrivalTime:"05:35+1",durationMinutes:950,layoverAfterMinutes:0,bookingClass:"L"}],
returnSegments:[{segmentNumber:1,marketingAirline:"CX",flightNumber:"CX846",aircraft:"A350-1000",cabin:"Economy",origin:"HKG",destination:"JFK",departureTime:"18:00",arrivalTime:"21:15",durationMinutes:975,layoverAfterMinutes:0,bookingClass:"N"}],
links:{googleFlights:"https://www.google.com/travel/flights",airlineDirect:null},notes:"Best of both: arrive CAN directly, return via HKG. Need separate bookings.",lastCheckedAt:"2026-05-09",dataSource:"Manual"},

{id:"ewr-hkg-ua-award",title:"EWR→HKG United Award",routeFamily:"HKG Alternative",paymentType:"points",recommendation:"Strong",recommendationReason:"1.8 cpp, 4 seats available",outboundDate:"2026-07-28",returnDate:"2026-08-30",origin:"EWR",destination:"HKG",returnOrigin:"HKG",returnDestination:"EWR",airline:"United",alliance:"Star Alliance",cashPricePerPerson:null,totalCashForFamily:null,adjustedTotalForFamily:null,pointsProgram:"United MileagePlus",pointsPerPerson:55000,totalPointsForFamily:220000,taxesPerPerson:85,cpp:1.8,passengerCount:4,adults:2,children:2,totalDurationMinutesOutbound:960,totalDurationMinutesReturn:1005,stopsOutbound:0,stopsReturn:0,sameTicket:true,baggageIncluded:"2x23kg",changePolicy:"Free for members",cancellationPolicy:"Redeposit miles",awardSeatsAvailable:4,familyBookable:true,riskLevel:"Low",riskChips:[],
outboundSegments:[{segmentNumber:1,marketingAirline:"UA",flightNumber:"UA179",aircraft:"777-200ER",cabin:"Economy",origin:"EWR",destination:"HKG",departureTime:"00:35",arrivalTime:"05:35+1",durationMinutes:960,layoverAfterMinutes:0,bookingClass:"X"}],
returnSegments:[{segmentNumber:1,marketingAirline:"UA",flightNumber:"UA180",aircraft:"777-200ER",cabin:"Economy",origin:"HKG",destination:"EWR",departureTime:"10:00",arrivalTime:"13:45",durationMinutes:1005,layoverAfterMinutes:0,bookingClass:"X"}],
links:{googleFlights:"https://www.google.com/travel/flights?q=EWR+to+HKG",airlineDirect:null,united:"https://www.united.com/en/us/fsr/choose-flights?f=EWR&t=HKG",chase:"https://ultimaterewardspoints.chase.com/travel"},notes:"Saver award, all 4 seats available. Excellent cpp. Transfer from Chase UR or use existing United miles.",lastCheckedAt:"2026-05-09",dataSource:"United.com"},

{id:"ewr-can-ac-yvr-award",title:"EWR→YVR→CAN Aeroplan Award",routeFamily:"One-stop CAN",paymentType:"points",recommendation:"Watch",recommendationReason:"2.2 cpp, 4 seats, but 24h duration",outboundDate:"2026-07-30",returnDate:"2026-08-31",origin:"EWR",destination:"CAN",returnOrigin:"CAN",returnDestination:"EWR",airline:"Air Canada",alliance:"Star Alliance",cashPricePerPerson:null,totalCashForFamily:null,adjustedTotalForFamily:null,pointsProgram:"Chase UR → Aeroplan",pointsPerPerson:50000,totalPointsForFamily:200000,taxesPerPerson:110,cpp:2.2,passengerCount:4,adults:2,children:2,totalDurationMinutesOutbound:1440,totalDurationMinutesReturn:1380,stopsOutbound:1,stopsReturn:1,sameTicket:true,baggageIncluded:"2x23kg",changePolicy:"Free",cancellationPolicy:"Redeposit free",awardSeatsAvailable:4,familyBookable:true,riskLevel:"Low",riskChips:["Long duration"],
outboundSegments:[
{segmentNumber:1,marketingAirline:"AC",flightNumber:"AC735",aircraft:"737 MAX 8",cabin:"Economy",origin:"EWR",destination:"YVR",departureTime:"08:00",arrivalTime:"10:45",durationMinutes:345,layoverAfterMinutes:195,bookingClass:"I"},
{segmentNumber:2,marketingAirline:"AC",flightNumber:"AC025",aircraft:"787-9",cabin:"Economy",origin:"YVR",destination:"CAN",departureTime:"14:00",arrivalTime:"18:00+1",durationMinutes:720,layoverAfterMinutes:0,bookingClass:"I"}],
returnSegments:[
{segmentNumber:1,marketingAirline:"AC",flightNumber:"AC026",aircraft:"787-9",cabin:"Economy",origin:"CAN",destination:"YVR",departureTime:"20:00",arrivalTime:"17:00",durationMinutes:660,layoverAfterMinutes:180,bookingClass:"I"},
{segmentNumber:2,marketingAirline:"AC",flightNumber:"AC736",aircraft:"737 MAX 8",cabin:"Economy",origin:"YVR",destination:"EWR",departureTime:"20:00",arrivalTime:"04:00+1",durationMinutes:300,layoverAfterMinutes:0,bookingClass:"I"}],
links:{aeroplan:"https://www.aircanada.com/aeroplan",chase:"https://ultimaterewardspoints.chase.com/travel"},notes:"Via YVR. Long but family bookable with 4 Aeroplan seats. Transfer Chase UR.",lastCheckedAt:"2026-05-09",dataSource:"Aeroplan"}
];

function getLayoverQuality(mins){
  if(!mins||mins===0)return null;
  if(mins<75)return{label:"Tight",cls:"avoid",icon:"⚠️"};
  if(mins<=120)return{label:"Acceptable",cls:"watch",icon:"⏱️"};
  if(mins<=240)return{label:"Good",cls:"buy",icon:"✅"};
  if(mins<=360)return{label:"Long",cls:"watch",icon:"⏳"};
  if(mins<=720)return{label:"Very Long",cls:"avoid",icon:"😴"};
  return{label:"Overnight",cls:"avoid",icon:"🌙"};
}
function fmtDur(m){const h=Math.floor(m/60);const mm=m%60;return h+"h"+(mm>0?mm+"m":"");}
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
  return { score, max, pct, complete: pct >= 80, label: pct >= 80 ? 'Complete' : 'Needs details' };
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
  const fam = it.passengerCount;

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
    `Passengers: ${it.adults} adults + ${it.children} children = ${it.passengerCount}`,
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
