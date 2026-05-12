# Flight monitor live-fares proxy

A tiny Cloudflare Worker that proxies the Amadeus Flight Offers Search API so the static GitHub Pages site can fetch live cash fares without exposing API keys.

## One-time setup

### 1. Get Amadeus keys (free)
1. Sign up at https://developers.amadeus.com/ (free, no card needed for the test environment).
2. Create a Self-Service app — copy the **API Key** (client_id) and **API Secret** (client_secret).
3. The test environment returns partial / mocked data. To get real prices later, enable the production app in the same dashboard (requires billing setup; there is a free monthly quota).

### 2. Deploy the Worker (free)
Requires a free Cloudflare account.

```bash
# from this worker/ directory
npm install -g wrangler
wrangler login
wrangler secret put AMADEUS_CLIENT_ID       # paste your API Key
wrangler secret put AMADEUS_CLIENT_SECRET   # paste your API Secret
wrangler deploy
```

Wrangler prints a URL like `https://flight-monitor-proxy.<your-subdomain>.workers.dev`. Test it:

```
https://flight-monitor-proxy.<you>.workers.dev/flights?origin=JFK&destination=CAN&departureDate=2026-07-28&returnDate=2026-08-30&adults=2&children=2
```

### 3. Wire it into the page
Open the deployed site, click ⚙️ **Settings**, paste the Worker URL into the "Live API URL" field, and save. The 🔄 **Refresh** button will then fetch live cash fares and overlay them on the cash itineraries.

## Switching to production data
After enabling the production Amadeus app:
1. Edit `wrangler.toml`: `AMADEUS_ENV = "production"`.
2. Replace the secrets with the production keys: `wrangler secret put AMADEUS_CLIENT_ID` etc.
3. `wrangler deploy`.

## Endpoint shape

`GET /flights?origin=JFK&destination=CAN&departureDate=2026-07-28&returnDate=2026-08-30&adults=2&children=2`

Returns:
```json
{
  "ok": true,
  "count": 12,
  "cheapest": { "perPerson": 1184.5, "total": 4738, "travelers": 4, "currency": "USD", "airlines": ["TK"], "stops": 1 },
  "fetchedAt": "2026-05-12T..."
}
```
