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

export const standingsApi = {
  league: (leagueId: string) =>
    api.get<{ data: { standings: LeagueStanding[] } }>(`/leagues/${leagueId}/standings`),

  global: () => api.get<{ data: { standings: GlobalStanding[] } }>('/standings/global'),
}
