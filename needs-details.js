/* Incomplete fare observations that need verification - loaded from localStorage if present */
const DEFAULT_NEEDS_DETAILS = [
  {id:"nd-tk-nyc-can",airline:"Turkish Airlines",route:"NYC→CAN",observedPrice:1061,source:"Google Flights",lastSeen:"2026-05-07",missing:["exact dates","flight numbers","connection airport","layover time","baggage","total duration","booking link"],completedMissing:[],action:"Search Google Flights for TK from EWR/JFK to CAN for Jul 28-Aug 8 outbound, Aug 25-Sep 8 return, 4 passengers."},
  {id:"nd-asiana-nyc-can",airline:"Asiana Airlines",route:"NYC→CAN",observedPrice:1110,source:"Google Flights",lastSeen:"2026-05-07",missing:["exact dates","flight numbers","connection airport (ICN?)","layover time","total duration","booking link"],completedMissing:[],action:"Search Google Flights for OZ from EWR/JFK to CAN via ICN."},
  {id:"nd-ana-lga-can",airline:"ANA",route:"LGA→CAN",observedPrice:1498,source:"Google Flights",lastSeen:"2026-05-07",missing:["exact dates","flight numbers","connection airport (NRT/HND?)","layover time","total duration","LGA departure confirmation","booking link"],completedMissing:[],action:"Verify on Google Flights. LGA has no international widebody gates — likely connects via domestic."},
  {id:"nd-cz-jfk-can",airline:"China Southern",route:"JFK→CAN",observedPrice:1265,source:"Google Flights",lastSeen:"2026-05-08",missing:["exact dates","departure/arrival times","fare brand","baggage rules","seat selection","change policy"],completedMissing:[],action:"Check csair.com for JFK-CAN nonstop around Aug 1 outbound, Aug 29 return, 4 pax."}
];

let needsDetailsQueue = [];

function loadQueue() {
  const data = localStorage.getItem('needs_details_queue');
  if (data) {
    try {
      needsDetailsQueue = JSON.parse(data);
    } catch(e) {
      needsDetailsQueue = [...DEFAULT_NEEDS_DETAILS];
    }
  } else {
    needsDetailsQueue = [...DEFAULT_NEEDS_DETAILS];
    saveQueue();
  }
}

function saveQueue() {
  localStorage.setItem('needs_details_queue', JSON.stringify(needsDetailsQueue));
}

function toggleMissingItem(id, item) {
  const nd = needsDetailsQueue.find(q => q.id === id);
  if (!nd) return;
  
  if (!nd.completedMissing) nd.completedMissing = [];
  
  const idx = nd.completedMissing.indexOf(item);
  if (idx > -1) {
    nd.completedMissing.splice(idx, 1);
  } else {
    nd.completedMissing.push(item);
  }
  
  saveQueue();
  renderNeedsDetailsTab();
  
  // Also update parent UI if it lists counts
  if (typeof renderApp === 'function') renderApp();
}

function removeQueueItem(id) {
  needsDetailsQueue = needsDetailsQueue.filter(q => q.id !== id);
  saveQueue();
  renderNeedsDetailsTab();
}

function convertToItinerary(id) {
  const nd = needsDetailsQueue.find(q => q.id === id);
  if (!nd) return;
  
  // Prompt user for final price/details or build a simple mock itinerary
  const airlineCode = nd.airline === 'ANA' ? 'NH' : nd.airline.substring(0,2).toUpperCase();
  const [orig, dest] = nd.route.split('→');
  
  const newIt = {
    id: `custom-${Date.now()}`,
    title: `${orig} → Greater Guangzhou (${dest} alternative)`,
    airline: nd.airline,
    origin: orig,
    destination: dest,
    paymentType: 'cash',
    cashPricePerPerson: nd.observedPrice,
    totalHours: 24,
    stops: 1,
    stopsOutbound: 1,
    stopsReturn: 1,
    sameTicket: true,
    routeFamily: '1-stop alternative',
    outboundDate: '2026-07-28',
    returnDate: '2026-08-25',
    lastCheckedAt: new Date().toISOString().split('T')[0],
    dataSource: 'Manual entry from queue',
    outboundSegments: [
      { marketingAirline: airlineCode, flightNumber: `${airlineCode}123`, cabin: 'Economy', origin: orig, destination: 'NRT', departureTime: '12:00', arrivalTime: '15:00+1', durationMinutes: 840, layoverAfterMinutes: 120 }
    ],
    returnSegments: [
      { marketingAirline: airlineCode, flightNumber: `${airlineCode}456`, cabin: 'Economy', origin: 'NRT', destination: orig, departureTime: '17:00', arrivalTime: '16:00', durationMinutes: 780, layoverAfterMinutes: 0 }
    ]
  };

  // Add to itineraries database (requires editing in-memory/localStorage itineraries)
  if (typeof itineraries !== 'undefined') {
    itineraries.push(newIt);
    // Persist user-added itineraries in localStorage
    const manualItin = JSON.parse(localStorage.getItem('manual_itineraries') || '[]');
    manualItin.push(newIt);
    localStorage.setItem('manual_itineraries', JSON.stringify(manualItin));
    
    // Remove from queue
    removeQueueItem(id);
    
    alert(`Successfully converted observation to active itinerary!`);
    
    // Switch to Flights tab
    const btn = document.querySelector('[data-tab="flights"]');
    if (btn) btn.click();
    
    if (typeof renderApp === 'function') renderApp();
  } else {
    alert("Unable to add itinerary: itineraries array not found.");
  }
}

