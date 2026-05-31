// Cloudflare Worker: Amadeus Flight Offers proxy
// Holds AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET as secrets (set via `wrangler secret put`)
// Optional var AMADEUS_ENV: "test" (default) or "production"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let cachedToken = null; // { token, expiresAt }

async function getToken(env) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.token;
  const host = (env.AMADEUS_ENV === 'production') ? 'api.amadeus.com' : 'test.api.amadeus.com';
  const r = await fetch(`https://${host}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.AMADEUS_CLIENT_ID,
      client_secret: env.AMADEUS_CLIENT_SECRET,
    }),
  });
  if (!r.ok) throw new Error(`token ${r.status}: ${await r.text()}`);
  const j = await r.json();
  cachedToken = { token: j.access_token, expiresAt: Date.now() + j.expires_in * 1000 };
  return cachedToken.token;
}

function normalizeFlightParams(params) {
  const out = {
    originLocationCode: params.originLocationCode || params.origin,
    destinationLocationCode: params.destinationLocationCode || params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate || undefined,
    adults: String(params.adults || '2'),
    children: params.children != null ? String(params.children) : undefined,
    currencyCode: params.currencyCode || params.currency || 'USD',
    max: String(params.max || '20'),
    nonStop: params.nonStop != null ? String(params.nonStop) : undefined,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function validateFlightParams(params) {
  if (!params.originLocationCode || !params.destinationLocationCode || !params.departureDate) {
    return 'missing required: origin, destination, departureDate';
  }
  return '';
}

function cacheRequestFor(env, params) {
  const host = (env.AMADEUS_ENV === 'production') ? 'api.amadeus.com' : 'test.api.amadeus.com';
  const url = new URL(`https://flight-monitor-cache.local/${host}/flight-offers`);
  Object.entries(normalizeFlightParams(params)).sort(([a], [b]) => a.localeCompare(b)).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString(), { method: 'GET' });
}

async function flightOffers(env, params) {
  const host = (env.AMADEUS_ENV === 'production') ? 'api.amadeus.com' : 'test.api.amadeus.com';
  const token = await getToken(env);
  const url = new URL(`https://${host}/v2/shopping/flight-offers`);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = await r.text();
  if (!r.ok) throw new Error(`flight-offers ${r.status}: ${body}`);
  return JSON.parse(body);
}

async function cachedFlightOffers(env, params, ttlSeconds = 900) {
  const cache = caches.default;
  const cacheReq = cacheRequestFor(env, params);
  const cached = await cache.match(cacheReq);
  if (cached) {
    const json = await cached.json();
    return { ...json, cacheStatus: 'HIT' };
  }
  const raw = await flightOffers(env, params);
  const out = { raw, cachedAt: new Date().toISOString() };
  await cache.put(cacheReq, new Response(JSON.stringify(out), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${ttlSeconds}`,
    },
  }));
  return { ...out, cacheStatus: 'MISS' };
}

async function mapWithConcurrency(items, limit, mapper) {
  const out = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function summarize(json) {
  const offers = json.data || [];
  if (!offers.length) return { count: 0, cheapestPerPerson: null, currency: null };
  let cheapest = null;
  for (const o of offers) {
    const total = parseFloat(o.price?.grandTotal ?? o.price?.total ?? 'NaN');
    const travelers = (o.travelerPricings || []).length || 1;
    const perPerson = total / travelers;
    if (cheapest == null || perPerson < cheapest.perPerson) {
      cheapest = {
        perPerson,
        total,
        travelers,
        currency: o.price?.currency,
        airlines: [...new Set((o.itineraries || []).flatMap(it => (it.segments || []).map(s => s.carrierCode)))],
        stops: Math.max(0, ...((o.itineraries || []).map(it => (it.segments?.length || 1) - 1))),
      };
    }
  }
  return { count: offers.length, cheapest, currency: cheapest?.currency };
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    if (url.pathname === '/batch' && req.method === 'POST') {
      try {
        const body = await req.json();
        const queries = Array.isArray(body.queries) ? body.queries.slice(0, 30) : [];
        if (!queries.length) return jsonResponse({ ok: false, error: 'body.queries must contain at least one query' }, 400);
        const results = await mapWithConcurrency(queries, 4, async (query) => {
          const id = query.id || '';
          const params = normalizeFlightParams(query);
          const error = validateFlightParams(params);
          if (error) return { id, ok: false, error };
          try {
            const ttl = Math.max(60, Math.min(3600, Number(query.cacheTtl || 900)));
            const { raw, cacheStatus } = await cachedFlightOffers(env, params, ttl);
            const summary = summarize(raw);
            return { id, ok: true, query: params, ...summary, cacheStatus, fetchedAt: new Date().toISOString() };
          } catch (e) {
            return { id, ok: false, query: params, error: String(e.message || e) };
          }
        });
        return jsonResponse({ ok: true, fetchedAt: new Date().toISOString(), results });
      } catch (e) {
        return jsonResponse({ ok: false, error: String(e.message || e) }, 400);
      }
    }
    if (url.pathname !== '/flights') {
      return jsonResponse({
        ok: true,
        hint: 'GET /flights?origin=JFK&destination=CAN&departureDate=2026-07-28&returnDate=2026-08-30&adults=2&children=2 or POST /batch',
      });
    }
    try {
      const params = normalizeFlightParams({
        originLocationCode: url.searchParams.get('origin'),
        destinationLocationCode: url.searchParams.get('destination'),
        departureDate: url.searchParams.get('departureDate'),
        returnDate: url.searchParams.get('returnDate') || undefined,
        adults: url.searchParams.get('adults') || '2',
        children: url.searchParams.get('children') || undefined,
        currencyCode: url.searchParams.get('currency') || 'USD',
        max: url.searchParams.get('max') || '20',
        nonStop: url.searchParams.get('nonStop') || undefined,
      });
      const error = validateFlightParams(params);
      if (error) return jsonResponse({ ok: false, error }, 400);
      const ttl = Math.max(60, Math.min(3600, Number(url.searchParams.get('cacheTtl') || 900)));
      const { raw, cacheStatus } = await cachedFlightOffers(env, params, ttl);
      const out = summarize(raw);
      return jsonResponse({ ok: true, query: params, ...out, cacheStatus, fetchedAt: new Date().toISOString() });
    } catch (e) {
      return jsonResponse({ ok: false, error: String(e.message || e) }, 502);
    }
  },
};
