// Wheelspin draft: the family spins wheels to decide who owns which teams.
// Results are persisted to localStorage and become the source of truth for
// team ownership (see refreshOwnership in draft.ts). No server involved.

export interface Family {
  id: string
  name: string
}

// The four players. Turn order = this order (Mat → Steph → Darcey → Jake).
export const FAMILY: Family[] = [
  { id: "mat", name: "Mat" },
  { id: "steph", name: "Steph" },
  { id: "darcey", name: "Darcey" },
  { id: "jake", name: "Jake" },
]

// Wheel 1 — the four favourites. One handed to each player. These are also the
// top seed of their group, so they're excluded from the group wheels below.
export const FAVOURITES = ["Spain", "England", "France", "Brazil"]
const FAV_SET = new Set(FAVOURITES)

// The twelve groups (A–L), four teams each. One wheel per group.
export interface Group {
  id: string
  name: string
  teams: string[]
}

export const GROUPS: Group[] = [
  { id: "A", name: "Group A", teams: ["Mexico", "South Africa", "South Korea", "Czech Republic"] },
  { id: "B", name: "Group B", teams: ["Canada", "Bosnia", "Qatar", "Switzerland"] },
  { id: "C", name: "Group C", teams: ["Brazil", "Morocco", "Haiti", "Scotland"] },
  { id: "D", name: "Group D", teams: ["United States", "Paraguay", "Australia", "Turkey"] },
  { id: "E", name: "Group E", teams: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"] },
  { id: "F", name: "Group F", teams: ["Netherlands", "Japan", "Sweden", "Tunisia"] },
  { id: "G", name: "Group G", teams: ["Belgium", "Egypt", "Iran", "New Zealand"] },
  { id: "H", name: "Group H", teams: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"] },
  { id: "I", name: "Group I", teams: ["France", "Senegal", "Iraq", "Norway"] },
  { id: "J", name: "Group J", teams: ["Argentina", "Algeria", "Austria", "Jordan"] },
  { id: "K", name: "Group K", teams: ["Portugal", "Congo", "Uzbekistan", "Colombia"] },
  { id: "L", name: "Group L", teams: ["England", "Croatia", "Ghana", "Panama"] },
]

// Teams that actually get spun in a group wheel (favourites are handed out by
// the favourites wheel, so they're dropped here).
export function groupSpinTeams(g: Group): string[] {
  return g.teams.filter((t) => !FAV_SET.has(t))
}

// The favourite seeded into a group, if any (shown as already assigned).
export function groupFavourite(g: Group): string | undefined {
  return g.teams.find((t) => FAV_SET.has(t))
}

// Every team in play. Static — used to filter match data in CI, where there is
// no localStorage and no ownership yet. Favourites already live inside groups.
export const ALL_TEAMS = GROUPS.flatMap((g) => g.teams)

// All orderings of the family. Used to give every wheel its own turn order.
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr]
  const out: T[][] = []
  arr.forEach((x, i) => {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const p of permutations(rest)) out.push([x, ...p])
  })
  return out
}
const FAMILY_PERMS = permutations(FAMILY)

// Every wheel gets a distinct permutation: favourites + 12 groups = 13 wheels,
// 4! = 24 orderings available, so no two wheels share the same order. A group
// whose favourite is already owned drops that owner from this order, keeping the
// rest in sequence (those rosters differ by member, so they stay distinct too).
const WHEEL_ORDER_KEYS = ["fav", ...GROUPS.map((g) => g.id)]
export function turnOrderFor(key: string): Family[] {
  const i = WHEEL_ORDER_KEYS.indexOf(key)
  return FAMILY_PERMS[(i < 0 ? 0 : i) % FAMILY_PERMS.length]
}

export interface WheelSlot {
  assigned: Record<string, string> // team -> family id
  order: string[] // teams in the order they were drawn
}

export interface WheelState {
  fav: Record<string, string> // team -> family id
  favOrder: string[]
  groups: Record<string, WheelSlot> // group id -> slot
  locked: boolean // once submitted, no further changes allowed
}

const KEY = "familycup.wheelspin.v3"
export const WHEELSPIN_EVENT = "familycup:wheelspin"

const emptySlot = (): WheelSlot => ({ assigned: {}, order: [] })
const empty = (): WheelState => ({ fav: {}, favOrder: [], groups: {}, locked: false })

