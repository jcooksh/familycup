import * as React from "react"

import { PARTICIPANTS, TOURNAMENT, refreshOwnership } from "@/data/draft"
import { ALL_TEAMS, WHEELSPIN_EVENT } from "@/data/wheelspin"
import { WheelspinPage } from "@/wheelspin"
import { computeStandings, type Match } from "@/lib/scoring"
import {
  buildTeamRows, participantForm, knockoutCount, tournamentTotals,
} from "@/lib/derive"
import {
  StandingsPage, MatchDayPage, FixturesPage, BracketPage,
  PlayersPage, TeamsPage, StatsPage, RulesPage, AdminPage,
  type PageData,
} from "@/pages"
import { DankFx, playAirhorn, playOof } from "@/dank"

const POLL_MS = 60_000
const ME = "" // no "current user" — nobody is highlighted as YOU

interface MatchesFile {
  updatedAt?: string | null
  matches: Match[]
}

type RouteKey =
  | "wheelspin"
  | "standings" | "matchday" | "fixtures" | "bracket"
  | "players" | "teams" | "stats" | "rules" | "admin"

const ROUTE_META: Record<RouteKey, { title: string; sub: string }> = {
  wheelspin: { title: "Wheelspin", sub: "spin to draft teams" },
  standings: { title: "Standings", sub: "live · 4 players" },
  matchday: { title: "Match Day", sub: "live now" },
  fixtures: { title: "Fixtures & Results", sub: "matches · jun–jul" },
  bracket: { title: "Bracket", sub: "knockout tree" },
  players: { title: "Players", sub: `4 players · ${ALL_TEAMS.length} teams` },
  teams: { title: "Teams", sub: `${ALL_TEAMS.length} nations` },
  stats: { title: "Stats & Records", sub: "live tracker" },
  rules: { title: "Rules", sub: "scoring · tie-breaks" },
  admin: { title: "Admin", sub: "draft · data" },
}

// ── sidebar icons ──
const I = {
  wheelspin: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" /><circle cx="12" cy="12" r="2" /></>,
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

function parseHash(): { route: RouteKey; param: string } {
  const segs = location.hash.replace(/^#\/?/, "").split("/")
  const route = (ROUTE_META[segs[0] as RouteKey] ? segs[0] : "standings") as RouteKey
  return { route, param: segs[1] ?? "" }
}

export default function App() {
  const [matches, setMatches] = React.useState<Match[]>([])
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [{ route, param }, setNav] = React.useState(parseHash())
  const [navOpen, setNavOpen] = React.useState(false)
  const [spinV, setSpinV] = React.useState(0)

  // Rebuild team ownership whenever the wheelspin results change.
  React.useEffect(() => {
    const onSpin = () => { refreshOwnership(); setSpinV((v) => v + 1) }
    window.addEventListener(WHEELSPIN_EVENT, onSpin)
    window.addEventListener("storage", onSpin)
    return () => {
      window.removeEventListener(WHEELSPIN_EVENT, onSpin)
      window.removeEventListener("storage", onSpin)
    }
  }, [])

  // ── ULTRA MEGA DANK MODE (triple-click bottom-right corner) ──
  const [dank, setDank] = React.useState(() => localStorage.getItem("dank") === "1")
  const [dankBanner, setDankBanner] = React.useState(false)
  const clickTimes = React.useRef<number[]>([])

  React.useEffect(() => {
    document.body.classList.toggle("dank", dank)
    localStorage.setItem("dank", dank ? "1" : "0")
  }, [dank])

  const cornerClick = () => {
    const now = Date.now()
    clickTimes.current = [...clickTimes.current, now].filter((t) => now - t < 900)
    if (clickTimes.current.length >= 3) {
      clickTimes.current = []
      setDank((on) => {
        const next = !on
        if (next) { playAirhorn(); setDankBanner(true); setTimeout(() => setDankBanner(false), 1800) }
        else playOof()
        return next
      })
    }
  }

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
    const onHash = () => { setNav(parseHash()); setNavOpen(false) }
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
  }, [matches, updatedAt, load, spinV])

  const liveCount = data.totals.live

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
    wheelspin: <WheelspinPage />,
    standings: <StandingsPage d={data} />,
    matchday: <MatchDayPage d={data} />,
    fixtures: <FixturesPage d={data} />,
    bracket: <BracketPage d={data} />,
    players: <PlayersPage d={data} playerId={param} />,
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
          <div className="brand-mark">FC</div>
          <div className="brand-name">
            Family Cup
            <small>WC 26 · {TOURNAMENT.host ?? "USA / CAN / MEX"}</small>
          </div>
        </div>

        <div className="nav-section">Draft</div>
        <nav className="nav">
          {nav("wheelspin", "Wheelspin")}
        </nav>

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
          {nav("teams", "Teams", ALL_TEAMS.length)}
          {nav("stats", "Stats & Records")}
        </nav>

        <div className="nav-section">Meta</div>
        <nav className="nav">
          {nav("rules", "Rules")}
          {nav("admin", "Admin")}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">FC</div>
          <div className="who">
            <div className="me">Family Cup</div>
            <div className="rank">{PARTICIPANTS.length} PLAYERS · WC 26</div>
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

      {/* secret dank-mode trigger — triple-click me */}
      <div className="dank-corner" onClick={cornerClick} aria-hidden />
      {dank && <DankFx />}
      {dankBanner && <div className="dank-banner">420<br />DANK MODE<br />ENABLED</div>}
    </div>
  )
}
