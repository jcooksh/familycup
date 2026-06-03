// football-data.org returns some country names differently than our draft sheet.
// Normalise API names -> our canonical draft names. Used by the fetch script
// (and re-exported for the browser in case raw match data needs reconciling).

export const TEAM_ALIASES: Record<string, string> = {
  "Korea Republic": "South Korea",
  "Republic of Korea": "South Korea",
  "South Korea": "South Korea",
  "IR Iran": "Iran",
  "Iran (Islamic Republic of)": "Iran",
  "United States": "USA",
  "United States of America": "USA",
  "USA": "USA",
  "Türkiye": "Turkey",
  "Turkiye": "Turkey",
  "Turkey": "Turkey",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "Czechia": "Czech Republic",
  "Bosnia and Herzegovina": "Bosnia",
  "Bosnia-Herzegovina": "Bosnia",
  "Cabo Verde": "Cape Verde",
  "DR Congo": "Congo",
  "Congo DR": "Congo",
  "Saudi Arabia": "Saudi Arabia",
  "Curacao": "Curaçao",
  "Curaçao": "Curaçao",
}

export function canonicalTeam(apiName: string): string {
  return TEAM_ALIASES[apiName] ?? apiName
}