function addNewObservation(e) {
  if (e) e.preventDefault();
  const airline = document.getElementById('nd-add-airline').value;
  const route = document.getElementById('nd-add-route').value;
  const price = parseFloat(document.getElementById('nd-add-price').value);
  const source = document.getElementById('nd-add-source').value || 'Manual';
  const missingStr = document.getElementById('nd-add-missing').value;
  const action = document.getElementById('nd-add-action').value;
  
  if (!airline || !route || isNaN(price)) {
    alert("Please fill in Airline, Route, and Price!");
    return;
  }
  
  const missing = missingStr.split(',').map(s => s.trim()).filter(Boolean);
  
  const newItem = {
    id: `nd-custom-${Date.now()}`,
    airline,
    route,
    observedPrice: price,
    source,
    lastSeen: new Date().toISOString().split('T')[0],
    missing,
    completedMissing: [],
    action: action || `Search for details for ${airline} ${route}`
  };
  
  needsDetailsQueue.push(newItem);
  saveQueue();
  renderNeedsDetailsTab();
  
  // Clear form
  document.getElementById('nd-add-form').reset();
  toggleAddForm();
}

function toggleAddForm() {
  const form = document.getElementById('nd-form-container');
  const btn = document.getElementById('nd-toggle-form-btn');
  if (form && btn) {
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    btn.textContent = isHidden ? '✕ Close Form' : '➕ Add New Observation';
  }
}

function exportAllData() {
  const manual = localStorage.getItem('manual_itineraries') || '[]';
  const priceOverrides = localStorage.getItem('price_overrides') || '{}';
  const queue = localStorage.getItem('needs_details_queue') || '[]';
  const settings = localStorage.getItem('monitor_settings') || '{}';
  
  const payload = {
    exportDate: new Date().toISOString(),
    manualItineraries: JSON.parse(manual),
    priceOverrides: JSON.parse(priceOverrides),
    verificationQueue: JSON.parse(queue),
    settings: JSON.parse(settings)
  };
  
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flight_monitor_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importAllData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (data.manualItineraries) localStorage.setItem('manual_itineraries', JSON.stringify(data.manualItineraries));
      if (data.priceOverrides) localStorage.setItem('price_overrides', JSON.stringify(data.priceOverrides));
      if (data.verificationQueue) localStorage.setItem('needs_details_queue', JSON.stringify(data.verificationQueue));
      if (data.settings) localStorage.setItem('monitor_settings', JSON.stringify(data.settings));
      
      alert("Import completed successfully! Reloading page to apply changes...");
      window.location.reload();
    } catch(err) {
      alert("Error parsing JSON backup file. Please make sure it is a valid backup file.");
    }
  };
  reader.readAsText(file);
}

function renderNeedsDetailsCard(nd) {
  if (!nd.completedMissing) nd.completedMissing = [];
  const allResolved = nd.missing.every(m => nd.completedMissing.includes(m));
  
  const listItems = nd.missing.map(m => {
    const isChecked = nd.completedMissing.includes(m);
    return `<label style="display:flex;align-items:center;gap:6px;font-size:.8rem;cursor:pointer;padding:4px 0">
      <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleMissingItem('${nd.id}', '${m}')">
      <span style="${isChecked ? 'text-decoration:line-through;color:var(--muted)' : ''}">${m}</span>
    </label>`;
  }).join('');
  
  const statusBadge = allResolved 
    ? '<span class="badge badge-buy">Ready to Convert</span>'
    : `<span class="badge badge-watch">${nd.missing.length - nd.completedMissing.length} Missing</span>`;

  const convertBtn = allResolved
    ? `<button class="btn-sm primary" onclick="convertToItinerary('${nd.id}')">⚡ Convert to Active Itinerary</button>`
    : '';

  return `<div class="route-card rec-${allResolved?'buy':'watch'}" style="border-left-color:var(--${allResolved?'buy':'watch'})">
    <div class="rc-header">
      <div>
        <div class="rc-route">${nd.airline} · ${nd.route}</div>
        <div style="font-size:.8rem;color:var(--muted)">Observed Price: ~$${nd.observedPrice}/pp · Source: ${nd.source} · Last Seen: ${nd.lastSeen}</div>
      </div>
      <div class="rc-tags">${statusBadge}</div>
    </div>
    
    <div style="margin:10px 0;display:grid;grid-template-columns:1fr;gap:10px">
      <div>
        <div style="font-size:.82rem;font-weight:600;margin-bottom:4px">📋 Checklist to complete info:</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:2px">${listItems}</div>
      </div>
    </div>
    
    <div style="margin:10px 0;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
      <div style="font-size:.82rem;font-weight:600;margin-bottom:4px">📋 Next search action:</div>
      <div style="font-size:.82rem">${nd.action}</div>
    </div>
    
    <div class="rc-actions" style="flex-wrap:wrap;margin-top:8px">
      <a href="https://www.google.com/travel/flights" target="_blank" class="btn-sm">🔍 Open Google Flights</a>
      <span class="btn-sm" style="cursor:pointer" onclick="navigator.clipboard.writeText('${nd.action.replace(/'/g,"\\'")}');this.textContent='✓ Copied!';setTimeout(()=>this.textContent='📋 Copy search task',1500)">📋 Copy search task</span>
      ${convertBtn}
      <button class="btn-sm" style="border-color:var(--avoid);color:var(--avoid);margin-left:auto" onclick="removeQueueItem('${nd.id}')">✕ Delete</button>
    </div>
  </div>`;
}