// Published results. After the draft is run on one device, Submit & Lock, hit
// Export, and paste the exported JSON here. Once set, every visitor sees the
// same locked teams (no shared server needed). null = not published yet.
export const BAKED_RESULTS: WheelState | null = {
  fav: { France: "mat", Brazil: "steph", England: "darcey", Spain: "jake" },
  favOrder: ["France", "Brazil", "England", "Spain"],
  groups: {
    A: { assigned: { Mexico: "mat", "Czech Republic": "steph", "South Africa": "jake", "South Korea": "darcey" }, order: ["Mexico", "Czech Republic", "South Africa", "South Korea"] },
    B: { assigned: { Switzerland: "mat", Bosnia: "darcey", Canada: "steph", Qatar: "jake" }, order: ["Switzerland", "Bosnia", "Canada", "Qatar"] },
    C: { assigned: { Haiti: "mat", Morocco: "darcey", Scotland: "jake" }, order: ["Haiti", "Morocco", "Scotland"] },
    D: { assigned: { Australia: "mat", Paraguay: "jake", "United States": "steph", Turkey: "darcey" }, order: ["Australia", "Paraguay", "United States", "Turkey"] },
    E: { assigned: { "Curaçao": "mat", "Ivory Coast": "jake", Germany: "darcey", Ecuador: "steph" }, order: ["Curaçao", "Ivory Coast", "Germany", "Ecuador"] },
    F: { assigned: { Netherlands: "steph", Tunisia: "mat", Japan: "darcey", Sweden: "jake" }, order: ["Netherlands", "Tunisia", "Japan", "Sweden"] },
    G: { assigned: { Iran: "steph", "New Zealand": "mat", Egypt: "jake", Belgium: "darcey" }, order: ["Iran", "New Zealand", "Egypt", "Belgium"] },
    H: { assigned: { "Cape Verde": "steph", Uruguay: "darcey", "Saudi Arabia": "mat" }, order: ["Cape Verde", "Uruguay", "Saudi Arabia"] },
    I: { assigned: { Senegal: "steph", Norway: "darcey", Iraq: "jake" }, order: ["Senegal", "Norway", "Iraq"] },
    J: { assigned: { Argentina: "steph", Jordan: "jake", Algeria: "mat", Austria: "darcey" }, order: ["Argentina", "Jordan", "Algeria", "Austria"] },
    K: { assigned: { Colombia: "steph", Congo: "jake", Portugal: "darcey", Uzbekistan: "mat" }, order: ["Colombia", "Congo", "Portugal", "Uzbekistan"] },
    L: { assigned: { Croatia: "mat", Panama: "steph", Ghana: "jake" }, order: ["Croatia", "Panama", "Ghana"] },
  },
  locked: true,
}

// The default state before anyone has spun on this device: the published
// results if they exist, otherwise empty.
const baseline = (): WheelState =>
  BAKED_RESULTS ? structuredClone(BAKED_RESULTS) : empty()

export function loadWheel(): WheelState {
  if (typeof localStorage === "undefined") return baseline()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return baseline()
    const parsed = JSON.parse(raw)
    return { ...empty(), ...parsed, groups: { ...(parsed.groups ?? {}) } }
  } catch {
    return baseline()
  }
}

export function saveWheel(s: WheelState): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(s))
  // Tell the app ownership changed so standings/players refresh.
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WHEELSPIN_EVENT))
}

// Ensure a slot exists for a group id and return it (mutates s).
export function slotOf(s: WheelState, groupId: string): WheelSlot {
  if (!s.groups[groupId]) s.groups[groupId] = emptySlot()
  return s.groups[groupId]
}

// target = "fav" or a group id.
export function resetWheel(target: string): WheelState {
  const s = loadWheel()
  if (target === "fav") {
    s.fav = {}
    s.favOrder = []
  } else {
    s.groups[target] = emptySlot()
  }
  saveWheel(s)
  return s
}

export function lockWheel(): WheelState {
  const s = loadWheel()
  s.locked = true
  saveWheel(s)
  return s
}

// Combined team -> family id across the favourites wheel and every group.
export function ownershipMap(): Record<string, string> {
  const s = loadWheel()
  const out: Record<string, string> = { ...s.fav }
  for (const slot of Object.values(s.groups)) Object.assign(out, slot.assigned)
  return out
}
