// Wheelspin draft: the family spins wheels to decide who owns which teams.
// Results are persisted to localStorage and become the source of truth for
// team ownership (see refreshOwnership in draft.ts). No server involved.

export interface Family {
  id: string
  name: string
}

// The four players. Turn order = this order (Maat → Steph → Darcey → Jake).
export const FAMILY: Family[] = [
  { id: "maat", name: "Maat" },
  { id: "steph", name: "Steph" },
  { id: "darcey", name: "Darcey" },
  { id: "jake", name: "Jake" },
]

// Wheel 1 — the four favourites. One handed to each player.
export const FAVOURITES = ["Spain", "England", "France", "Brazil"]

// Wheel 2 — the big draw. 42 teams, spun round-robin so the split is as even
// as possible (Maat/Steph get 11, Darcey/Jake get 10).
export const DRAW_TEAMS = [
  // UEFA (Europe)
  "Belgium", "Croatia", "Czech Republic", "Denmark", "Germany", "Italy",
  "Netherlands", "Poland", "Portugal", "Romania", "Sweden", "Ukraine",
  // CONMEBOL (South America)
  "Argentina", "Colombia", "Ecuador", "Paraguay", "Uruguay",
  // CONCACAF (North/Central America & Caribbean)
  "Canada", "Costa Rica", "Honduras", "Jamaica", "Mexico", "Panama", "United States",
  // CAF (Africa)
  "Algeria", "Cameroon", "Egypt", "Ivory Coast", "Morocco", "Nigeria",
  "Senegal", "South Africa", "Tunisia",
  // AFC (Asia)
  "Australia", "Iran", "Iraq", "Japan", "Saudi Arabia", "South Korea",
  "United Arab Emirates", "Uzbekistan",
  // OFC (Oceania)
  "New Zealand",
]

// Every team in play (favourites + draw). Static — used to filter match data
// in CI, where there is no localStorage and no ownership yet.
export const ALL_TEAMS = [...FAVOURITES, ...DRAW_TEAMS]

export type WheelKind = "fav" | "draw"

export interface WheelState {
  fav: Record<string, string> // team -> family id
  draw: Record<string, string> // team -> family id
  favOrder: string[] // teams in the order they were drawn
  drawOrder: string[]
}

const KEY = "familycup.wheelspin.v1"
export const WHEELSPIN_EVENT = "familycup:wheelspin"

const empty = (): WheelState => ({ fav: {}, draw: {}, favOrder: [], drawOrder: [] })

export function loadWheel(): WheelState {
  if (typeof localStorage === "undefined") return empty()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    return { ...empty(), ...JSON.parse(raw) }
  } catch {
    return empty()
  }
}

export function saveWheel(s: WheelState): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(s))
  // Tell the app ownership changed so standings/players refresh.
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WHEELSPIN_EVENT))
}

export function resetWheel(kind: WheelKind): WheelState {
  const s = loadWheel()
  if (kind === "fav") {
    s.fav = {}
    s.favOrder = []
  } else {
    s.draw = {}
    s.drawOrder = []
  }
  saveWheel(s)
  return s
}

// Combined team -> family id across both wheels.
export function ownershipMap(): Record<string, string> {
  const s = loadWheel()
  return { ...s.fav, ...s.draw }
}
