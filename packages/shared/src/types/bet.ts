import { BetStatus } from '../enums'

export interface BetClassicResponse {
  id: string
  raceId: string
  favoriteRider: { id: string; name: string }
  bonusRider: { id: string; name: string }
  status: BetStatus
  placedAt: string
}

export interface BetGrandTourResponse {
  id: string
  raceId: string
  riders: { id: string; name: string }[]
  status: BetStatus
  placedAt: string
}

export interface CreateBetClassicPayload {
  favoriteRiderId: string
  bonusRiderId: string
}

export interface CreateBetGrandTourPayload {
  riderIds: string[]
}