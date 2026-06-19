import { api } from './client'

export interface RaceScore {
  userId: string
  pseudo: string
  icon: string
  points: number
}

export interface RaceStat {
  id: string
  name: string
  startAt: string | null
  status: string
  scores: RaceScore[]
  bettorCount: number
  participation: number
}

export interface PlayerStat {
  userId: string
  pseudo: string
  icon: string
  totalPoints: number
  racesPlayed: number
  avgPoints: number
  bestRace: { name: string; points: number } | null
  participationRate: number
}

export interface LeagueStats {
  overview: {
    totalRaces: number
    activePlayers: number
    totalPoints: number
    avgParticipation: number
    totalMembers: number
  }
  races: RaceStat[]
  players: PlayerStat[]
}

export const statsApi = {
  league: (leagueId: string) =>
    api.get<{ data: LeagueStats }>(`/leagues/${leagueId}/stats`),
}
