// Cloudflare Worker: Amadeus Flight Offers proxy
// Holds AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET as secrets (set via `wrangler secret put`)
// Optional var AMADEUS_ENV: "test" (default) or "production"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    if (url.pathname !== '/flights') {
      return new Response(JSON.stringify({ ok: true, hint: 'GET /flights?origin=JFK&destination=CAN&departureDate=2026-07-28&returnDate=2026-08-30&adults=2&children=2' }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
    try {
      const params = {
        originLocationCode: url.searchParams.get('origin'),
        destinationLocationCode: url.searchParams.get('destination'),
        departureDate: url.searchParams.get('departureDate'),
        returnDate: url.searchParams.get('returnDate') || undefined,
        adults: url.searchParams.get('adults') || '2',
        children: url.searchParams.get('children') || undefined,
        currencyCode: url.searchParams.get('currency') || 'USD',
        max: url.searchParams.get('max') || '20',
        nonStop: url.searchParams.get('nonStop') || undefined,
      };
      if (!params.originLocationCode || !params.destinationLocationCode || !params.departureDate) {
        return new Response(JSON.stringify({ error: 'missing required: origin, destination, departureDate' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } });
      }
      const raw = await flightOffers(env, params);
      const out = summarize(raw);
      return new Response(JSON.stringify({ ok: true, query: params, ...out, fetchedAt: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e.message || e) }), { status: 502, headers: { 'Content-Type': 'application/json', ...CORS } });
    }
  },
};
