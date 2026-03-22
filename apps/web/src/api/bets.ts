import { api } from './client'
import type { BetStatus } from '@bcf/shared'

export interface RiderRef {
  id: string
  name: string
  pcsUrl: string
}

export interface BetClassicResponse {
  id: string
  userId: string
  raceId: string
  status: BetStatus
  placedAt: string
  favoriteRider?: RiderRef | null
  bonusRider?: RiderRef | null
}

export interface BetGrandTourResponse {
  id: string
  userId: string
  raceId: string
  status: BetStatus
  placedAt: string
  riders?: RiderRef[] | null
}

export type BetResponse = BetClassicResponse | BetGrandTourResponse

export const betsApi = {
  myBet: (raceId: string) =>
    api.get<{ data: { bet: BetResponse | null } }>(`/races/${raceId}/bet`),
}
