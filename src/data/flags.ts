// Flag emoji per drafted nation. Falls back to a white flag.
export const FLAGS: Record<string, string> = {
  Portugal: "🇵🇹", Senegal: "🇸🇳", Sweden: "🇸🇪", Tunisia: "🇹🇳",
  Germany: "🇩🇪", "South Korea": "🇰🇷", Austria: "🇦🇹", Congo: "🇨🇩",
  France: "🇫🇷", Croatia: "🇭🇷", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Iraq: "🇮🇶",
  Spain: "🇪🇸", Mexico: "🇲🇽", Algeria: "🇩🇿", "Cape Verde": "🇨🇻",
  Brazil: "🇧🇷", Ecuador: "🇪🇨", Norway: "🇳🇴", Jordan: "🇯🇴", "New Zealand": "🇳🇿",
  Uruguay: "🇺🇾", Switzerland: "🇨🇭", "Saudi Arabia": "🇸🇦", Qatar: "🇶🇦", Haiti: "🇭🇹", "South Africa": "🇿🇦",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Paraguay: "🇵🇾", Australia: "🇦🇺", Ghana: "🇬🇭",
  Morocco: "🇲🇦", Japan: "🇯🇵", Egypt: "🇪🇬", Uzbekistan: "🇺🇿", "Curaçao": "🇨🇼",
  Belgium: "🇧🇪", USA: "🇺🇸", "Ivory Coast": "🇨🇮", "Czech Republic": "🇨🇿",
  Netherlands: "🇳🇱", Canada: "🇨🇦", Turkey: "🇹🇷", Bosnia: "🇧🇦",
  Argentina: "🇦🇷", Colombia: "🇨🇴", Iran: "🇮🇷", Panama: "🇵🇦",
}

export const flagOf = (team: string) => FLAGS[team] || "🏳️"

export const initialsOf = (name: string) =>
  name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase()
