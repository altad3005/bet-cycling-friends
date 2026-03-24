import { api } from './client'

export interface MemberProfileRace {
  raceId: string
  raceName: string
  startAt: string | null
  points: number | null
  leagueRank: number | null
  participated: boolean
}

export interface MemberProfileData {
  user: {
    id: string
    pseudo: string
    icon: string
    joinedAt: string
    isAdmin: boolean
  }
  standing: {
    rank: number | null
    totalPoints: number
    racesPlayed: number
    avgPoints: number
    participationRate: number
    bestRace: { raceName: string; points: number } | null
  }
  races: MemberProfileRace[]
}

export const memberProfileApi = {
  get: (leagueId: string, userId: string) =>
    api.get<{ data: MemberProfileData }>(`/leagues/${leagueId}/members/${userId}/profile`),
}
