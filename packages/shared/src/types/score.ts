export interface ScoreResponse {
  userId: string
  pseudo: string
  icon: string
  points: number
  maxPossible: number
  percentage: number
  racesPlayed: number
}

export interface LeagueStandingsResponse {
  leagueId: string
  season: number
  standings: (ScoreResponse & { rank: number })[]
}

export interface GlobalStandingsResponse {
  season: number
  standings: (ScoreResponse & { rank: number })[]
}