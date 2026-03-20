import { api } from './client'

export interface League {
  id: string
  name: string
  code: string
  season: number
  memberCount: number
  isAdmin: boolean
}

export interface LeagueMember {
  id: string
  userId: string
  pseudo: string
  icon: string
  isAdmin: boolean
  joinedAt: string
}

export interface LeaguePreview {
  id: string
  name: string
  season: number
  memberCount: number
}

export const leaguesApi = {
  myLeagues: () => api.get<{ data: { leagues: League[] } }>('/account/leagues'),

  create: (name: string) => api.post<{ data: { league: League } }>('/leagues', { name }),

  get: (id: string) => api.get<{ data: { league: League } }>(`/leagues/${id}`),

  previewJoin: (code: string) => api.get<{ data: { league: LeaguePreview } }>(`/leagues/join/${code}`),

  join: (code: string) => api.post<{ data: { league: League } }>(`/leagues/join/${code}`),

  leave: (id: string) => api.delete(`/leagues/${id}/leave`),

  members: (id: string) =>
    api.get<{ data: { members: LeagueMember[] } }>(`/leagues/${id}/members`),
}
