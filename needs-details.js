/* Incomplete fare observations that need verification */
const NEEDS_DETAILS = [
  {id:"nd-tk-nyc-can",airline:"Turkish Airlines",route:"NYC→CAN",observedPrice:1061,source:"Google Flights",lastSeen:"2026-05-07",missing:["exact dates","flight numbers","connection airport","layover time","baggage","total duration","booking link"],action:"Search Google Flights for TK from EWR/JFK to CAN for Jul 28-Aug 8 outbound, Aug 25-Sep 8 return, 4 passengers."},
  {id:"nd-asiana-nyc-can",airline:"Asiana Airlines",route:"NYC→CAN",observedPrice:1110,source:"Google Flights",lastSeen:"2026-05-07",missing:["exact dates","flight numbers","connection airport (ICN?)","layover time","total duration","booking link"],action:"Search Google Flights for OZ from EWR/JFK to CAN via ICN."},
  {id:"nd-ana-lga-can",airline:"ANA",route:"LGA→CAN",observedPrice:1498,source:"Google Flights",lastSeen:"2026-05-07",missing:["exact dates","flight numbers","connection airport (NRT/HND?)","layover time","total duration","LGA departure confirmation","booking link"],action:"Verify on Google Flights. LGA has no international widebody gates — likely connects via domestic."},
  {id:"nd-cz-jfk-can",airline:"China Southern",route:"JFK→CAN",observedPrice:1265,source:"Google Flights",lastSeen:"2026-05-08",missing:["exact dates","departure/arrival times","fare brand","baggage rules","seat selection","change policy"],action:"Check csair.com for JFK-CAN nonstop around Aug 1 outbound, Aug 29 return, 4 pax."}
];

function renderNeedsDetailsCard(nd) {
  return `<div class="route-card rec-watch" style="border-left-color:var(--watch)">
    <div class="rc-header">
      <div>
        <div class="rc-route">${nd.airline} · ${nd.route}</div>
        <div style="font-size:.8rem;color:var(--muted)">Observed ~$${nd.observedPrice}/pp · ${nd.source} · ${nd.lastSeen}</div>
      </div>
      <div class="rc-tags"><span class="badge badge-watch">Needs Details</span></div>
    </div>
    <div style="margin:10px 0">
      <div style="font-size:.82rem;font-weight:600;margin-bottom:4px">❓ Missing information:</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${nd.missing.map(m=>`<span class="badge badge-neutral">${m}</span>`).join('')}</div>
    </div>
    <div style="margin:10px 0;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
      <div style="font-size:.82rem;font-weight:600;margin-bottom:4px">📋 Next action:</div>
      <div style="font-size:.82rem">${nd.action}</div>
    </div>
    <div class="rc-actions" style="flex-wrap:wrap;margin-top:8px">
      <a href="https://www.google.com/travel/flights" target="_blank" class="btn-sm">🔍 Google Flights</a>
      <span class="btn-sm" style="cursor:pointer" onclick="navigator.clipboard.writeText('${nd.action.replace(/'/g,"\\'")}');this.textContent='✓ Copied!';setTimeout(()=>this.textContent='📋 Copy task',1500)">📋 Copy task</span>
    </div>
  </div>`;
}

function renderNeedsDetailsTab() {
  const el = document.getElementById('needs-details-list');
  if (!el) return;
  el.innerHTML = NEEDS_DETAILS.map(renderNeedsDetailsCard).join('');
}

document.addEventListener('DOMContentLoaded', renderNeedsDetailsTab);
