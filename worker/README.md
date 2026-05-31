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

Wrangler prints a URL like `https://flight-monitor-proxy.<your-subdomain>.workers.dev`. Test a single route:

```
https://flight-monitor-proxy.<you>.workers.dev/flights?origin=JFK&destination=CAN&departureDate=2026-07-28&returnDate=2026-08-30&adults=2&children=2
```

Or test the batch endpoint the page now uses for faster refreshes:

```bash
curl -X POST https://flight-monitor-proxy.<you>.workers.dev/batch \
  -H 'content-type: application/json' \
  -d '{"queries":[{"id":"jfk-can","origin":"JFK","destination":"CAN","departureDate":"2026-07-28","returnDate":"2026-08-30","adults":2,"children":2}]}'
```

### 3. Wire it into the page
Open the deployed site, click **Settings**, paste the Worker URL into the "Live API URL" field, and save. The **Refresh live fares** button will then batch-fetch live cash fares and overlay them on the cash itineraries.

Successful refreshes are saved in browser `localStorage` as a live fare snapshot, so the page can keep showing the latest fetched values even after reload. Always re-check before booking.

## Switching to production data
After enabling the production Amadeus app:
1. Edit `wrangler.toml`: `AMADEUS_ENV = "production"`.
2. Replace the secrets with the production keys: `wrangler secret put AMADEUS_CLIENT_ID` etc.
3. `wrangler deploy`.

## Endpoint shape

`GET /flights?origin=JFK&destination=CAN&departureDate=2026-07-28&returnDate=2026-08-30&adults=2&children=2`

Optional query params:
- `cacheTtl`: cache lifetime in seconds, clamped between 60 and 3600. Default is 900.
- `max`: max Amadeus offers to return before summarizing. Default is 20.

Returns:
```json
{
  "ok": true,
  "count": 12,
  "cheapest": { "perPerson": 1184.5, "total": 4738, "travelers": 4, "currency": "USD", "airlines": ["TK"], "stops": 1 },
  "cacheStatus": "MISS",
  "fetchedAt": "2026-05-12T..."
}
```

`POST /batch`

Request:
```json
{
  "queries": [
    {
      "id": "jfk-can",
      "origin": "JFK",
      "destination": "CAN",
      "departureDate": "2026-07-28",
      "returnDate": "2026-08-30",
      "adults": 2,
      "children": 2,
      "cacheTtl": 900
    }
  ]
}
```

The Worker processes up to 30 queries per batch with limited concurrency and returns one result per query. Failed routes do not fail the whole batch.
