import * as React from "react"

import {
  FAMILY, FAVOURITES, GROUPS, groupSpinTeams, groupFavourite, turnOrderFor,
  type Family, type WheelState,
  loadWheel, saveWheel, resetWheel, lockWheel, slotOf, WHEELSPIN_EVENT,
} from "@/data/wheelspin"
import { flagOf } from "@/data/flags"

// Segment colours, cycled around the wheel.
const PALETTE = [
  "#e23d3d", "#2f7be2", "#27b06a", "#e6a019", "#8b5cf6",
  "#e2563d", "#159e9e", "#d6479a", "#5b8c2a", "#3d5ae2",
]

// ── geometry helpers ──
const TAU = Math.PI / 180
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg - 90) * TAU
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}
function segPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const [x1, y1] = polar(cx, cy, r, start)
  const [x2, y2] = polar(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`
}

// The spinning SVG wheel. Remounts (via key) whenever the team list changes, so
// each spin starts from rest at 0°. Setting `targetIdx` while `spinning` kicks
// off the CSS transition; onDone fires when it settles.
function Wheel({
  teams, targetIdx, spinning, onDone,
}: {
  teams: string[]
  targetIdx: number | null
  spinning: boolean
  onDone: (team: string) => void
}) {
  const n = teams.length
  const [rot, setRot] = React.useState(0)

  React.useEffect(() => {
    if (!spinning || targetIdx == null) return
    const segAngle = 360 / n
    const center = (targetIdx + 0.5) * segAngle
    const turns = 6
    // Bring the winning segment's centre to the top pointer (0°), after a few
    // full turns. A tiny jitter keeps it from looking mechanical.
    const jitter = (Math.random() - 0.5) * segAngle * 0.5
    setRot(360 * turns + (360 - center) + jitter)
  }, [spinning, targetIdx, n])

  const R = 100
  const labelMode = n <= 14 // show names on small wheels, flags only when crowded
  const fontSize = n <= 6 ? 9 : n <= 14 ? 7 : 9

  return (
    <div className="wheel">
      <div className="wheel-pointer" />
      <svg
        viewBox="0 0 200 200"
        className="wheel-svg"
        style={{
          transform: `rotate(${rot}deg)`,
          transition: spinning ? "transform 4.2s cubic-bezier(.16,.84,.26,1)" : "none",
        }}
        onTransitionEnd={() => {
          if (spinning && targetIdx != null) onDone(teams[targetIdx])
        }}
      >
        {teams.map((t, i) => {
          const seg = 360 / n
          const start = i * seg
          const end = start + seg
          const mid = start + seg / 2
          const [tx, ty] = polar(R, R, R * 0.66, mid)
          return (
            <g key={t}>
              <path d={segPath(R, R, R - 2, start, end)} fill={PALETTE[i % PALETTE.length]} stroke="#0b1020" strokeWidth={0.6} />
              <text
                x={tx}
                y={ty}
                fontSize={fontSize}
                fill="#fff"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid} ${tx} ${ty})`}
                style={{ fontWeight: 600, pointerEvents: "none" }}
              >
                {labelMode ? `${flagOf(t)} ${t}` : flagOf(t)}
              </text>
            </g>
          )
        })}
        <circle cx={R} cy={R} r={9} fill="#0b1020" stroke="#fff" strokeWidth={1.5} />
      </svg>
    </div>
  )
}

