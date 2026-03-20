import { BetsGrandTourRiderSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import BetGrandTour from '#models/bet_grand_tour'
import Rider from '#models/rider'

export default class BetGrandTourRider extends BetsGrandTourRiderSchema {
  static table = 'bets_grand_tour_riders'

  @belongsTo(() => BetGrandTour, { foreignKey: 'betId' })
  declare bet: BelongsTo<typeof BetGrandTour>

  @belongsTo(() => Rider)
  declare rider: BelongsTo<typeof Rider>
}
