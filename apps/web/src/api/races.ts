import { api } from './client'
import type { RaceType, MultiplierType, RaceStatus } from '@bcf/shared'

export interface RaceResponse {
  id: string
  slug: string
  name: string
  raceType: RaceType
  multiplierType: MultiplierType
  isGrandTour: boolean
  status: RaceStatus
  resultsFinal: boolean
  startAt: string | null
  endAt: string | null
  seasonYear: number
}

export interface RacePreview {
  slug: string
  name: string
  year: number
  start_date: string | null
  end_date: string | null
  raceType: RaceType
  multiplierType: MultiplierType
  isGrandTour: boolean
}

export interface StartlistRider {
  id: string
  name: string
}

export const racesApi = {
  leagueRaces: (leagueId: string) =>
    api.get<{ data: { races: RaceResponse[] } }>(`/leagues/${leagueId}/races`),

  startlist: (raceId: string) =>
    api.get<{ data: { riders: StartlistRider[] } }>(`/races/${raceId}/startlist`),

  preview: (slug: string) =>
    api.get<{ race: RacePreview }>(`/races/preview?slug=${encodeURIComponent(slug)}`),

  addToLeague: (leagueId: string, slug: string) =>
    api.post<{ data: { race: RaceResponse } }>(`/leagues/${leagueId}/races`, { slug }),

  removeFromLeague: (leagueId: string, raceId: string) =>
    api.delete(`/leagues/${leagueId}/races/${raceId}`),
}
