import { api } from './client'

export interface FormEntry {
  raceId: string
  raceName: string
  points: number
  rank: number
}

export const formApi = {
  league: (leagueId: string) =>
    api.get<{ data: { races: FormEntry[] } }>(`/leagues/${leagueId}/form`),
}
