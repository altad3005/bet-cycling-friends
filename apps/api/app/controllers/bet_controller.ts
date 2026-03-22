import BetService from '#services/bet_service'
import BetClassicTransformer from '#transformers/bet_classic_transformer'
import BetGrandTourTransformer from '#transformers/bet_grand_tour_transformer'
import { betClassicValidator, betGrandTourValidator } from '#validators/bet'
import Race from '#models/race'
import BetClassic from '#models/bet_classic'
import BetGrandTour from '#models/bet_grand_tour'
import LeagueMember from '#models/league_member'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

export default class BetController {
  async show({ params, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const race = await Race.findOrFail(params.id)

    if (race.isGrandTour) {
      const bet = await BetGrandTour.query()
        .where('user_id', user.id)
        .where('race_id', params.id)
        .preload('betRiders', (q) => q.preload('rider'))
        .first()
      return serialize({ bet: bet ? BetGrandTourTransformer.transform(bet) : null })
    }

    const bet = await BetClassic.query()
      .where('user_id', user.id)
      .where('race_id', params.id)
      .preload('favoriteRider')
      .preload('bonusRider')
      .first()
    return serialize({ bet: bet ? BetClassicTransformer.transform(bet) : null })
  }

  async storeClassic({ params, request, auth, response, serialize }: HttpContext) {
    const { favoriteRiderId, bonusRiderId } = await request.validateUsing(betClassicValidator)
    const user = auth.getUserOrFail()
    const bet = await new BetService().placeClassicBet(user, params.id, favoriteRiderId, bonusRiderId)
    await bet.load('favoriteRider')
    await bet.load('bonusRider')
    response.status(201)
    return serialize({ bet: BetClassicTransformer.transform(bet) })
  }

  async storeGrandTour({ params, request, auth, response, serialize }: HttpContext) {
    const { riderIds } = await request.validateUsing(betGrandTourValidator)
    const user = auth.getUserOrFail()
    const bet = await new BetService().placeGrandTourBet(user, params.id, riderIds)
    await bet.load('betRiders', (q) => q.preload('rider'))
    response.status(201)
    return serialize({ bet: BetGrandTourTransformer.transform(bet) })
  }

  async leagueBets({ params, serialize }: HttpContext) {
    const race = await Race.findOrFail(params.raceId)
    const masked = race.startAt ? race.startAt > DateTime.now() : true

    const memberIds = await LeagueMember.query()
      .where('league_id', params.id)
      .select('user_id')

    const userIds = memberIds.map((m) => m.userId)

    if (race.isGrandTour) {
      const bets = await BetGrandTour.query()
        .whereIn('user_id', userIds)
        .where('race_id', params.raceId)
        .preload('user')
        .preload('betRiders', (q) => q.preload('rider'))
        .orderBy('placed_at', 'asc')
      const gtBets = masked
        ? bets.map((b) => BetGrandTourTransformer.transformMasked(b))
        : BetGrandTourTransformer.transform(bets)
      return serialize({ bets: gtBets, raceStarted: !masked })
    }

    const bets = await BetClassic.query()
      .whereIn('user_id', userIds)
      .where('race_id', params.raceId)
      .preload('user')
      .preload('favoriteRider')
      .preload('bonusRider')
      .orderBy('placed_at', 'asc')
    const classicBets = masked
      ? bets.map((b) => BetClassicTransformer.transformMasked(b))
      : BetClassicTransformer.transform(bets)
    return serialize({ bets: classicBets, raceStarted: !masked })
  }
}
