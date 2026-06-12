// Flag emoji per nation in play. Falls back to a white flag.
export const FLAGS: Record<string, string> = {
  // favourites
  Spain: "🇪🇸", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", France: "🇫🇷", Brazil: "🇧🇷",
  // UEFA
  Belgium: "🇧🇪", Croatia: "🇭🇷", "Czech Republic": "🇨🇿", Denmark: "🇩🇰",
  Germany: "🇩🇪", Italy: "🇮🇹", Netherlands: "🇳🇱", Poland: "🇵🇱",
  Portugal: "🇵🇹", Romania: "🇷🇴", Sweden: "🇸🇪", Ukraine: "🇺🇦",
  // CONMEBOL
  Argentina: "🇦🇷", Colombia: "🇨🇴", Ecuador: "🇪🇨", Paraguay: "🇵🇾", Uruguay: "🇺🇾",
  // CONCACAF
  Canada: "🇨🇦", "Costa Rica": "🇨🇷", Honduras: "🇭🇳", Jamaica: "🇯🇲",
  Mexico: "🇲🇽", Panama: "🇵🇦", "United States": "🇺🇸", USA: "🇺🇸",
  // CAF
  Algeria: "🇩🇿", Cameroon: "🇨🇲", Egypt: "🇪🇬", "Ivory Coast": "🇨🇮",
  Morocco: "🇲🇦", Nigeria: "🇳🇬", Senegal: "🇸🇳", "South Africa": "🇿🇦", Tunisia: "🇹🇳",
  // AFC
  Australia: "🇦🇺", Iran: "🇮🇷", Iraq: "🇮🇶", Japan: "🇯🇵",
  "Saudi Arabia": "🇸🇦", "South Korea": "🇰🇷", "United Arab Emirates": "🇦🇪", Uzbekistan: "🇺🇿",
  Qatar: "🇶🇦", Jordan: "🇯🇴",
  // OFC
  "New Zealand": "🇳🇿",
  // additional group-stage nations
  Bosnia: "🇧🇦", Switzerland: "🇨🇭", Haiti: "🇭🇹", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Turkey: "🇹🇷",
  "Curaçao": "🇨🇼", "Cape Verde": "🇨🇻", Norway: "🇳🇴", Austria: "🇦🇹",
  Congo: "🇨🇩", Ghana: "🇬🇭",
}

export const flagOf = (team: string) => FLAGS[team] || "🏳️"

export const initialsOf = (name: string) =>
  name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase()

// One vivid colour per player — used for avatars, owner dots and card tops.
export const PLAYER_COLORS: Record<string, string> = {
  mat: "#2E5BFF",
  steph: "#FF4E36",
  darcey: "#F25C8E",
  jake: "#07A085",
}

export const colorOf = (playerId?: string) =>
  (playerId && PLAYER_COLORS[playerId]) || "#928876"

// 3-letter codes for the ticker.
const ABBR: Record<string, string> = {
  "South Korea": "KOR", "Saudi Arabia": "KSA", "South Africa": "RSA",
  "New Zealand": "NZL", "Czech Republic": "CZE", "Ivory Coast": "CIV",
  "Cape Verde": "CPV", "United States": "USA", USA: "USA", "Curaçao": "CUW",
}
export const abbrOf = (team: string) =>
  ABBR[team] ?? team.slice(0, 3).toUpperCase()
