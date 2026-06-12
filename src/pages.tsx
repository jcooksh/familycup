import { useState } from "react"

import { PARTICIPANTS, TEAM_OWNER, TEAM_OWNER_NAME, TOURNAMENT } from "@/data/draft"
import { GROUPS } from "@/data/wheelspin"
import { flagOf, initialsOf, colorOf, abbrOf } from "@/data/flags"
import { POINTS, type Match, type Standing } from "@/lib/scoring"
import {
  type TeamRow, type Totals, STAGE_RANK,
  isLive, isFinished, isUpcoming,
} from "@/lib/derive"

export interface PageData {
  me: string
  matches: Match[]
  standings: Standing[]
  teamRows: TeamRow[]
  totals: Totals
  formByParticipant: Record<string, string>
  koByParticipant: Record<string, number>
  updatedAt: string | null
  reload: () => void
}

const ownerName = (team: string): string | undefined => TEAM_OWNER_NAME[team]
const ownerId = (team: string): string | undefined => TEAM_OWNER[team]
const gdStr = (gd: number) => `${gd >= 0 ? "+" : ""}${gd}`
const byDate = (a: Match, b: Match) => (a.utcDate ?? "").localeCompare(b.utcDate ?? "")

const TEAM_GROUP: Record<string, string> = {}
for (const g of GROUPS) for (const t of g.teams) TEAM_GROUP[t] = g.id

const fmtDay = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "TBD"
const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--"

/* ── shared bits ── */
function Pips({ form, mini }: { form: string[]; mini?: boolean }) {
  const chars = form.slice(-5)
  return (
    <span className={mini ? "mini" : "form"}>
      {chars.length === 0
        ? [0, 1, 2].map((i) => <span key={i} className="none">·</span>)
        : chars.map((c, i) => (
          <span key={i} className={c === "live" ? "live" : c === "W" ? "w" : c === "D" ? "d" : "l"}>
            {c === "live" ? "●" : c}
          </span>
        ))}
    </span>
  )
}

function OwnerLine({ team }: { team: string }) {
  const id = ownerId(team)
  if (!id) return null
  return (
    <div className="ownline">
      <span className="dotc" style={{ background: colorOf(id) }} />
      {ownerName(team)}
    </div>
  )
}

/* ════════ STANDINGS ════════ */
function NextUp({ matches }: { matches: Match[] }) {
  const next = matches.filter(isUpcoming).sort(byDate)[0]
  if (!next) return <div className="eyebrow">World Cup 2026 · The Family Sweepstake</div>

  const Side = ({ team }: { team: string }) => {
    const id = ownerId(team)
    return (
      <span className="nu-team">
        <span className="nu-fl">{flagOf(team)}</span>
        <span className="nu-tn">{team}</span>
        {id
          ? <span className="nu-own"><span className="dotc" style={{ background: colorOf(id) }} /> {ownerName(team)}</span>
          : <span className="nu-own none">unpicked</span>}
      </span>
    )
  }
  return (
    <div className="nextup">
      <div className="nu-lbl"><span className="nu-pip" />Next up · {fmtDay(next.utcDate)} · {fmtTime(next.utcDate)} kickoff</div>
      <div className="nu-fix">
        <Side team={next.homeTeam} /><span className="nu-v">v</span><Side team={next.awayTeam} />
      </div>
    </div>
  )
}

function Countdown({ matches }: { matches: Match[] }) {
  const now = Date.now()
  const from = new Date(TOURNAMENT.fromDate).getTime()
  const to = new Date(TOURNAMENT.toDate).getTime()
  const inKo = matches.some((m) => (STAGE_RANK[m.stage] ?? 0) > 0 && (isLive(m) || isFinished(m)))
  const top = now < from
    ? "Kicks off soon"
    : inKo ? "Knockout rounds" : `Group stage · Day ${Math.max(1, Math.floor((now - from) / 86_400_000) + 1)}`
  const daysLeft = Math.max(0, Math.ceil((to - now) / 86_400_000))
  return (
    <div className="countdown">
      <div className="lbl">{top}</div>
      <div className="big">{daysLeft === 0 ? "Final day" : `${daysLeft} days`}</div>
      <div className="lbl" style={{ marginTop: 4 }}>until the final</div>
    </div>
  )
}

