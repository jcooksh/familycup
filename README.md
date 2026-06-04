# Family Cup 2026

A World Cup 2026 sweepstake for the family of four — **Maat, Steph, Darcey &
Jake**. Teams aren't pre-assigned: you spin for them on the **Wheelspin** tab,
and the results drive a live points leaderboard.

## Wheelspin

Two wheels on the **Wheelspin** tab (left menu):

1. **The Favourites** — Spain, England, France, Brazil. Spin round the family so
   each player gets one.
2. **The Big Draw** — the remaining 42 teams. Take turns
   (Maat → Steph → Darcey → Jake, looping) and spin until every team is gone.
   Round-robin keeps the split even (11 / 11 / 10 / 10).

Results are saved in your browser and **lock in**. Each wheel has a **Reset**
button to redo it. Once drawn, teams flow straight into Standings, Players and
Teams.

## Scoring

| Event | Points |
| --- | --- |
| Win | **3** |
| Draw | **1** |
| Loss | 0 |
| Reaching a knockout round | **4** per round |

Goal difference is the first tie-break, then goals for.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- [football-data.org](https://www.football-data.org) for live match data (free tier)

## Live scores

football-data.org blocks browser CORS, so a GitHub Action
(`.github/workflows/deploy.yml`) runs on a ~10-minute cron, fetches matches with
an API key (stored as a repo **secret**), writes `public/data/matches.json`,
rebuilds and redeploys. The front-end reads that static JSON and re-polls every
60s. The key never reaches the browser. Pre-tournament, the committed JSON is
used and live scores simply stay empty.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Deploy (GitHub Pages)

1. Push to `main` (repo: `jcooksh/familycup`).
2. Repo **Settings → Pages** → Source: **GitHub Actions**.
3. (Optional, for live scores) **Settings → Secrets and variables → Actions** →
   add `FOOTBALL_DATA_KEY`.

The site builds with base path `/familycup/` and deploys to
`https://jcooksh.github.io/familycup/`.

## Editing teams

The family, favourites and draw pool live in `src/data/wheelspin.ts`. Flags are
in `src/data/flags.ts`; if the score API spells a country differently, add an
alias in `src/data/aliases.ts`.
