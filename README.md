# World Cup 2026 Sweepstake Tracker

**🔗 Live: http://cuptrack.ext.io/**


Live leaderboard for a World Cup sweepstake. Each participant owns a handful of
national teams; the app pulls real match results and ranks everyone by points.

## Scoring

| Event | Points |
| --- | --- |
| Win | **3** |
| Draw | **1** |
| Loss | 0 |
| Reaching a knockout round (advancing) | **4** per round |

**Goal difference** (goals for − goals against, summed across a participant's
teams) is tracked and used as the first tie-break, then goals for.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- shadcn-style components in `src/components/ui`
- [football-data.org](https://www.football-data.org) for match data (free tier)

## How live scores work

football-data.org blocks browser CORS, so the browser can't call it directly.
Instead a GitHub Action (`.github/workflows/deploy.yml`) runs on a ~10-minute
cron, fetches matches with the API key (stored as a repo **secret**), writes
`public/data/matches.json`, rebuilds, and redeploys to GitHub Pages. The
front-end reads that static JSON and re-polls it every 60s. The key never
reaches the browser.

## Setup

```bash
npm install
npm run dev        # local dev at http://localhost:5173
```

### Live data locally (optional)

```bash
cp .env.example .env       # add your football-data.org key
export FOOTBALL_DATA_KEY=xxxx
npm run fetch-scores       # writes public/data/matches.json
```

### Deploy (GitHub Pages)

1. Repo **Settings → Secrets and variables → Actions** → add `FOOTBALL_DATA_KEY`.
2. Repo **Settings → Pages** → Source: **GitHub Actions**.
3. Push to `main`. The workflow builds, deploys, and keeps scores fresh on cron.

## Editing the draft

Participants and their teams live in `src/data/draft.ts`. If the API spells a
country differently (e.g. `Korea Republic`), add an alias in
`src/data/aliases.ts`.
