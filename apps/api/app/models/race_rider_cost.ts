import { RaceRiderCostSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Rider from '#models/rider'

export default class RaceRiderCost extends RaceRiderCostSchema {
  static table = 'race_rider_costs'

  @belongsTo(() => Rider)
  declare rider: BelongsTo<typeof Rider>
}
