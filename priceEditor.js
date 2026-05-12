/* ═══════════════════════════════════════════════════════
   PRICE EDITOR — edit cash prices, commit to GitHub
   Stores config in localStorage:
     - ghToken      : fine-grained PAT with contents:write on the repo
     - ghRepo       : "owner/repo"
     - ghBranch     : branch name (default "main")
     - liveApiUrl   : optional Cloudflare Worker URL (reused from Settings)
   ═══════════════════════════════════════════════════════ */

const PE_DEFAULTS = { repo: 'timkok/nyc-guangzhou-flight-monitor', branch: 'main', path: 'overrides.js' };

function peLoadCfg() {
  return {
    token: localStorage.getItem('ghToken') || '',
    repo: localStorage.getItem('ghRepo') || PE_DEFAULTS.repo,
    branch: localStorage.getItem('ghBranch') || PE_DEFAULTS.branch,
    apiUrl: localStorage.getItem('liveApiUrl') || '',
  };
}

function peSaveCfg(cfg) {
  if (cfg.token != null) localStorage.setItem('ghToken', cfg.token);
  if (cfg.repo) localStorage.setItem('ghRepo', cfg.repo);
  if (cfg.branch) localStorage.setItem('ghBranch', cfg.branch);
}

function peEscapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function peCurrentOverrides() {
  return JSON.parse(JSON.stringify((window.priceOverrides && typeof window.priceOverrides === 'object') ? window.priceOverrides : {}));
}

function peCashItineraries() {
  return itineraries.filter(it => it.program === 'cash');
}

