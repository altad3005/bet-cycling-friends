import { api } from './client'

export interface LeagueStanding {
  rank: number
  userId: string
  pseudo: string
  icon: string
  totalPoints: number
  racesPlayed: number
}

export interface GlobalStanding {
  rank: number
  userId: string
  pseudo: string
  icon: string
  percentage: number
  racesPlayed: number
}

export interface RaceStanding {
  rank: number
  userId: string
  pseudo: string
  icon: string
  points: number
  placedAt: string
}

export const standingsApi = {
  league: (leagueId: string) =>
    api.get<{ data: { standings: LeagueStanding[] } }>(`/leagues/${leagueId}/standings`),

  race: (leagueId: string, raceId: string) =>
    api.get<{ data: { standings: RaceStanding[] } }>(`/leagues/${leagueId}/races/${raceId}/standings`),

  global: () => api.get<{ data: { standings: GlobalStanding[] } }>('/standings/global'),
}
