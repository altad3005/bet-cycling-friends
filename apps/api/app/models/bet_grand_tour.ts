import { BetsGrandTourSchema } from '#database/schema'
import { belongsTo, hasMany, hasManyThrough } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasManyThrough } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Race from '#models/race'
import BetGrandTourRider from '#models/bet_grand_tour_rider'
import Rider from '#models/rider'

export default class BetGrandTour extends BetsGrandTourSchema {
  static table = 'bets_grand_tour'

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Race)
  declare race: BelongsTo<typeof Race>

  @hasMany(() => BetGrandTourRider, { foreignKey: 'betId' })
  declare betRiders: HasMany<typeof BetGrandTourRider>

  @hasManyThrough([() => Rider, () => BetGrandTourRider], {
    foreignKey: 'betId',
    throughForeignKey: 'riderId',
  })
  declare riders: HasManyThrough<typeof Rider>
}
