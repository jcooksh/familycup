// Browser-side live score overlay.
//
// The baked data/matches.json comes from football-data.org's free tier, which
// can lag hours behind on live status. To keep the board honest during games,
// the browser also polls ESPN's public, key-less, CORS-open World Cup
// scoreboard and overlays live / just-finished state on top of the baked data.
//
// The overlay is display-first but feeds scoring too: an ESPN FINISHED result
// flips the match to FINISHED with scores, so points land on the board hours
// before the baked JSON catches up.

import { canonicalTeam } from "@/data/aliases"
import type { Match } from "@/lib/scoring"

const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"

// Trust IN_PLAY overrides for 15 minutes after the last successful ESPN fetch.
// If ESPN goes dark we must not freeze matches as eternally "live" — but
// FINISHED results are settled facts and persist for the whole session.
const IN_PLAY_TRUST_MS = 15 * 60 * 1000

export interface LiveOverride {
  status: "IN_PLAY" | "FINISHED"
  minute: string | null
  homeScore: number | null
  awayScore: number | null
}

// The two APIs share no match IDs, so matches are joined on UTC day + both
// canonical team names (ESPN names normalised through the same alias table
// the fetch script uses).
export const matchKey = (utcDate: string | undefined, home: string, away: string) =>
  `${(utcDate ?? "").slice(0, 10)}|${home}|${away}`

let overrides = new Map<string, LiveOverride>()
let lastFetchOk = 0

// Window the scoreboard request: 48h back catches finished games the baked
// data hasn't settled yet, 24h forward catches anything kicking off soon.
function dateRange(now: Date): string {
  const day = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "")
  const from = new Date(now.getTime() - 48 * 3_600_000)
  const to = new Date(now.getTime() + 24 * 3_600_000)
  return `${day(from)}-${day(to)}`
}

const toScore = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Poll ESPN. Failures are swallowed — the last good overlay stays in force. */
export async function fetchLiveOverrides(now = new Date()): Promise<void> {
  try {
    const url = `${ESPN_URL}?dates=${dateRange(now)}&limit=100`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return
    const data = await res.json()

    const next = new Map<string, LiveOverride>()
    for (const ev of data?.events ?? []) {
      const comp = ev?.competitions?.[0]
      const competitors: any[] = comp?.competitors ?? []
      const home = competitors.find((c) => c?.homeAway === "home")
      const away = competitors.find((c) => c?.homeAway === "away")
      if (!home || !away) continue

      // Only overlay states the baked data is slow on: in-progress and
      // full-time. Pre-game events stay on the baked schedule.
      const st = ev?.status ?? comp?.status
      let status: LiveOverride["status"]
      if (st?.type?.state === "in") status = "IN_PLAY"
      else if (st?.type?.state === "post" && st?.type?.completed) status = "FINISHED"
      else continue

      const key = matchKey(
        ev?.date,
        canonicalTeam(home.team?.displayName ?? ""),
        canonicalTeam(away.team?.displayName ?? "")
      )
      next.set(key, {
        status,
        minute: status === "IN_PLAY" ? st?.displayClock ?? null : null,
        homeScore: toScore(home.score),
        awayScore: toScore(away.score),
      })
    }

    // Carry forward FINISHED results that dropped out of the response window.
    for (const [key, o] of overrides) {
      if (o.status === "FINISHED" && !next.has(key)) next.set(key, o)
    }

    overrides = next
    lastFetchOk = Date.now()
  } catch {
    /* network/CORS hiccup — keep last good overlay */
  }
}

/**
 * Merge the ESPN overlay into the baked matches. ESPN wins on status and
 * minute; scores fall back to the baked value when ESPN has none. Matches the
 * baked data already calls finished are left alone — football-data.org is the
 * source of record once it catches up.
 */
export function applyLiveOverrides(matches: Match[], now = Date.now()): Match[] {
  if (overrides.size === 0) return matches
  const trustInPlay = now - lastFetchOk < IN_PLAY_TRUST_MS
  return matches.map((m) => {
    if (m.status === "FINISHED" || m.status === "AWARDED") return m
    const o = overrides.get(matchKey(m.utcDate, m.homeTeam, m.awayTeam))
    if (!o) return m
    if (o.status === "IN_PLAY" && !trustInPlay) return m
    return {
      ...m,
      status: o.status,
      minute: o.minute,
      homeScore: o.homeScore ?? m.homeScore,
      awayScore: o.awayScore ?? m.awayScore,
    }
  })
}