function showPriceEditor() {
  const cfg = peLoadCfg();
  const cash = peCashItineraries();
  const overrides = peCurrentOverrides();

  const rows = cash.map(it => {
    const ov = overrides[it.id] || {};
    const stamp = ov.updatedAt ? new Date(ov.updatedAt).toLocaleDateString() : '';
    return `<tr data-id="${peEscapeHtml(it.id)}">
      <td style="padding:6px 8px;font-size:.85rem"><div><strong>${peEscapeHtml(it.origin)} → ${peEscapeHtml(it.destination)}</strong></div><div style="color:var(--muted);font-size:.75rem">${peEscapeHtml(it.airline)} · ${it.stops === 0 ? 'nonstop' : it.stops + '-stop'} · ${peEscapeHtml(it.outboundDate || '')}</div></td>
      <td style="padding:6px 8px"><input type="number" class="pe-price" data-id="${peEscapeHtml(it.id)}" value="${it.cashPricePerPerson ?? ''}" placeholder="—" style="width:90px"></td>
      <td style="padding:6px 8px;color:var(--muted);font-size:.75rem">${stamp}</td>
    </tr>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'price-editor-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `<div style="background:var(--card);border-radius:var(--r-lg);padding:24px;max-width:760px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:var(--sh-lg)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="font-size:1.05rem">✏️ Edit cash prices</h3>
      <button onclick="this.closest('#price-editor-modal').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer">✕</button>
    </div>
    <div style="font-size:.85rem;color:var(--muted);margin-bottom:12px">Edit price-per-person for each cash route. Saving commits <code>overrides.js</code> to GitHub on branch <code>${peEscapeHtml(cfg.branch)}</code>; GitHub Pages redeploys within a minute.</div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead><tr style="text-align:left;font-size:.75rem;color:var(--muted);border-bottom:1px solid var(--border)"><th style="padding:6px 8px">Route</th><th style="padding:6px 8px">$/pp</th><th style="padding:6px 8px">Last edit</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      ${cfg.apiUrl ? `<button class="btn-sm" onclick="peFetchLive()">⤵️ Prefill from live API</button>` : `<span style="font-size:.8rem;color:var(--muted)">Set a Worker URL in ⚙️ Settings to prefill from live API.</span>`}
      <button class="btn-sm" onclick="peResetRow()" title="Reset all rows to baseline data.js values">↺ Clear overrides</button>
    </div>

    <div class="section-head" style="font-size:.85rem">GitHub repo</div>
    <div style="display:grid;gap:8px;margin:8px 0 12px">
      <div class="fg"><label style="min-width:90px">Repo</label><input type="text" id="pe-repo" value="${peEscapeHtml(cfg.repo)}" placeholder="owner/repo" style="flex:1"></div>
      <div class="fg"><label style="min-width:90px">Branch</label><input type="text" id="pe-branch" value="${peEscapeHtml(cfg.branch)}" style="flex:1"></div>
      <div class="fg"><label style="min-width:90px">PAT</label><input type="password" id="pe-token" value="${peEscapeHtml(cfg.token)}" placeholder="github_pat_..." style="flex:1"></div>
      <div style="font-size:.75rem;color:var(--muted)">Create a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank">fine-grained PAT</a> scoped to this repo only with <strong>Contents: Read and write</strong>. Stored in your browser's localStorage.</div>
    </div>

    <div id="pe-status" style="font-size:.85rem;margin-bottom:10px;min-height:1.2em"></div>

    <div style="display:flex;gap:8px">
      <button class="btn-sm primary" onclick="peCommit()">💾 Save & commit to GitHub</button>
      <button class="btn-sm" onclick="this.closest('#price-editor-modal').remove()">Cancel</button>
    </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function peReadFormPrices() {
  const out = {};
  document.querySelectorAll('#price-editor-modal .pe-price').forEach(inp => {
    const id = inp.dataset.id;
    const v = inp.value.trim();
    out[id] = v === '' ? null : Number(v);
  });
  return out;
}

function peStatus(msg, kind) {
  const el = document.getElementById('pe-status');
  if (!el) return;
  const color = kind === 'err' ? 'var(--avoid)' : kind === 'ok' ? 'var(--buy)' : 'var(--muted)';
  el.style.color = color;
  el.textContent = msg;
}

function peResetRow() {
  document.querySelectorAll('#price-editor-modal .pe-price').forEach(inp => {
    const it = itineraries.find(x => x.id === inp.dataset.id);
    // Show baseline by removing any current value (will mean "delete override on save")
    inp.value = '';
    inp.placeholder = it && it.cashPricePerPerson != null ? `baseline ${it.cashPricePerPerson}` : '—';
  });
  peStatus('Cleared all inputs — saving now will remove all overrides and revert to data.js baselines.', 'info');
}

async function peFetchLive() {
  const cfg = peLoadCfg();
  if (!cfg.apiUrl) return peStatus('No Worker URL configured.', 'err');
  peStatus('Fetching live fares…');
  const cash = peCashItineraries().filter(it => it.outboundDate && it.returnDate);
  let ok = 0, fail = 0;
  for (const it of cash) {
    const url = `${cfg.apiUrl}/flights?origin=${it.origin}&destination=${it.destination}&departureDate=${it.outboundDate}&returnDate=${it.returnDate}&adults=${passengerConfig.adults}&children=${passengerConfig.children}`;
    try {
      const r = await fetch(url);
      const j = await r.json();
      if (j.ok && j.cheapest) {
        const inp = document.querySelector(`#price-editor-modal .pe-price[data-id="${CSS.escape(it.id)}"]`);
        if (inp) inp.value = Math.round(j.cheapest.perPerson);
        ok++;
      } else fail++;
    } catch { fail++; }
  }
  peStatus(`Prefilled ${ok} route${ok === 1 ? '' : 's'}${fail ? `, ${fail} failed` : ''}. Review then commit.`, fail && !ok ? 'err' : 'ok');
}

function peBuildOverrides(formPrices) {
  const existing = peCurrentOverrides();
  const next = {};
  const nowIso = new Date().toISOString();
  for (const it of peCashItineraries()) {
    const formVal = formPrices[it.id];
    const baseline = (window._baselineCashPrice && window._baselineCashPrice[it.id]) ?? null;
    const prev = existing[it.id] || {};
    // If form is empty -> drop the override entirely (revert to baseline)
    if (formVal == null) continue;
    // If unchanged from current value -> keep existing override as-is (don't bump updatedAt)
    if (formVal === it.cashPricePerPerson && prev.cashPricePerPerson != null) {
      next[it.id] = prev;
      continue;
    }
    // If form value equals the original data.js baseline, no override needed
    if (baseline != null && formVal === baseline) continue;
    next[it.id] = { cashPricePerPerson: formVal, updatedAt: nowIso };
  }
  return next;
}

function peSerializeOverrides(obj) {
  const entries = Object.entries(obj);
  if (!entries.length) {
    return `// Cash price overrides — committed via the in-app editor.\n// Each entry overrides fields on the matching itinerary by id.\nwindow.priceOverrides = {};\n`;
  }
  const lines = entries.map(([id, v]) => `  ${JSON.stringify(id)}: ${JSON.stringify(v)}`);
  return `// Cash price overrides — committed via the in-app editor.\n// Each entry overrides fields on the matching itinerary by id.\nwindow.priceOverrides = {\n${lines.join(',\n')}\n};\n`;
}

async function peCommit() {
  const repo = document.getElementById('pe-repo').value.trim();
  const branch = document.getElementById('pe-branch').value.trim() || 'main';
  const token = document.getElementById('pe-token').value.trim();
  if (!repo.includes('/')) return peStatus('Repo must be "owner/repo".', 'err');
  if (!token) return peStatus('Paste your GitHub PAT.', 'err');
  peSaveCfg({ token, repo, branch });

  const formPrices = peReadFormPrices();
  const newOverrides = peBuildOverrides(formPrices);
  const newContent = peSerializeOverrides(newOverrides);

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const apiBase = `https://api.github.com/repos/${repo}/contents/${PE_DEFAULTS.path}`;

  peStatus('Reading current file SHA…');
  let sha;
  try {
    const r = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers });
    if (r.status === 404) {
      sha = undefined; // file will be created
    } else if (!r.ok) {
      const t = await r.text();
      return peStatus(`GET failed (${r.status}): ${t.slice(0, 200)}`, 'err');
    } else {
      const j = await r.json();
      sha = j.sha;
    }
  } catch (e) {
    return peStatus(`Network error: ${e.message || e}`, 'err');
  }

  const changedCount = Object.keys(newOverrides).length;
  const msg = `Update price overrides (${changedCount} route${changedCount === 1 ? '' : 's'})`;
  const body = {
    message: msg,
    content: btoa(unescape(encodeURIComponent(newContent))),
    branch,
    ...(sha ? { sha } : {}),
  };

  peStatus('Committing…');
  try {
    const r = await fetch(apiBase, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) {
      const t = await r.text();
      return peStatus(`PUT failed (${r.status}): ${t.slice(0, 300)}`, 'err');
    }
    const j = await r.json();
    // Apply locally so the UI reflects immediately
    window.priceOverrides = newOverrides;
    for (const it of itineraries) {
      const base = window._baselineCashPrice?.[it.id];
      if (it.program !== 'cash') continue;
      if (newOverrides[it.id]) Object.assign(it, newOverrides[it.id]);
      else if (base != null) it.cashPricePerPerson = base;
    }
    renderApp();
    peStatus(`Committed ${j.commit?.sha?.slice(0, 7) || ''} — GitHub Pages will redeploy within ~1 min.`, 'ok');
  } catch (e) {
    peStatus(`Network error: ${e.message || e}`, 'err');
  }
}
