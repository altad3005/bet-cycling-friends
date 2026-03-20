import { MultiplierType } from './enums'

export const SCORING_TABLE: Record<number, number> = {
  1: 100,
  2: 70,
  3: 50,
  4: 40,
  5: 30,
  6: 25,
  7: 20,
  8: 15,
  9: 10,
  10: 5,
}

export const MULTIPLIERS: Record<MultiplierType, number> = {
  [MultiplierType.MONUMENT]:   2.0,
  [MultiplierType.WT_CLASSIC]: 1.5,
  [MultiplierType.STAGE_RACE]: 1.0,
  [MultiplierType.GT_STAGE]:   0.25,
  [MultiplierType.GT_GC]:      2.0,
}

export const BONUS_COEFFICIENT = 0.5
export const FAVORITE_COEFFICIENT = 1.0
export const MAX_LEAGUE_MEMBERS = 20
export const GRAND_TOUR_TEAM_SIZE = 8