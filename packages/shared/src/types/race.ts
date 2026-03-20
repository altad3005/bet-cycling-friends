import { RaceType, MultiplierType, RaceStatus } from '../enums.js'

export interface RaceResponse {
  id: string
  slug: string
  name: string
  season: number
  raceType: RaceType
  multiplierType: MultiplierType
  status: RaceStatus
  startAt: string
  endAt: string
  isGrandTour: boolean
}

export interface RiderResponse {
  id: string
  pcsUrl: string
  name: string
  nationality: string
}

export interface StageResultResponse {
  riderId: string
  riderName: string
  stageNumber: number
  rank: number
  resultType: 'stage' | 'gc'
  points: number
}