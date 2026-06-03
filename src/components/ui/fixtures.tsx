"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"
import { ownerName } from "@/data/draft"
import type { Match } from "@/lib/scoring"

interface FixturesProps extends React.HTMLAttributes<HTMLDivElement> {
  matches: Match[]
  // how many upcoming fixtures to show (live ones are always shown on top)
  limit?: number
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
  return (
    <span className="text-muted-foreground text-[11px]">
      {m.utcDate
        ? new Date(m.utcDate).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "TBD"}
    </span>
  )
}

function TeamRow({ team, score }: { team: string; score: number | null }) {
  const owner = ownerName(team)
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{team}</p>
        <p className="text-muted-foreground truncate text-[11px]">
          {owner ? owner : <span className="opacity-50">unowned</span>}
        </p>
      </div>
      {score != null && (
        <span className="text-sm font-medium tabular-nums">{score}</span>
      )}
    </div>
  )
}

const Fixtures = React.forwardRef<HTMLDivElement, FixturesProps>(
  ({ className, matches, limit = 4, ownedOnly = true, ...props }, ref) => {
    const list = ownedOnly
      ? matches.filter((m) => ownerName(m.homeTeam) || ownerName(m.awayTeam))
      : matches

    const byDate = (a: Match, b: Match) =>
      (a.utcDate ?? "").localeCompare(b.utcDate ?? "")

    const live = list.filter((m) => LIVE.has(m.status)).sort(byDate)
    const upcoming = list
      .filter((m) => !LIVE.has(m.status) && !FINISHED.has(m.status))
      .sort(byDate)
      .slice(0, limit)

    const shown = [...live, ...upcoming]

    return (
      <div
        ref={ref}
        className={cn("bg-card rounded-2xl border p-6 shadow-sm", className)}
        {...props}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-5" /> Upcoming
          </h3>
          {upcoming.length > 0 && (
            <span className="text-muted-foreground text-xs">
              next {upcoming.length}
            </span>
          )}
        </div>

        {shown.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No upcoming fixtures — schedule not published yet.
          </p>
        ) : (
          <div className="space-y-2">
            {shown.map((m) => (
              <div key={m.id} className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                    {STAGE_LABELS[m.stage] ?? m.stage}
                  </span>
                  {statusBadge(m)}
                </div>
                <div className="space-y-1.5">
                  <TeamRow team={m.homeTeam} score={m.homeScore} />
                  <div className="border-t" />
                  <TeamRow team={m.awayTeam} score={m.awayScore} />
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
