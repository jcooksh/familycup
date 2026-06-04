// Team ownership for the Family Cup. Unlike a fixed draft sheet, ownership here
// is decided by the Wheelspin tab and stored in the browser. These structures
// are rebuilt from that store via refreshOwnership(); the rest of the app reads
// them as live ES-module bindings, so a spin instantly updates every page.

import { FAMILY, ownershipMap } from "@/data/wheelspin"

export interface Participant {
  id: string
  name: string
  teams: string[]
}

export const TOURNAMENT = {
  title: "Family Cup 2026",
  fromDate: "2026-06-11",
  toDate: "2026-07-19",
  host: "USA / CAN / MEX",
}

// The players. Teams start empty and are filled in by the wheelspin results.
export const PARTICIPANTS: Participant[] = FAMILY.map((f) => ({
  id: f.id,
  name: f.name,
  teams: [],
}))

// Rebuilt by refreshOwnership(). Reassigned (not mutated) so importers that read
// these as live bindings always see the current ownership.
export let TEAM_OWNER: Record<string, string> = {}
export let TEAM_OWNER_NAME: Record<string, string> = {}

// Pull the latest wheelspin results from storage and rebuild ownership.
export function refreshOwnership(): void {
  const map = ownershipMap()
  const byId = Object.fromEntries(PARTICIPANTS.map((p) => [p.id, p]))
  for (const p of PARTICIPANTS) p.teams = []

  const owner: Record<string, string> = {}
  const ownerNameMap: Record<string, string> = {}
  for (const [team, pid] of Object.entries(map)) {
    const p = byId[pid]
    if (!p) continue
    p.teams.push(team)
    owner[team] = pid
    ownerNameMap[team] = p.name
  }
  TEAM_OWNER = owner
  TEAM_OWNER_NAME = ownerNameMap
}

export function ownerName(team: string): string | undefined {
  return TEAM_OWNER_NAME[team]
}

// Build initial ownership from whatever is already stored.
refreshOwnership()
