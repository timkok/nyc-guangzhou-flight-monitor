# NYC/NJ to Greater Guangzhou Flight Decision Monitor

Static GitHub Pages flight decision tool for a 2026 summer family trip from NYC/NJ to the Guangzhou area.

## Current Structure

- `index.html`: page shell and section placement
- `styles.css`: dashboard styling
- `data.js`: route data, adjustments, hard-no rules, booking checklist
- `logic.js`: cost, points, family score, recommendation, and filtering logic
- `ui.js`: dashboard rendering
- `itineraries.js` and `itinerary-ui.js`: detailed itinerary cards
- `trust-workflow.js`: data health, proof, verification progress, search missions, parser, and exports

## Trust Workflow

- Data Health shows itinerary counts, filter visibility, mock count, needs-details count, and last update timestamp.
- Each itinerary displays status badges, verification progress, proof status, booking channel, and booking risk.
- Expanded itinerary cards include editable verification checkboxes plus a proof dialog.
- Search Missions persist checked status in `localStorage` by date.
- Itinerary proof and verification overrides persist in `localStorage` under `flightTrustOverrides`.
- Admin Paste Parser stores parsed/raw result text in `localStorage`.
- Export buttons download JSON or text directly from the browser.

No backend is required for these trust features.
