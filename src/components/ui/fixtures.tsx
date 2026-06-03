"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"
import { ownerName } from "@/data/draft"
import type { Match } from "@/lib/scoring"

interface FixturesProps extends React.HTMLAttributes<HTMLDivElement> {
  matches: Match[]
  // only show matches where at least one team is owned in the sweepstake
  ownedOnly?: boolean
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third place",
  FINAL: "Final",
}

const FINISHED = new Set(["FINISHED", "AWARDED"])
const LIVE = new Set(["IN_PLAY", "PAUSED"])

function statusBadge(m: Match) {
  if (LIVE.has(m.status))
    return (
      <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
        <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
        LIVE
      </span>
    )
  if (FINISHED.has(m.status))
    return (
      <span className="text-muted-foreground rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">
        FT
      </span>
    )
  return (
    <span className="text-muted-foreground text-[11px]">
      {m.utcDate
        ? new Date(m.utcDate).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "TBD"}
    </span>
  )
}

function TeamRow({
  team,
  score,
  win,
}: {
  team: string
  score: number | null
  win: boolean
}) {
  const owner = ownerName(team)
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className={cn("truncate text-sm", win ? "font-semibold" : "font-medium")}>
          {team}
        </p>
        <p className="text-muted-foreground truncate text-[11px]">
          {owner ? owner : <span className="opacity-50">unowned</span>}
        </p>
      </div>
      {score != null && (
        <span className={cn("text-sm tabular-nums", win ? "font-bold" : "font-medium")}>
          {score}
        </span>
      )}
    </div>
  )
}

const Fixtures = React.forwardRef<HTMLDivElement, FixturesProps>(
  ({ className, matches, ownedOnly = true, ...props }, ref) => {
    const list = ownedOnly
      ? matches.filter((m) => ownerName(m.homeTeam) || ownerName(m.awayTeam))
      : matches

    // group by stage, preserve a sensible stage order
    const order = Object.keys(STAGE_LABELS)
    const byStage = new Map<string, Match[]>()
    for (const m of list) {
      const arr = byStage.get(m.stage) ?? []
      arr.push(m)
      byStage.set(m.stage, arr)
    }
    const stages = [...byStage.keys()].sort(
      (a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99)
    )
    for (const s of stages) {
      byStage.get(s)!.sort((a, b) => (a.utcDate ?? "").localeCompare(b.utcDate ?? ""))
    }

    return (
      <div
        ref={ref}
        className={cn("bg-card rounded-2xl border p-6 shadow-sm", className)}
        {...props}
      >
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="size-5" /> Fixtures
        </h3>

        {list.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No fixtures yet — they'll appear here once the draw / schedule is published.
          </p>
        ) : (
          <div className="space-y-6">
            {stages.map((stage) => (
              <div key={stage}>
                <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                  {STAGE_LABELS[stage] ?? stage}
                </p>
                <div className="space-y-2">
                  {byStage.get(stage)!.map((m) => {
                    const homeWin =
                      m.homeScore != null &&
                      m.awayScore != null &&
                      m.homeScore > m.awayScore
                    const awayWin =
                      m.homeScore != null &&
                      m.awayScore != null &&
                      m.awayScore > m.homeScore
                    return (
                      <div key={m.id} className="rounded-xl border p-3">
                        <div className="mb-2 flex items-center justify-end">
                          {statusBadge(m)}
                        </div>
                        <div className="space-y-1.5">
                          <TeamRow team={m.homeTeam} score={m.homeScore} win={homeWin} />
                          <div className="border-t" />
                          <TeamRow team={m.awayTeam} score={m.awayScore} win={awayWin} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

Fixtures.displayName = "Fixtures"

export { Fixtures }
export type { FixturesProps }
