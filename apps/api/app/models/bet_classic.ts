import { BetsClassicSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Race from '#models/race'
import Rider from '#models/rider'

export default class BetClassic extends BetsClassicSchema {
  static table = 'bets_classic'

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Race)
  declare race: BelongsTo<typeof Race>

  @belongsTo(() => Rider, { foreignKey: 'favoriteRiderId' })
  declare favoriteRider: BelongsTo<typeof Rider>

  @belongsTo(() => Rider, { foreignKey: 'bonusRiderId' })
  declare bonusRider: BelongsTo<typeof Rider>
}
