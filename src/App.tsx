import * as React from "react"

import { PARTICIPANTS, refreshOwnership } from "@/data/draft"
import { WHEELSPIN_EVENT } from "@/data/wheelspin"
import { WheelspinPage } from "@/wheelspin"
import { computeStandings, type Match } from "@/lib/scoring"
import {
  buildTeamRows, participantForm, knockoutCount, tournamentTotals,
} from "@/lib/derive"
import {
  StandingsPage, MatchDayPage, BracketPage,
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
  | "standings" | "matchday" | "bracket"
  | "players" | "teams" | "stats" | "rules"
  | "wheelspin" | "admin"

const TABS: { key: RouteKey; ico: string; label: string }[] = [
  { key: "standings", ico: "🏆", label: "Standings" },
  { key: "matchday", ico: "⚽", label: "Match Day" },
  { key: "bracket", ico: "🗺️", label: "Bracket" },
  { key: "players", ico: "👥", label: "Players" },
  { key: "teams", ico: "🌍", label: "Teams" },
  { key: "stats", ico: "📊", label: "Stats" },
  { key: "rules", ico: "📖", label: "Rules" },
  { key: "wheelspin", ico: "🎡", label: "Wheelspin" },
  { key: "admin", ico: "⚙️", label: "Admin" },
]
const ROUTES = new Set(TABS.map((t) => t.key))

function parseHash(): { route: RouteKey; param: string } {
  const segs = location.hash.replace(/^#\/?/, "").split("/")
  // legacy: the old Fixtures & Results tab merged into Match Day
  const seg = segs[0] === "fixtures" ? "matchday" : segs[0]
  const route = (ROUTES.has(seg as RouteKey) ? seg : "standings") as RouteKey
  return { route, param: segs[1] ?? "" }
}

export default function App() {
  const [matches, setMatches] = React.useState<Match[]>([])
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [{ route, param }, setNav] = React.useState(parseHash())
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
    const onHash = () => {
      setNav(parseHash())
      window.scrollTo({ top: 0 })
    }
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

  const PAGES: Record<RouteKey, React.ReactNode> = {
    standings: <StandingsPage d={data} />,
    matchday: <MatchDayPage d={data} />,
    bracket: <BracketPage d={data} />,
    players: <PlayersPage d={data} playerId={param} />,
    teams: <TeamsPage d={data} />,
    stats: <StatsPage d={data} />,
    rules: <RulesPage d={data} />,
    wheelspin: <WheelspinPage />,
    admin: <AdminPage d={data} />,
  }

  return (
    <>
      <div className="accentbar"><i /><i /><i /><i /><i /></div>

      <div className="wrap head">
        <header className="topbar">
          <a className="logo" href="#/standings">
            <div className="ball">F</div>
            <div className="wm">FAMILY<span>CUP</span></div>
          </a>
          <div className="spacer" />
          <span className="hostflags" title="Hosts: USA · Canada · Mexico">🇺🇸 🇨🇦 🇲🇽</span>
          {liveCount > 0 && (
            <span className="live-pill"><span className="pip" />{liveCount} LIVE</span>
          )}
          <button className="ghost-btn" onClick={load} disabled={loading}>
            {loading ? "↻ Updating…" : "↻ Refresh"}
          </button>
        </header>
      </div>

      <nav className="nav">
        <div className="nav-inner">
          {TABS.map((t) => (
            <a
              key={t.key}
              href={`#/${t.key}`}
              className={route === t.key ? "tab active" : "tab"}
            >
              <span className="ico">{t.ico}</span>
              {t.label}
              {t.key === "matchday" && liveCount > 0 && (
                <span className="badge">{liveCount}</span>
              )}
            </a>
          ))}
        </div>
      </nav>

      <div className="wrap">
        <main className="page" key={route + param}>{PAGES[route]}</main>
      </div>

      {/* secret dank-mode trigger — triple-click me */}
      <div className="dank-corner" onClick={cornerClick} aria-hidden />
      {dank && <DankFx />}
      {dankBanner && <div className="dank-banner">420<br />DANK MODE<br />ENABLED</div>}
    </>
  )
}
