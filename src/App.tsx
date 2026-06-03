import * as React from "react"
import { Trophy, RefreshCw, Users } from "lucide-react"

import { LeaderboardCard } from "@/components/ui/leaderboard-card"
import { computeStandings, type Match, type Standing } from "@/lib/scoring"
import { TOURNAMENT, PARTICIPANTS } from "@/data/draft"

const POLL_MS = 60_000 // re-fetch the static scores file every 60s
const CURRENT_USER_ID = "jake"

interface MatchesFile {
  updatedAt?: string
  matches: Match[]
}

function teamLine(s: Standing): string {
  const parts = [`${s.won}W ${s.drawn}D ${s.lost}L`]
  parts.push(`GD ${s.gd >= 0 ? "+" : ""}${s.gd}`)
  parts.push(`${s.participant.teams.length} teams`)
  return parts.join("  ·  ")
}

export default function App() {
  const [matches, setMatches] = React.useState<Match[]>([])
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      const url = `${import.meta.env.BASE_URL}data/matches.json?t=${Date.now()}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: MatchesFile = await res.json()
      setMatches(data.matches ?? [])
      setUpdatedAt(data.updatedAt ?? null)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load scores")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  const standings = React.useMemo(() => computeStandings(matches), [matches])

  const podiumRankings = standings.slice(0, 3).map((s) => ({
    userId: s.participant.id,
    userName: s.participant.name,
    rank: s.rank,
    value: s.points,
    byline: `GD ${s.gd >= 0 ? "+" : ""}${s.gd}`,
  }))

  const rankings = standings.map((s) => ({
    userId: s.participant.id,
    rank: s.rank,
    userName: s.participant.name,
    byline: teamLine(s),
    value: s.points,
    delta: s.gd,
    live: s.liveMatches > 0,
    displayed: true,
  }))

  const liveCount = standings.reduce((n, s) => n + s.liveMatches, 0)

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl">
          <Trophy className="size-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold leading-tight">{TOURNAMENT.title}</h1>
          <p className="text-muted-foreground text-sm">
            3 pts win · 1 pt draw · 4 pts each knockout round · goal difference tie-break
          </p>
        </div>
      </header>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <button
          onClick={load}
          className="hover:text-foreground flex items-center gap-1"
          aria-label="Refresh scores"
        >
          <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
          Refresh
        </button>
        {updatedAt && (
          <span>Updated {new Date(updatedAt).toLocaleString()}</span>
        )}
        {liveCount > 0 && (
          <span className="flex items-center gap-1 font-semibold text-red-600">
            <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
            {liveCount} live
          </span>
        )}
        {error && <span className="text-red-600">· {error}</span>}
      </div>

      <LeaderboardCard
        title="Standings"
        fromDate={TOURNAMENT.fromDate}
        toDate={TOURNAMENT.toDate}
        currentUserId={CURRENT_USER_ID}
        podiumRankings={podiumRankings}
        rankings={rankings}
      />

      <section className="bg-card rounded-2xl border p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Users className="size-5" /> Squads
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {PARTICIPANTS.map((p) => (
            <div key={p.id} className="rounded-xl border p-3">
              <p className="mb-2 text-sm font-medium">{p.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {p.teams.map((t) => (
                  <span
                    key={t}
                    className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-muted-foreground pt-2 text-center text-xs">
        Scores via football-data.org · updates every ~10 min during the tournament
      </footer>
    </div>
  )
}
