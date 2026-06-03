"use client"

import * as React from "react"
import { Crown } from "lucide-react"

import { cn } from "@/lib/utils"

interface LeaderboardRanking {
  userId: string
  userName: string
  rank: number
  value: number
  byline?: string
}

interface LeaderboardPodiumProps extends React.HTMLAttributes<HTMLDivElement> {
  rankings: LeaderboardRanking[]
  valueFormatter?: (value: number) => string
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const PODIUM_STYLES: Record<
  number,
  { order: string; height: string; ring: string; badge: string; medal: string }
> = {
  1: {
    order: "order-2",
    height: "min-h-32",
    ring: "ring-amber-400",
    badge: "bg-amber-400 text-amber-950",
    medal: "🥇",
  },
  2: {
    order: "order-1",
    height: "min-h-28",
    ring: "ring-slate-300",
    badge: "bg-slate-300 text-slate-800",
    medal: "🥈",
  },
  3: {
    order: "order-3",
    height: "min-h-24",
    ring: "ring-orange-400",
    badge: "bg-orange-400 text-orange-950",
    medal: "🥉",
  },
}

const LeaderboardPodium = React.forwardRef<HTMLDivElement, LeaderboardPodiumProps>(
  ({ className, rankings, valueFormatter = (v) => v.toLocaleString(), ...props }, ref) => {
    const top3 = [...rankings].sort((a, b) => a.rank - b.rank).slice(0, 3)

    return (
      <div
        ref={ref}
        className={cn("grid grid-cols-3 items-end gap-3", className)}
        {...props}
      >
        {top3.map((r) => {
          const style = PODIUM_STYLES[r.rank] ?? PODIUM_STYLES[3]
          return (
            <div
              key={r.userId}
              className={cn("flex flex-col items-center", style.order)}
            >
              <div className="relative mb-2">
                {r.rank === 1 && (
                  <Crown className="absolute -top-5 left-1/2 size-5 -translate-x-1/2 text-amber-400" />
                )}
                <div
                  className={cn(
                    "bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-full text-base font-semibold ring-2",
                    style.ring
                  )}
                >
                  {initials(r.userName)}
                </div>
                <span
                  className={cn(
                    "absolute -bottom-1 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold",
                    style.badge
                  )}
                >
                  {r.rank}
                </span>
              </div>
              <p className="line-clamp-1 max-w-full text-center text-sm font-medium">
                {r.userName}
              </p>
              {r.byline && (
                <p className="text-muted-foreground line-clamp-1 text-center text-xs">
                  {r.byline}
                </p>
              )}
              <div
                className={cn(
                  "bg-muted mt-2 flex w-full flex-col items-center justify-start gap-0.5 rounded-t-lg px-1 py-2",
                  style.height
                )}
              >
                <span className="text-lg">{style.medal}</span>
                <span className="text-sm font-bold">{valueFormatter(r.value)}</span>
                <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  pts
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
)

LeaderboardPodium.displayName = "LeaderboardPodium"

export { LeaderboardPodium }
export type { LeaderboardRanking, LeaderboardPodiumProps }
