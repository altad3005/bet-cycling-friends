import { api } from './client'
import type { BetStatus } from '@bcf/shared'

export interface RiderRef {
  id: string
  name: string
  pcsUrl: string
}

export interface BetUser {
  id: string
  pseudo: string
  icon: string
}

export interface BetClassicResponse {
  id: string
  userId: string
  raceId: string
  status: BetStatus
  placedAt: string
  user?: BetUser | null
  favoriteRider?: RiderRef | null
  bonusRider?: RiderRef | null
}

export interface BetGrandTourResponse {
  id: string
  userId: string
  raceId: string
  status: BetStatus
  placedAt: string
  user?: BetUser | null
  riders?: RiderRef[] | null
}

export type BetResponse = BetClassicResponse | BetGrandTourResponse

export const betsApi = {
  myBet: (raceId: string) =>
    api.get<{ data: { bet: BetResponse | null } }>(`/races/${raceId}/bet`),

  leagueBets: (leagueId: string, raceId: string) =>
    api.get<{ data: { bets: BetResponse[]; raceStarted: boolean } }>(`/leagues/${leagueId}/races/${raceId}/bets`),

  placeClassic: (raceId: string, favoriteRiderId: string, bonusRiderId: string) =>
    api.post<{ data: { bet: BetClassicResponse } }>(`/races/${raceId}/bet`, {
      favoriteRiderId,
      bonusRiderId,
    }),

  placeGrandTour: (raceId: string, riderIds: string[]) =>
    api.post<{ data: { bet: BetGrandTourResponse } }>(`/races/${raceId}/bet/grandtour`, {
      riderIds,
    }),
}