function tickerItems(matches: Match[]): { tag: string; items: string[] } {
  const score = (m: Match) =>
    `${flagOf(m.homeTeam)} ${abbrOf(m.homeTeam)} ${m.homeScore ?? 0}–${m.awayScore ?? 0} ${flagOf(m.awayTeam)} ${abbrOf(m.awayTeam)}`

  const impact = (m: Match): string => {
    const ho = ownerName(m.homeTeam), ao = ownerName(m.awayTeam)
    if (m.homeScore == null || m.awayScore == null) return ""
    if (m.homeScore > m.awayScore) return ho ? ` · <b>${ho} +3</b>` : ""
    if (m.homeScore < m.awayScore) return ao ? ` · <b>${ao} +3</b>` : ""
    if (ho && ao && ho !== ao) return ` · <b>${ho} & ${ao} share</b>`
    if (ho && ao) return ` · <b>${ho} +2</b>`
    const one = ho ?? ao
    return one ? ` · <b>${one} +1</b>` : ""
  }

  const live = matches.filter(isLive).sort(byDate)
  const recent = matches.filter(isFinished).sort((a, b) => byDate(b, a)).slice(0, 8)
  const items = [
    ...live.map((m) => `${score(m)} · <b>LIVE</b>`),
    ...recent.map((m) => `${score(m)}${impact(m)}`),
  ]
  if (items.length > 0) return { tag: live.length > 0 ? "LIVE" : "LATEST", items }

  const soon = matches.filter(isUpcoming).sort(byDate).slice(0, 5)
  return {
    tag: "SOON",
    items: soon.map((m) =>
      `${flagOf(m.homeTeam)} ${abbrOf(m.homeTeam)} v ${abbrOf(m.awayTeam)} ${flagOf(m.awayTeam)} · <b>${fmtDay(m.utcDate)} ${fmtTime(m.utcDate)}</b>`),
  }
}

export function StandingsPage({ d }: { d: PageData }) {
  const { standings, matches, formByParticipant, koByParticipant } = d
  const podClass = ["gold", "teal", "coral"]
  const podWord = ["First place 👑", "Runner-up", "Third"]
  const ticker = tickerItems(matches)
  const run = ticker.items.join('<span class="dot">◆</span>') + '<span class="dot">◆</span>'

  return (
    <>
      <section className="hero">
        <div><NextUp matches={matches} /></div>
        <Countdown matches={matches} />
      </section>

      {ticker.items.length > 0 && (
        <div className="ticker">
          <span className="tag">{ticker.tag}</span>
          <div className="scroll">
            <span className="run" dangerouslySetInnerHTML={{ __html: run + run }} />
          </div>
        </div>
      )}

      <div className="section-head"><h2>On the podium</h2><div className="spacer" /><span className="eyebrow">Top 3 of {standings.length}</span></div>
      <div className="podium">
        {standings.slice(0, 3).map((s, i) => (
          <div key={s.participant.id} className={`pod ${podClass[i]}`}>
            <div className="rk-badge">{i + 1}</div>
            <div className="rk-word">{podWord[i]}</div>
            <div className="nm">{s.participant.name}</div>
            <div className="flags">
              {s.participant.teams.map((t) => <span key={t} className="f">{flagOf(t)}</span>)}
            </div>
            <div className="pts">{s.points}<span className="u">pts</span></div>
            <div className="meta">GD {gdStr(s.gd)} · {s.won}W {s.drawn}D {s.lost}L</div>
          </div>
        ))}
      </div>

      <div className="section-head"><h2>Full table</h2><div className="spacer" /><span className="eyebrow">Tap a player · GD tie-break</span></div>
      <div className="board">
        <div className="head"><span>#</span><span>Player</span><span>Teams</span><span>Form</span><span className="r">GD</span><span className="r">Pts</span></div>
        {standings.map((s, i) => {
          const p = s.participant
          return (
            <a key={p.id} href={`#/players/${p.id}`} className={i === 0 ? "row leader" : "row"}>
              <div className="rk"><span className="pos">{i + 1}</span></div>
              <div className="who">
                <div className="ava" style={{ background: colorOf(p.id) }}>{initialsOf(p.name)}</div>
                <div>
                  <div className="nm">{p.name}</div>
                  <div className="sub">{s.won}W {s.drawn}D {s.lost}L · {koByParticipant[p.id]} in KO</div>
                </div>
              </div>
              <div className="flagcluster">
                {p.teams.map((t) => <span key={t} className="f">{flagOf(t)}</span>)}
              </div>
              <Pips form={(formByParticipant[p.id] ?? "").split("")} />
              <div className={`gd num ${s.gd > 0 ? "pos" : s.gd < 0 ? "neg" : ""}`}>{gdStr(s.gd)}</div>
              <div className="pts-cell num">{s.points}</div>
            </a>
          )
        })}
      </div>
      <div className="footnote">
        <span className="chip">WIN +{POINTS.win}</span><span className="chip">DRAW +{POINTS.draw}</span><span className="chip">KO ROUND +{POINTS.nextRound}</span>
        Draw a team that goes out early? You keep the points. No swaps, no refunds.
      </div>
    </>
  )
}

