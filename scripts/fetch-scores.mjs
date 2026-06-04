// Pulls World Cup matches from football-data.org and writes a compact static
// file the site reads. Runs in CI (GitHub Action) where the API key lives as a
// secret, so the key never reaches the browser and CORS is a non-issue.
//
// Usage: FOOTBALL_DATA_KEY=xxxx node scripts/fetch-scores.mjs
//
// Node strips the TypeScript types from the imported .ts data modules
// (Node >= 23). Those modules import nothing external.

import { writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

import { ALL_TEAMS } from "../src/data/wheelspin.ts"
import { canonicalTeam } from "../src/data/aliases.ts"

// Ownership is decided in the browser (Wheelspin tab) and isn't available here,
// so filter by the fixed universe of teams in play instead.
const POOL = new Set(ALL_TEAMS)

const KEY = process.env.FOOTBALL_DATA_KEY
const COMPETITION = process.env.WC_COMPETITION || "WC"
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/data/matches.json"
)

async function main() {
  if (!KEY) {
    console.error("Missing FOOTBALL_DATA_KEY env var.")
    process.exit(1)
  }

  const url = `https://api.football-data.org/v4/competitions/${COMPETITION}/matches`
  const res = await fetch(url, { headers: { "X-Auth-Token": KEY } })
  if (!res.ok) {
    console.error(`football-data.org error: HTTP ${res.status} ${await res.text()}`)
    process.exit(1)
  }

  const data = await res.json()
  const all = Array.isArray(data.matches) ? data.matches : []

  const matches = all
    .map((m) => {
      const home = canonicalTeam(m.homeTeam?.name ?? "")
      const away = canonicalTeam(m.awayTeam?.name ?? "")
      return {
        id: m.id,
        stage: m.stage,
        status: m.status,
        utcDate: m.utcDate,
        homeTeam: home,
        awayTeam: away,
        homeScore: m.score?.fullTime?.home ?? null,
        awayScore: m.score?.fullTime?.away ?? null,
      }
    })
    // keep only matches relevant to the sweepstake to keep the file small
    .filter((m) => POOL.has(m.homeTeam) || POOL.has(m.awayTeam))

  const payload = { updatedAt: new Date().toISOString(), matches }
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n")
  console.log(`Wrote ${matches.length} matches to ${OUT}`)

  // Warn about any owned team that never appears — likely an alias mismatch.
  const seen = new Set(matches.flatMap((m) => [m.homeTeam, m.awayTeam]))
  const missing = ALL_TEAMS.filter((t) => !seen.has(t))
  if (missing.length) {
    console.warn(`No fixtures yet for: ${missing.join(", ")}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
