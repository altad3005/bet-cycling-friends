import { BetStatus, GT_RIDER_BUDGET } from '@bcf/shared'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import Race from '#models/race'
import Rider from '#models/rider'
import RaceRiderCost from '#models/race_rider_cost'
import BetClassic from '#models/bet_classic'
import BetGrandTour from '#models/bet_grand_tour'
import BetGrandTourRider from '#models/bet_grand_tour_rider'
import type User from '#models/user'

export default class BetService {
  async placeClassicBet(
    user: User,
    raceId: string,
    favoriteRiderId: string,
    bonusRiderId: string
  ): Promise<BetClassic> {
    const race = await Race.findOrFail(raceId)
    this.checkRaceNotStarted(race)

    await Rider.findOrFail(favoriteRiderId)
    await Rider.findOrFail(bonusRiderId)

    const existing = await BetClassic.query()
      .where('user_id', user.id)
      .where('race_id', raceId)
      .first()

    if (existing) {
      existing.favoriteRiderId = favoriteRiderId
      existing.bonusRiderId = bonusRiderId
      existing.placedAt = DateTime.now()
      await existing.save()
      return existing
    }

    return BetClassic.create({
      userId: user.id,
      raceId,
      favoriteRiderId,
      bonusRiderId,
      status: BetStatus.OPEN,
      placedAt: DateTime.now(),
    })
  }

  async placeGrandTourBet(user: User, raceId: string, riderIds: string[]): Promise<BetGrandTour> {
    const race = await Race.findOrFail(raceId)
    this.checkRaceNotStarted(race)

    await this.checkGrandTourBudget(raceId, riderIds)

    const existing = await BetGrandTour.query()
      .where('user_id', user.id)
      .where('race_id', raceId)
      .first()

    if (existing) {
      await BetGrandTourRider.query().where('bet_id', existing.id).delete()
      existing.placedAt = DateTime.now()
      await existing.save()
      await this.createGrandTourRiders(existing.id, riderIds)
      return existing
    }

    const bet = await BetGrandTour.create({
      userId: user.id,
      raceId,
      status: BetStatus.OPEN,
      placedAt: DateTime.now(),
    })

    await this.createGrandTourRiders(bet.id, riderIds)
    return bet
  }

  private async createGrandTourRiders(betId: string, riderIds: string[]): Promise<void> {
    await Promise.all(riderIds.map((riderId) => BetGrandTourRider.create({ betId, riderId })))
  }

  private async checkGrandTourBudget(raceId: string, riderIds: string[]): Promise<void> {
    const snapshotExists = await RaceRiderCost.query().where('race_id', raceId).first()
    if (!snapshotExists) {
      throw new Exception(
        'Les coûts des coureurs ne sont pas encore définis pour cette course.',
        { status: 422 }
      )
    }

    const costs = await RaceRiderCost.query()
      .where('race_id', raceId)
      .whereIn('rider_id', riderIds)

    const total = costs.reduce((sum, c) => sum + c.cost, 0)
    if (total > GT_RIDER_BUDGET) {
      throw new Exception(
        `Budget dépassé : ${total} crédits pour ${GT_RIDER_BUDGET} autorisés.`,
        { status: 422 }
      )
    }
  }

  private checkRaceNotStarted(race: Race): void {
    if (race.startAt && race.startAt <= DateTime.now()) {
      throw new Exception('La course a déjà démarré, le pronostic ne peut plus être modifié.', {
        status: 409,
      })
    }
  }
}