/* ════════ MATCH DAY ════════ */
function MatchCard({ m }: { m: Match }) {
  const live = isLive(m), fin = isFinished(m)
  const stat = live
    ? <span className="stat live"><span className="pip" />LIVE</span>
    : fin
      ? <span className="stat ft">FULL TIME</span>
      : <span className="stat soon">{fmtTime(m.utcDate)}</span>

  const Side = ({ team, score, other }: { team: string; score: number | null; other: number | null }) => {
    const dim = (fin || live) && score != null && other != null && score < other
    return (
      <div className={dim ? "side dim" : "side"}>
        <span className="fl">{flagOf(team)}</span>
        <div>
          <span className="tn">{team}</span>
          <OwnerLine team={team} />
        </div>
        <span className="sc">{fin || live ? score ?? 0 : ""}</span>
      </div>
    )
  }
  return (
    <div className={live ? "match islive" : "match"}>
      <div className="mh"><span className="when">{fmtDay(m.utcDate)}</span>{stat}</div>
      <Side team={m.homeTeam} score={m.homeScore} other={m.awayScore} />
      {!fin && !live && <div className="vs">vs</div>}
      <Side team={m.awayTeam} score={m.awayScore} other={m.homeScore} />
    </div>
  )
}

function DayGroups({ matches }: { matches: Match[] }) {
  const groups: Record<string, Match[]> = {}
  for (const m of matches) (groups[fmtDay(m.utcDate)] ??= []).push(m)
  return (
    <>
      {Object.entries(groups).map(([day, ms]) => (
        <div key={day}>
          <div className="dayhdr">{day}</div>
          <div className="match-grid">{ms.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        </div>
      ))}
    </>
  )
}

export function MatchDayPage({ d }: { d: PageData }) {
  const { matches } = d
  const live = matches.filter(isLive).sort(byDate)
  const finished = matches.filter(isFinished).sort((a, b) => byDate(b, a))
  const upcoming = matches.filter(isUpcoming).sort(byDate)
  const results = finished.slice(0, 24)
  const soon = upcoming.slice(0, 18)

  return (
    <>
      <div className="section-head">
        <h2>Match Day</h2><div className="spacer" />
        <span className="eyebrow">{live.length} live · {finished.length} done · {upcoming.length} to come</span>
      </div>

      {live.length > 0 && (
        <>
          <div className="dayhdr" style={{ marginTop: 6 }}>🔴 Live now</div>
          <div className="match-grid">{live.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        </>
      )}

      <div className="section-head mt"><h2>Results</h2></div>
      {results.length
        ? <DayGroups matches={results} />
        : <div className="empty">No results yet — first kick-off {fmtDay(upcoming[0]?.utcDate)}</div>}
      {finished.length > results.length && (
        <div className="footnote"><span className="chip">{finished.length - results.length} earlier results not shown</span></div>
      )}

      <div className="section-head mt"><h2>Coming up</h2></div>
      {soon.length
        ? <DayGroups matches={soon} />
        : <div className="empty">No scheduled fixtures</div>}
      {upcoming.length > soon.length && (
        <div className="footnote"><span className="chip">+{upcoming.length - soon.length} more fixtures later in the tournament</span></div>
      )}
    </>
  )
}

/* ════════ BRACKET ════════ */
const KO_COLS = [
  { stage: "LAST_32", label: "Round of 32" },
  { stage: "LAST_16", label: "Round of 16" },
  { stage: "QUARTER_FINALS", label: "Quarters" },
  { stage: "SEMI_FINALS", label: "Semis" },
  { stage: "FINAL", label: "Final" },
]

export function BracketPage({ d }: { d: PageData }) {
  const { matches } = d
  const ko = matches.filter((m) => (STAGE_RANK[m.stage] ?? 0) > 0 && m.stage !== "THIRD_PLACE")

  const TieRow = ({ team, win }: { team: string; win: boolean }) => (
    <div className={win ? "t win" : "t"}>
      <span className="fl">{flagOf(team)}</span>
      <span className="tn">{team}</span>
      <span className="od" style={{ background: ownerId(team) ? colorOf(ownerId(team)) : "transparent" }} />
    </div>
  )
  const Tie = ({ m, final }: { m: Match; final?: boolean }) => {
    const hw = m.homeScore != null && m.awayScore != null && m.homeScore > m.awayScore && isFinished(m)
    const aw = m.homeScore != null && m.awayScore != null && m.awayScore > m.homeScore && isFinished(m)
    const cls = ["tie", final ? "final" : "", isLive(m) ? "islive" : ""].filter(Boolean).join(" ")
    return (
      <div className={cls}>
        <TieRow team={m.homeTeam} win={hw} />
        <TieRow team={m.awayTeam} win={aw} />
      </div>
    )
  }
  const TbdTie = () => (
    <div className="tie"><div className="t tbd"><span className="fl">🏳️</span><span className="tn">TBD</span></div><div className="t tbd"><span className="fl">🏳️</span><span className="tn">TBD</span></div></div>
  )

  const final = ko.find((m) => m.stage === "FINAL" && isFinished(m))
  const champ = final
    ? (final.homeScore ?? 0) > (final.awayScore ?? 0) ? final.homeTeam : final.awayTeam
    : null

  return (
    <>
      <div className="section-head">
        <h2>The Bracket</h2><div className="spacer" />
        <span className="eyebrow">+{POINTS.nextRound} per round reached</span>
      </div>

      {ko.length === 0 ? (
        <div className="empty">Bracket is set after the group stage — check back once the Round of 32 is drawn</div>
      ) : (
        <div className="bracket">
          {KO_COLS.map(({ stage, label }) => {
            const ties = ko.filter((m) => m.stage === stage).sort(byDate)
            return (
              <div className="bcol" key={stage}>
                <div className="bcol-h">{label}</div>
                <div className="bcol-body">
                  {ties.length
                    ? ties.map((m) => <Tie key={m.id} m={m} final={stage === "FINAL"} />)
                    : <TbdTie />}
                  {stage === "FINAL" && champ && (
                    <div className="champ">
                      <div className="lbl">Champions</div>
                      <div className="fl">{flagOf(champ)}</div>
                      <div className="tn">{champ}</div>
                      {ownerName(champ) && <div className="lbl" style={{ marginTop: 6 }}>{ownerName(champ)} cashes in 🏆</div>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="footnote bracket-note">
        <span className="chip">Live data</span>
        Reaching each round is <b>+{POINTS.nextRound}</b> for the owning player — the bracket is where
        the table can flip. Coloured dots show who owns each nation.
      </div>
    </>
  )
}

/* ════════ PLAYERS ════════ */
function PlayerCardTop({ s, rank }: { s: Standing; rank: number }) {
  const p = s.participant
  return (
    <div className="top" style={{ background: colorOf(p.id) }}>
      <div className="ava">{initialsOf(p.name)}</div>
      <div>
        <div className="nm">{p.name}</div>
        <div className="sub">RANK #{rank} · {s.won}W {s.drawn}D {s.lost}L · GD {gdStr(s.gd)}</div>
      </div>
      <div className="big"><div className="n">{s.points}</div><div className="u">POINTS</div></div>
    </div>
  )
}

function TeamRows({ teams, rows }: { teams: string[]; rows: TeamRow[] }) {
  const byTeam = Object.fromEntries(rows.map((r) => [r.team, r]))
  const sorted = [...teams].sort((a, b) => (byTeam[b]?.points ?? 0) - (byTeam[a]?.points ?? 0) || a.localeCompare(b))
  return (
    <>
      {sorted.map((t) => {
        const r = byTeam[t]
        return (
          <div key={t} className="teamrow">
            <span className="fl">{flagOf(t)}</span>
            <span className="tn">{t}</span>
            <Pips mini form={r?.form ?? []} />
            <span className={r?.live ? "tp live" : "tp"}>{r?.points ?? 0} pt{(r?.points ?? 0) === 1 ? "" : "s"}</span>
          </div>
        )
      })}
    </>
  )
}

export function PlayersPage({ d, playerId }: { d: PageData; playerId?: string }) {
  if (playerId && PARTICIPANTS.some((p) => p.id === playerId)) {
    return <PlayerDetail d={d} id={playerId} />
  }
  const { standings, teamRows } = d
  return (
    <>
      <div className="section-head">
        <h2>The Players</h2><div className="spacer" />
        <span className="eyebrow">{standings.length} players · 48 nations · tap for detail</span>
      </div>
      <div className="pairs-grid">
        {standings.map((s, i) => (
          <a key={s.participant.id} href={`#/players/${s.participant.id}`} className="pcard link">
            <PlayerCardTop s={s} rank={i + 1} />
            <div className="body"><TeamRows teams={s.participant.teams} rows={teamRows} /></div>
          </a>
        ))}
      </div>
    </>
  )
}

function PlayerDetail({ d, id }: { d: PageData; id: string }) {
  const { standings, teamRows, matches } = d
  const idx = standings.findIndex((s) => s.participant.id === id)
  const s = standings[idx]
  const p = s.participant
  const teamSet = new Set(p.teams)
  const theirs = matches.filter((m) => teamSet.has(m.homeTeam) || teamSet.has(m.awayTeam))
  const live = theirs.filter(isLive).sort(byDate)
  const upcoming = theirs.filter(isUpcoming).sort(byDate).slice(0, 12)
  const results = theirs.filter(isFinished).sort((a, b) => byDate(b, a)).slice(0, 12)

  return (
    <>
      <a href="#/players" className="backlink">← All players</a>
      <div className="pcard" style={{ marginBottom: 26 }}>
        <PlayerCardTop s={s} rank={idx + 1} />
        <div className="body"><TeamRows teams={p.teams} rows={teamRows} /></div>
      </div>

      {live.length > 0 && (
        <>
          <div className="dayhdr">🔴 Live now</div>
          <div className="match-grid">{live.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        </>
      )}
      <div className="dayhdr">Coming up</div>
      {upcoming.length
        ? <div className="match-grid">{upcoming.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        : <div className="empty">No upcoming fixtures</div>}
      <div className="dayhdr">Results</div>
      {results.length
        ? <div className="match-grid">{results.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        : <div className="empty">No results yet</div>}
    </>
  )
}

/* ════════ TEAMS ════════ */
export function TeamsPage({ d }: { d: PageData }) {
  const { teamRows } = d
  const [filter, setFilter] = useState<string>("all")
  const sorted = [...teamRows].sort((a, b) =>
    Number(b.live) - Number(a.live) || b.points - a.points || a.team.localeCompare(b.team))
  const rows = filter === "all" ? sorted : sorted.filter((t) => ownerId(t.team) === filter)

  return (
    <>
      <div className="section-head">
        <h2>The Teams</h2><div className="spacer" />
        <span className="eyebrow">{rows.length} nations · points contributed</span>
      </div>
      <div className="filterbar">
        <button className={filter === "all" ? "fbtn active" : "fbtn"} onClick={() => setFilter("all")}>
          All {teamRows.length}
        </button>
        {PARTICIPANTS.map((p) => (
          <button key={p.id} className={filter === p.id ? "fbtn active" : "fbtn"} onClick={() => setFilter(p.id)}>
            <span className="dotc" style={{ background: colorOf(p.id) }} />{p.name}
          </button>
        ))}
      </div>
      <div className="teams-grid">
        {rows.map((t) => {
          const id = ownerId(t.team)
          return (
            <div key={t.team} className="tcard">
              <span className="stripe" style={{ background: id ? colorOf(id) : "var(--line)" }} />
              {t.live && <span className="livedot" />}
              <span className="fl">{flagOf(t.team)}</span>
              <div className="info">
                <div className="tn">{t.team}</div>
                <div className="ow">{TEAM_GROUP[t.team] ? `Grp ${TEAM_GROUP[t.team]} · ` : ""}{t.owner ?? "—"}</div>
              </div>
              <div className="pp">{t.points}<small>PTS</small></div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ════════ STATS ════════ */
export function StatsPage({ d }: { d: PageData }) {
  const { standings, teamRows, totals } = d
  const leader = standings[0]
  const last = standings[standings.length - 1]
  const best = [...teamRows].sort((a, b) => b.points - a.points)[0]
  const inKo = teamRows.filter((t) => STAGE_RANK[t.stage] > 0).length
  const maxPts = Math.max(1, leader?.points ?? 0)
  const started = totals.played > 0

  return (
    <>
      <div className="section-head">
        <h2>The Stats</h2><div className="spacer" />
        <span className="eyebrow">{started ? "live records" : "waiting for kick-off"}</span>
      </div>
      <div className="stat-grid">
        <div className="scard gold"><span className="em">👑</span><div className="k">Top of the pile</div><div className="v">{leader?.participant.name ?? "—"}</div><div className="d">{leader?.points ?? 0} pts · {leader?.won ?? 0} wins · GD {gdStr(leader?.gd ?? 0)}</div></div>
        <div className="scard coral"><span className="em">🥶</span><div className="k">Rock bottom</div><div className="v">{last?.participant.name ?? "—"}</div><div className="d">{last?.points ?? 0} pts — someone has to be</div></div>
        <div className="scard ink"><span className="em">{best && best.points > 0 ? flagOf(best.team) : "🔮"}</span><div className="k">Best pick so far</div><div className="v">{best && best.points > 0 ? best.team : "TBD"}</div><div className="d">{best && best.points > 0 ? `${best.points} pts for ${best.owner}` : "no points banked yet"}</div></div>
        <div className="scard teal"><span className="em">⚽</span><div className="k">Goals so far</div><div className="v">{totals.goals}</div><div className="d">across {totals.finished} finished games</div></div>
        <div className="scard cream"><span className="em">🚀</span><div className="k">Teams in knockouts</div><div className="v">{inKo}<span style={{ fontSize: 20, opacity: .6 }}> / 48</span></div><div className="d">+{POINTS.nextRound} pts per round reached</div></div>
        <div className="scard cream"><span className="em">🔴</span><div className="k">Live right now</div><div className="v">{totals.live}</div><div className="d">{totals.live > 0 ? "matches in play" : "no games kicked off"}</div></div>
      </div>

      <div className="section-head"><h2>Points by player</h2></div>
      <div className="barlist">
        {standings.map((s) => (
          <div key={s.participant.id} className="barrow">
            <span className="bn">{s.participant.name}</span>
            <div className="bartrack">
              <div className="barfill" style={{ width: `${Math.round((s.points / maxPts) * 100)}%`, background: colorOf(s.participant.id) }} />
            </div>
            <span className="bv">{s.points}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/* ════════ RULES ════════ */
export function RulesPage(_: { d: PageData }) {
  return (
    <>
      <div className="section-head">
        <h2>How it works</h2><div className="spacer" />
        <span className="eyebrow">The sweepstake rules</span>
      </div>
      <div className="rules-grid">
        <div className="rule-card">
          <h3>Scoring</h3>
          <div className="score-line"><div className="ic" style={{ background: "rgba(7,160,133,.14)" }}>✅</div><div className="lab">Win<small>any of your teams wins a match</small></div><div className="pl pos">+{POINTS.win}</div></div>
          <div className="score-line"><div className="ic" style={{ background: "rgba(255,176,46,.18)" }}>🤝</div><div className="lab">Draw<small>a point for a stalemate</small></div><div className="pl pos">+{POINTS.draw}</div></div>
          <div className="score-line"><div className="ic" style={{ background: "rgba(146,136,118,.14)" }}>❌</div><div className="lab">Loss<small>nothing — but you keep what you've banked</small></div><div className="pl" style={{ color: "var(--ink-3)" }}>0</div></div>
          <div className="score-line"><div className="ic" style={{ background: "rgba(46,91,255,.12)" }}>🚀</div><div className="lab">Reach a knockout round<small>R32, R16, QF, SF, Final — each step</small></div><div className="pl pos">+{POINTS.nextRound}</div></div>
        </div>
        <div className="stack">
          <div className="rule-card">
            <h3>Tie-breaks</h3>
            <div className="tiebreak"><span className="n">1</span><div><b>Goal difference</b> across all your teams</div></div>
            <div className="tiebreak"><span className="n">2</span><div><b>Goals scored</b> — attack wins the day</div></div>
            <div className="tiebreak"><span className="n">3</span><div><b>Alphabetical</b> on name. Harsh but fair.</div></div>
          </div>
          <div className="rule-card">
            <h3>Live data</h3>
            <p>Scores come from <code>football-data.org</code>. A scheduled job refreshes results
              every ~10 minutes on match days and the board re-polls every 60 seconds — no manual updates.</p>
            <p>Teams were drafted on the <a href="#/wheelspin" style={{ textDecoration: "underline" }}>Wheelspin</a> —
              one favourite each, then a spin per group. No swaps, no refunds.</p>
          </div>
        </div>
      </div>
      <div className="footnote" style={{ marginTop: 24 }}>
        <span className="chip">{PARTICIPANTS.length} players</span><span className="chip">48 nations</span><span className="chip">wheelspun, not chosen</span>
        Drafted by the wheel. Most points after the final lifts the (family) cup.
      </div>
    </>
  )
}

/* ════════ ADMIN ════════ */
export function AdminPage({ d }: { d: PageData }) {
  const { updatedAt, reload, totals, matches } = d
  const lastSync = updatedAt ? new Date(updatedAt).toLocaleString() : "never"
  const dataUrl = `${import.meta.env.BASE_URL}data/matches.json`

  return (
    <>
      <div className="section-head">
        <h2>Admin</h2><div className="spacer" />
        <span className="eyebrow">draft · data · sync</span>
      </div>

      <div className="stat-grid">
        <div className="scard cream"><span className="em">🔄</span><div className="k">Last sync</div><div className="v" style={{ fontSize: 24 }}>{lastSync === "never" ? "never" : lastSync.split(",")[1]?.trim() ?? lastSync}</div><div className="d">auto every ~10 min on match days</div></div>
        <div className="scard cream"><span className="em">📦</span><div className="k">Matches loaded</div><div className="v">{matches.length}</div><div className="d">{totals.played} played · {totals.upcoming} upcoming</div></div>
        <div className="scard cream"><span className="em">📡</span><div className="k">Source</div><div className="v" style={{ fontSize: 22 }}>football-data</div><div className="d">competition WC · season 2026</div></div>
        <div className="scard cream"><span className="em">🔴</span><div className="k">Live</div><div className="v">{totals.live}</div><div className="d">matches in play</div></div>
      </div>

      <div className="rules-grid">
        <div className="rule-card">
          <h3>The draft</h3>
          {PARTICIPANTS.map((p) => (
            <div key={p.id} className="draft-row">
              <div className="ava" style={{ background: colorOf(p.id) }}>{initialsOf(p.name)}</div>
              <div className="nm">{p.name}</div>
              <div className="chips">
                {p.teams.length
                  ? p.teams.map((t) => <span key={t} className="chip">{flagOf(t)} {t}</span>)
                  : <span className="chip">no teams yet — spin the wheel</span>}
              </div>
            </div>
          ))}
          <p style={{ marginTop: 14, fontSize: 13, color: "var(--ink-3)" }}>
            Ownership comes from the Wheelspin results (published in <code>src/data/wheelspin.ts</code>).
          </p>
        </div>

        <div className="stack">
          <div className="rule-card">
            <h3>Data</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="ghost-btn" style={{ justifyContent: "center" }} onClick={reload}>⟳ Reload scores now</button>
              <a className="ghost-btn" style={{ justifyContent: "center" }} href={dataUrl} download>↓ Download matches.json</a>
            </div>
          </div>
          <div className="rule-card">
            <h3>API key</h3>
            <p><code>FOOTBALL_DATA_KEY</code> is stored as a GitHub repo secret and used only by
              the CI fetch job. It never reaches the browser.</p>
          </div>
        </div>
      </div>
    </>
  )
}
