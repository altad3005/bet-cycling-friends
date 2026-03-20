import { UserResponse } from './user.js'

export interface LeagueResponse {
  id: string
  name: string
  code: string
  season: number
  membersCount: number
  createdBy: string
  createdAt: string
}

export interface LeagueMemberResponse {
  user: UserResponse
  isAdmin: boolean
  joinedAt: string
}

export interface CreateLeaguePayload {
  name: string
}

export interface JoinLeaguePayload {
  code: string
}