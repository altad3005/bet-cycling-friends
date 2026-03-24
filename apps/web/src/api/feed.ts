import { api } from './client'

export type FeedEventType = 'bet_placed' | 'results_published' | 'member_joined'

export interface FeedEvent {
  type: FeedEventType
  at: string
  userId?: string
  pseudo?: string
  icon?: string
  raceId?: string
  raceName?: string
  winnerPseudo?: string
  winnerIcon?: string
  winnerPoints?: number
}

export const feedApi = {
  league: (leagueId: string, limit?: number) =>
    api.get<{ data: { events: FeedEvent[] } }>(
      `/leagues/${leagueId}/feed${limit ? `?limit=${limit}` : ''}`
    ),
}