function renderNeedsDetailsTab() {
  const listEl = document.getElementById('needs-details-list');
  if (!listEl) return;
  
  if (needsDetailsQueue.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">
      <h3>🎉 Verification Queue is empty!</h3>
      <p style="font-size:.85rem;margin-top:4px">All observations have been resolved and converted.</p>
    </div>`;
    return;
  }
  
  listEl.innerHTML = needsDetailsQueue.map(renderNeedsDetailsCard).join('');
}

// Bind load lifecycle
document.addEventListener('DOMContentLoaded', () => {
  loadQueue();
  renderNeedsDetailsTab();
  
  // Inject the Add Form HTML container and Import/Export panel inside the needs-details section in index.html dynamically
  const container = document.getElementById('needs-details');
  if (container) {
    // Add Form HTML
    const addSection = document.createElement('div');
    addSection.style.marginBottom = '20px';
    addSection.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <button id="nd-toggle-form-btn" class="btn-sm primary" onclick="toggleAddForm()">➕ Add New Observation</button>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn-sm" onclick="exportAllData()" title="Backup settings, queue, and overrides to a file">📤 Export Data Backup</button>
          <label class="btn-sm" style="cursor:pointer;margin:0" title="Load backup file">
            📥 Import Backup
            <input type="file" accept=".json" onchange="importAllData(event)" style="display:none">
          </label>
        </div>
      </div>
      
      <div id="nd-form-container" style="display:none;background:var(--card);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px;margin-bottom:20px;box-shadow:var(--sh-sm)">
        <h4 style="margin-bottom:12px">➕ Record a new flight observation needing details</h4>
        <form id="nd-add-form" onsubmit="addNewObservation(event)">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:12px">
            <div>
              <label style="display:block;font-size:.78rem;color:var(--muted);margin-bottom:4px">Airline *</label>
              <input type="text" id="nd-add-airline" placeholder="e.g. Cathay Pacific" required style="width:100%;padding:6px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text)">
            </div>
            <div>
              <label style="display:block;font-size:.78rem;color:var(--muted);margin-bottom:4px">Route *</label>
              <input type="text" id="nd-add-route" placeholder="e.g. JFK→CAN" required style="width:100%;padding:6px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text)">
            </div>
            <div>
              <label style="display:block;font-size:.78rem;color:var(--muted);margin-bottom:4px">Observed Price ($/pp) *</label>
              <input type="number" id="nd-add-price" placeholder="e.g. 1250" required style="width:100%;padding:6px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text)">
            </div>
            <div>
              <label style="display:block;font-size:.78rem;color:var(--muted);margin-bottom:4px">Observation Source</label>
              <input type="text" id="nd-add-source" placeholder="e.g. Xiaohongshu, Google Flights" style="width:100%;padding:6px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text)">
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="display:block;font-size:.78rem;color:var(--muted);margin-bottom:4px">Missing Details (comma-separated checklist items)</label>
            <input type="text" id="nd-add-missing" placeholder="e.g. baggage, exact dates, flight number" style="width:100%;padding:6px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text)">
          </div>
          <div style="margin-bottom:12px">
            <label style="display:block;font-size:.78rem;color:var(--muted);margin-bottom:4px">Instructions for Next Search</label>
            <textarea id="nd-add-action" placeholder="Instructions on where and when to check this fare again..." style="width:100%;height:60px;padding:6px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:inherit"></textarea>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button type="button" class="btn-sm" onclick="toggleAddForm()">Cancel</button>
            <button type="submit" class="btn-sm primary">Add Observation</button>
          </div>
        </form>
      </div>
    `;
    // Prepend form to list
    container.insertBefore(addSection, container.querySelector('#needs-details-list'));
  }
});
