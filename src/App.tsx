import * as React from "react"

import { PARTICIPANTS, TOURNAMENT } from "@/data/draft"
import { computeStandings, type Match } from "@/lib/scoring"
import {
  buildTeamRows, participantForm, knockoutCount, tournamentTotals,
} from "@/lib/derive"
import {
  StandingsPage, MatchDayPage, FixturesPage, BracketPage,
  PlayersPage, TeamsPage, StatsPage, RulesPage, AdminPage,
  type PageData,
} from "@/pages"

const POLL_MS = 60_000
const ME = "jake"

interface MatchesFile {
  updatedAt?: string | null
  matches: Match[]
}

type RouteKey =
  | "standings" | "matchday" | "fixtures" | "bracket"
  | "players" | "teams" | "stats" | "rules" | "admin"

const ROUTE_META: Record<RouteKey, { title: string; sub: string }> = {
  standings: { title: "Standings", sub: "live · 11 players" },
  matchday: { title: "Match Day", sub: "live now" },
  fixtures: { title: "Fixtures & Results", sub: "104 matches · jun–jul" },
  bracket: { title: "Bracket", sub: "knockout tree" },
  players: { title: "Players", sub: "11 owners · 48 teams" },
  teams: { title: "Teams", sub: "48 nations" },
  stats: { title: "Stats & Records", sub: "live tracker" },
  rules: { title: "Rules", sub: "scoring · tie-breaks" },
  admin: { title: "Admin", sub: "draft · data" },
}

// ── sidebar icons ──
const I = {
  standings: <path d="M4 19h16M6 16V8M12 16V4M18 16v-6" />,
  matchday: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></>,
  fixtures: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  bracket: <path d="M4 6h5v5M4 13h5v5M15 9h5M15 9l-6-3M15 9l-6 3M15 15h5M15 15l-6 0M15 15l-6 3" />,
  players: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-4 4-4s3 2 3 4" /></>,
  teams: <path d="M12 2l9 4-9 4-9-4 9-4zM3 12l9 4 9-4M3 18l9 4 9-4" />,
  stats: <><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>,
  rules: <><path d="M6 3h9l5 5v13H6z" /><path d="M14 3v6h6" /><path d="M9 13h7M9 17h5" /></>,
  admin: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.4-2.5.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.5a7 7 0 0 0-2.1 1.2l-2.5-.9-2 3.4 2.1 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2.1 1.6 2 3.4 2.5-.9a7 7 0 0 0 2.1 1.2L10 21h4l.4-2.5a7 7 0 0 0 2.1-1.2l2.5.9 2-3.4-2.1-1.6c.1-.4.1-.8.1-1.2z" /></>,
}

function Ico({ d }: { d: React.ReactNode }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      {d}
    </svg>
  )
}

function routeFromHash(): RouteKey {
  const h = location.hash.replace(/^#\/?/, "") as RouteKey
  return ROUTE_META[h] ? h : "standings"
}

export default function App() {
  const [matches, setMatches] = React.useState<Match[]>([])
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [route, setRoute] = React.useState<RouteKey>(routeFromHash())
  const [navOpen, setNavOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const url = `${import.meta.env.BASE_URL}data/matches.json?t=${Date.now()}`
      const res = await fetch(url, { cache: "no-store" })
      const data: MatchesFile = await res.json()
      setMatches(data.matches ?? [])
      setUpdatedAt(data.updatedAt ?? null)
    } catch {
      /* keep last good data */
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  React.useEffect(() => {
    const onHash = () => { setRoute(routeFromHash()); setNavOpen(false) }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  const data: PageData = React.useMemo(() => {
    const standings = computeStandings(matches)
    const teamRows = buildTeamRows(matches)
    const formByParticipant: Record<string, string> = {}
    const koByParticipant: Record<string, number> = {}
    for (const p of PARTICIPANTS) {
      formByParticipant[p.id] = participantForm(matches, p.teams)
      koByParticipant[p.id] = knockoutCount(matches, p.teams)
    }
    return {
      me: ME,
      matches,
      standings,
      teamRows,
      totals: tournamentTotals(matches),
      formByParticipant,
      koByParticipant,
      updatedAt,
      reload: load,
    }
  }, [matches, updatedAt, load])

  const liveCount = data.totals.live
  const meRank = data.standings.findIndex((s) => s.participant.id === ME) + 1

  const nav = (
    key: RouteKey,
    label: string,
    badge?: React.ReactNode,
    badgeLive?: boolean
  ) => (
    <a
      href={`#/${key}`}
      className={route === key ? "active" : ""}
      onClick={() => setNavOpen(false)}
    >
      <Ico d={I[key]} />
      {label}
      {badge != null && (
        <span className={badgeLive ? "badge live" : "badge"}>{badge}</span>
      )}
    </a>
  )

  const PAGES: Record<RouteKey, React.ReactNode> = {
    standings: <StandingsPage d={data} />,
    matchday: <MatchDayPage d={data} />,
    fixtures: <FixturesPage d={data} />,
    bracket: <BracketPage d={data} />,
    players: <PlayersPage d={data} />,
    teams: <TeamsPage d={data} />,
    stats: <StatsPage d={data} />,
    rules: <RulesPage d={data} />,
    admin: <AdminPage d={data} />,
  }

  return (
    <div className="app">
      <div className={navOpen ? "scrim show" : "scrim"} onClick={() => setNavOpen(false)} />
      <aside className={navOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark">W</div>
          <div className="brand-name">
            Sweepstake
            <small>WC 26 · {TOURNAMENT.host ?? "USA / CAN / MEX"}</small>
          </div>
        </div>

        <div className="nav-section">Tournament</div>
        <nav className="nav">
          {nav("standings", "Standings")}
          {nav("matchday", "Match Day", liveCount > 0 ? `${liveCount} LIVE` : undefined, true)}
          {nav("fixtures", "Fixtures & Results")}
          {nav("bracket", "Bracket")}
        </nav>

        <div className="nav-section">Squad</div>
        <nav className="nav">
          {nav("players", "Players", PARTICIPANTS.length)}
          {nav("teams", "Teams", 48)}
          {nav("stats", "Stats & Records")}
        </nav>

        <div className="nav-section">Meta</div>
        <nav className="nav">
          {nav("rules", "Rules")}
          {nav("admin", "Admin")}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">JC</div>
          <div className="who">
            <div className="me">Jake</div>
            <div className="rank">RANK · {meRank || "–"} / {PARTICIPANTS.length}</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="btn menu-toggle" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <h1>{ROUTE_META[route].title}</h1>
          <span className="sub">{ROUTE_META[route].sub}</span>
          <div className="spacer" />
          <div className={liveCount > 0 ? "live-pulse on" : "live-pulse"}>
            <span className="pip" />
            {liveCount > 0 ? `${liveCount} LIVE NOW` : "NO LIVE GAMES"}
          </div>
          <button className="btn" onClick={load} disabled={loading}>
            <svg className={loading ? "ico spin" : "ico"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>
            Refresh
          </button>
        </header>

        <div className="content">{PAGES[route]}</div>
      </main>
    </div>
  )
}
