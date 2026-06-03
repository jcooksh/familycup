"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface LeaderboardRankingItem {
  userId: string
  rank: number
  userName: string
  byline?: string
  value: number
  displayed?: boolean
  delta?: number // goal difference (or any signed secondary stat)
  live?: boolean
}

interface LeaderboardRankingsProps extends React.HTMLAttributes<HTMLDivElement> {
  rankings: LeaderboardRankingItem[]
  currentUserId?: string
  showPagination?: boolean
  defaultPageSize?: number
  valueFormatter?: (value: number) => string
}

function rankBadge(rank: number) {
  if (rank === 1) return "bg-amber-400 text-amber-950"
  if (rank === 2) return "bg-slate-300 text-slate-800"
  if (rank === 3) return "bg-orange-400 text-orange-950"
  return "bg-muted text-muted-foreground"
}

const LeaderboardRankings = React.forwardRef<HTMLDivElement, LeaderboardRankingsProps>(
  (
    {
      className,
      rankings,
      currentUserId,
      showPagination = false,
      defaultPageSize = 10,
      valueFormatter = (v) => v.toLocaleString(),
      ...props
    },
    ref
  ) => {
    const visible = rankings.filter((r) => r.displayed !== false)
    const [page, setPage] = React.useState(0)
    const pageSize = showPagination ? defaultPageSize : visible.length
    const pageCount = Math.max(1, Math.ceil(visible.length / pageSize))
    const safePage = Math.min(page, pageCount - 1)
    const start = safePage * pageSize
    const rows = visible.slice(start, start + pageSize)

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {rows.map((r) => {
          const isCurrent = r.userId === currentUserId
          return (
            <div
              key={r.userId}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                isCurrent
                  ? "border-primary bg-primary/5"
                  : "bg-card hover:bg-accent/40"
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  rankBadge(r.rank)
                )}
              >
                {r.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {r.userName}
                    {isCurrent && (
                      <span className="text-primary ml-1 text-xs font-normal">(you)</span>
                    )}
                  </p>
                  {r.live && (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                      <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                      LIVE
                    </span>
                  )}
                </div>
                {r.byline && (
                  <p className="text-muted-foreground truncate text-xs">{r.byline}</p>
                )}
              </div>
              {typeof r.delta === "number" && (
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium tabular-nums",
                    r.delta > 0
                      ? "text-emerald-600"
                      : r.delta < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                  )}
                >
                  {r.delta > 0 ? "+" : ""}
                  {r.delta} GD
                </span>
              )}
              <span className="shrink-0 text-right text-sm font-bold tabular-nums">
                {valueFormatter(r.value)}
                <span className="text-muted-foreground ml-1 text-[10px] font-normal">
                  pts
                </span>
              </span>
            </div>
          )
        })}

        {showPagination && pageCount > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> Prev
            </button>
            <span className="text-muted-foreground text-xs">
              Page {safePage + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm disabled:opacity-40"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    )
  }
)

LeaderboardRankings.displayName = "LeaderboardRankings"

export { LeaderboardRankings }
export type { LeaderboardRankingItem, LeaderboardRankingsProps }
