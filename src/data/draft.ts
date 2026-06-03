// Sweepstake draft: each participant owns a set of national teams.
// Source: shared spreadsheet. Edit here to change ownership.

export interface Participant {
  id: string
  name: string
  teams: string[]
}

export const TOURNAMENT = {
  title: "World Cup 2026 Sweepstake",
  fromDate: "2026-06-11",
  toDate: "2026-07-19",
}

export const PARTICIPANTS: Participant[] = [
  { id: "will-d", name: "Will D", teams: ["Portugal", "Senegal", "Sweden", "Tunisia"] },
  { id: "will-g", name: "Will G", teams: ["Germany", "South Korea", "Austria", "Congo"] },
  { id: "brandwood", name: "Brandwood", teams: ["France", "Croatia", "Scotland", "Iraq"] },
  { id: "broadwith", name: "Broadwith", teams: ["Spain", "Mexico", "Algeria", "Cape Verde"] },
  { id: "musker", name: "Musker", teams: ["Brazil", "Ecuador", "Norway", "Jordan", "New Zealand"] },
  { id: "hine", name: "Hine", teams: ["Uruguay", "Switzerland", "Saudi Arabia", "Qatar", "Haiti", "South Africa"] },
  { id: "jake", name: "Jake", teams: ["England", "Paraguay", "Australia", "Ghana"] },
  { id: "ashish", name: "Ashish", teams: ["Morocco", "Japan", "Egypt", "Uzbekistan", "Curaçao"] },
  { id: "daniel", name: "Daniel", teams: ["Belgium", "USA", "Ivory Coast", "Czech Republic"] },
  { id: "aonghus", name: "Aonghus", teams: ["Netherlands", "Canada", "Turkey", "Bosnia"] },
  { id: "oli-harris", name: "Oli Harris", teams: ["Argentina", "Colombia", "Iran", "Panama"] },
]

// Map team name -> owning participant id (built once).
export const TEAM_OWNER: Record<string, string> = Object.fromEntries(
  PARTICIPANTS.flatMap((p) => p.teams.map((t) => [t, p.id]))
)
