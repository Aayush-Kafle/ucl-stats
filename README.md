# UCL Stats

A Champions League player stats and valuation site: real stats + market values, plus a custom, transparent "value score" computed from performance data.

## Run it

```bash
cd backend
cp .env.example .env   # add your API-Football key
npm install
npm start
```

Then open http://localhost:3000

## How it works

- **Stats** come from the API-Football API (Champions League competition), prefetched and cached server-side to stay within the free-tier rate limit.
- **Market values** come from a checked-in snapshot (`backend/data/market-values.json`), refreshed periodically via a small scraper script.
- **Value score** is a hand-built formula (documented on the site's About page) combining per-90 goal/assist production, age, and playing-time reliability, normalized within each position group.

## Current scope

Champions League, current season only. Work in progress — see commit history for build order.
