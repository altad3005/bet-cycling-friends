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

export interface FeedPage {
  events: FeedEvent[]
  hasMore: boolean
}

export const feedApi = {
  league: (leagueId: string, params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.limit != null) qs.set('limit', String(params.limit))
    if (params?.offset != null) qs.set('offset', String(params.offset))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return api.get<{ data: FeedPage }>(`/leagues/${leagueId}/feed${suffix}`)
  },
}