function WheelGame({
  title, subtitle, teams, preassigned, assigned, order, locked, compact,
  roster = FAMILY, gate, onAssign, onReset,
}: {
  title: string
  subtitle: string
  teams: string[] // the pool that actually spins
  preassigned?: { team: string; note: string } // a team handed out elsewhere (e.g. favourite)
  assigned: Record<string, string>
  order: string[]
  locked: boolean
  compact?: boolean
  roster?: Family[] // who may spin, in turn order (defaults to everyone)
  gate?: string // if set, the wheel is blocked with this message
  onAssign: (team: string, person: Family) => void
  onReset: () => void
}) {
  const remaining = teams.filter((t) => !(t in assigned))
  const done = remaining.length === 0

  const turnIdx = roster.length ? order.length % roster.length : 0
  const currentPerson = roster[turnIdx] ?? FAMILY[0]

  const [spinning, setSpinning] = React.useState(false)
  const [targetIdx, setTargetIdx] = React.useState<number | null>(null)
  const [lastWin, setLastWin] = React.useState<{ team: string; name: string } | null>(null)

  const spin = () => {
    if (spinning || done || locked || gate) return
    setLastWin(null)
    const idx = Math.floor(Math.random() * remaining.length)
    setTargetIdx(idx)
    setSpinning(true)
  }

  const onDone = (team: string) => {
    setLastWin({ team, name: currentPerson.name })
    setSpinning(false)
    setTargetIdx(null)
    onAssign(team, currentPerson)
  }

  const reset = () => {
    if (!confirm(`Reset "${title}"? This clears those results.`)) return
    onReset()
    setLastWin(null)
    setSpinning(false)
    setTargetIdx(null)
  }

  // teams each person ended up with, in this wheel
  const byPerson = FAMILY.map((f) => ({
    person: f,
    teams: order.filter((t) => assigned[t] === f.id),
  }))

  return (
    <section className={compact ? "wheelgame compact" : "wheelgame"}>
      <div className="wheelgame-head">
        <div>
          <h2>{title}</h2>
          <p className="wheelgame-sub">{subtitle}</p>
        </div>
        {(order.length > 0 || done) && !locked && (
          <button className="btn ghost" onClick={reset}>Reset</button>
        )}
      </div>

      <div className="wheelgame-body">
        <div className="wheel-col">
          {remaining.length > 0 ? (
            <Wheel
              key={remaining.length}
              teams={remaining}
              targetIdx={targetIdx}
              spinning={spinning}
              onDone={onDone}
            />
          ) : (
            <div className="wheel done">
              <div className="wheel-done-tick">✓</div>
              <div>All teams drawn</div>
            </div>
          )}

          <div className="wheel-controls">
            {locked ? (
              <div className="turn-banner locked">🔒 Submitted · teams locked</div>
            ) : gate ? (
              <div className="turn-banner gated">🔒 {gate}</div>
            ) : done ? (
              <div className="turn-banner locked">✓ All teams drawn</div>
            ) : (
              <>
                <div className="turn-banner" style={{ borderColor: PALETTE[turnIdx % PALETTE.length] }}>
                  <span className="turn-dot" style={{ background: PALETTE[turnIdx % PALETTE.length] }} />
                  {currentPerson.name}'s turn
                </div>
                <button className="btn spin-btn" onClick={spin} disabled={spinning}>
                  {spinning ? "Spinning…" : `Spin (${remaining.length} left)`}
                </button>
              </>
            )}
            {lastWin && (
              <div className="last-win">
                <strong>{lastWin.name}</strong> got {flagOf(lastWin.team)} <strong>{lastWin.team}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="wheel-results">
          {preassigned && (
            <div className="wheel-preassigned">
              {flagOf(preassigned.team)} <strong>{preassigned.team}</strong> — {preassigned.note}
            </div>
          )}
          {byPerson.map(({ person, teams: ts }) => (
            <div className="wheel-result-card" key={person.id}>
              <div className="wheel-result-head">
                <span>{person.name}</span>
                <span className="count">{ts.length}</span>
              </div>
              <div className="wheel-result-teams">
                {ts.length === 0
                  ? <span className="muted">—</span>
                  : ts.map((t) => (
                    <span className="chip" key={t}>{flagOf(t)} {t}</span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function WheelspinPage() {
  const [state, setState] = React.useState<WheelState>(() => loadWheel())

  // Stay in sync if storage changes elsewhere (e.g. another tab, or reset).
  React.useEffect(() => {
    const h = () => setState(loadWheel())
    window.addEventListener(WHEELSPIN_EVENT, h)
    window.addEventListener("storage", h)
    return () => {
      window.removeEventListener(WHEELSPIN_EVENT, h)
      window.removeEventListener("storage", h)
    }
  }, [])

  const persist = (s: WheelState) => {
    setState(s)
    saveWheel(s)
  }

  // Favourites wheel writes into fav/favOrder.
  const assignFav = (team: string, person: Family) => {
    const next: WheelState = structuredClone(state)
    next.fav[team] = person.id
    next.favOrder.push(team)
    persist(next)
  }

  // Each group wheel writes into its own slot.
  const assignGroup = (groupId: string) => (team: string, person: Family) => {
    const next: WheelState = structuredClone(state)
    const slot = slotOf(next, groupId)
    slot.assigned[team] = person.id
    slot.order.push(team)
    persist(next)
  }

  const submit = () => {
    if (!confirm("Lock in all team assignments? This cannot be undone.")) return
    setState(lockWheel())
  }

  // Copy + download the locked results so they can be sent off and published
  // for everyone (pasted into BAKED_RESULTS).
  const exportResults = () => {
    const json = JSON.stringify(state, null, 2)
    navigator.clipboard?.writeText(json).catch(() => {})
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "familycup-results.json"
    a.click()
    URL.revokeObjectURL(url)
    alert("Results copied to clipboard and downloaded as familycup-results.json.\nSend that file to Jake to publish for everyone.")
  }

  // Group wheels open only once all four favourites are drawn.
  const favDone = state.favOrder.length === FAVOURITES.length

  return (
    <div className="wheelspin">
      <div className="wheelspin-intro">
        Each player spins on their turn and the wheel hands them a team. The
        favourites go first, then spin through every group. Results lock in and
        feed the standings.
      </div>

      <WheelGame
        title="The Favourites"
        subtitle="Spain · England · France · Brazil — one each"
        teams={FAVOURITES}
        assigned={state.fav}
        order={state.favOrder}
        locked={state.locked}
        roster={turnOrderFor("fav")}
        onAssign={assignFav}
        onReset={() => persist(resetWheel("fav"))}
      />

      <h3 className="wheelspin-section">The Groups</h3>
      <div className="wheelspin-groups">
        {GROUPS.map((g) => {
          const fav = groupFavourite(g)
          const favOwnerId = fav ? state.fav[fav] : undefined
          const favOwner = FAMILY.find((f) => f.id === favOwnerId)
          // Each group spins in its own distinct order; the favourite's owner is
          // dropped (they already have that team), keeping the rest in sequence.
          const base = turnOrderFor(g.id)
          const roster = favOwnerId ? base.filter((f) => f.id !== favOwnerId) : base
          // Group wheels stay locked until every favourite has been drawn.
          const gate = favDone ? undefined : "Spin the favourites first"
          const slot = state.groups[g.id] ?? { assigned: {}, order: [] }
          return (
            <WheelGame
              key={g.id}
              compact
              title={g.name}
              subtitle={groupSpinTeams(g).join(" · ")}
              teams={groupSpinTeams(g)}
              preassigned={fav ? {
                team: fav,
                note: favOwner ? `${favOwner.name}'s favourite — sits this group out` : "via the favourites wheel",
              } : undefined}
              assigned={slot.assigned}
              order={slot.order}
              locked={state.locked}
              roster={roster}
              gate={gate}
              onAssign={assignGroup(g.id)}
              onReset={() => persist(resetWheel(g.id))}
            />
          )
        })}
      </div>

      <div className="wheelspin-submit">
        {state.locked ? (
          <>
            <div className="submit-locked">🔒 Teams submitted and locked</div>
            <button className="btn export-btn" onClick={exportResults}>
              ⬇ Export results
            </button>
            <p className="export-hint">Send the exported file to Jake to publish these teams for everyone.</p>
          </>
        ) : (
          <button className="btn submit-btn" onClick={submit}>
            Submit & Lock Teams
          </button>
        )}
      </div>
    </div>
  )
}
