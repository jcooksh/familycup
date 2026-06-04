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
  Mexico: "🇲🇽", Panama: "🇵🇦", "United States": "🇺🇸",
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
