import {
  SCORING_TABLE,
  MULTIPLIERS,
  MultiplierType,
  FAVORITE_COEFFICIENT,
  BONUS_COEFFICIENT,
} from '@bcf/shared'
import { randomUUID } from 'node:crypto'
import Race from '#models/race'
import Score from '#models/score'
import BetClassic from '#models/bet_classic'
import BetGrandTour from '#models/bet_grand_tour'
import StageResult from '#models/stage_result'
import LeagueMember from '#models/league_member'
import LeagueRace from '#models/league_race'

export default class ScoringService {
  async scoreRace(raceId: string): Promise<void> {
    const race = await Race.findOrFail(raceId)
    const leagueRaces = await LeagueRace.query().where('race_id', raceId)
    for (const leagueRace of leagueRaces) {
      await this.scoreLeagueRace(race, leagueRace.leagueId)
    }
  }

  private async scoreLeagueRace(race: Race, leagueId: string): Promise<void> {
    const memberIds = (await LeagueMember.query().where('league_id', leagueId).select('user_id')).map(
      (m) => m.userId
    )
    if (race.isGrandTour) {
      await this.scoreGrandTour(race, leagueId, memberIds)
    } else {
      await this.scoreClassic(race, leagueId, memberIds)
    }
  }

  private async scoreClassic(race: Race, leagueId: string, memberIds: string[]): Promise<void> {
    const results = await StageResult.query()
      .where('race_id', race.id)
      .where('stage_number', 0)
      .whereIn('result_type', ['result', 'gc'])
      .where('rank', '<=', 10)

    if (results.length === 0) return

    const rankMap = new Map(results.map((r) => [r.riderId, r.rank]))
    const multiplier = MULTIPLIERS[race.multiplierType as MultiplierType]
    const maxPossible = SCORING_TABLE[1] * multiplier * (FAVORITE_COEFFICIENT + BONUS_COEFFICIENT)

    const bets = await BetClassic.query().whereIn('user_id', memberIds).where('race_id', race.id)

    for (const bet of bets) {
      let points = 0
      const favoriteRank = rankMap.get(bet.favoriteRiderId)
      if (favoriteRank && SCORING_TABLE[favoriteRank]) {
        points += SCORING_TABLE[favoriteRank] * multiplier * FAVORITE_COEFFICIENT
      }
      const bonusRank = rankMap.get(bet.bonusRiderId)
      if (bonusRank && SCORING_TABLE[bonusRank]) {
        points += SCORING_TABLE[bonusRank] * multiplier * BONUS_COEFFICIENT
      }
      await this.upsertScore(bet.userId, race.id, leagueId, points, maxPossible)
    }
  }

  private async scoreGrandTour(race: Race, leagueId: string, memberIds: string[]): Promise<void> {
    const stageResults = await StageResult.query()
      .where('race_id', race.id)
      .where('result_type', 'stage')
      .where('rank', '<=', 10)

    const gcResults = await StageResult.query()
      .where('race_id', race.id)
      .where('result_type', 'gc')
      .where('rank', '<=', 10)

    if (stageResults.length === 0 && gcResults.length === 0) return

    const stageRankMap = new Map<string, Map<number, number>>()
    for (const r of stageResults) {
      if (!stageRankMap.has(r.riderId)) stageRankMap.set(r.riderId, new Map())
      stageRankMap.get(r.riderId)!.set(r.stageNumber, r.rank)
    }

    const gcRankMap = new Map(gcResults.map((r) => [r.riderId, r.rank]))
    const numStages = new Set(stageResults.map((r) => r.stageNumber)).size
    const maxPossible =
      SCORING_TABLE[1] *
      (numStages * MULTIPLIERS[MultiplierType.GT_STAGE] + MULTIPLIERS[MultiplierType.GT_GC]) *
      8

    const bets = await BetGrandTour.query()
      .whereIn('user_id', memberIds)
      .where('race_id', race.id)
      .preload('betRiders')

    for (const bet of bets) {
      let points = 0
      for (const betRider of bet.betRiders) {
        const stages = stageRankMap.get(betRider.riderId)
        if (stages) {
          for (const [, rank] of stages) {
            if (SCORING_TABLE[rank]) {
              points += SCORING_TABLE[rank] * MULTIPLIERS[MultiplierType.GT_STAGE]
            }
          }
        }
        const gcRank = gcRankMap.get(betRider.riderId)
        if (gcRank && SCORING_TABLE[gcRank]) {
          points += SCORING_TABLE[gcRank] * MULTIPLIERS[MultiplierType.GT_GC]
        }
      }
      await this.upsertScore(bet.userId, race.id, leagueId, points, maxPossible)
    }
  }

  private async upsertScore(
    userId: string,
    raceId: string,
    leagueId: string,
    points: number,
    maxPossible: number
  ): Promise<void> {
    const score = await Score.query()
      .where('user_id', userId)
      .where('race_id', raceId)
      .where('league_id', leagueId)
      .first()

    if (score) {
      score.merge({ points, maxPossible })
      await score.save()
    } else {
      await Score.create({ id: randomUUID(), userId, raceId, leagueId, points, maxPossible })
    }
  }
}
