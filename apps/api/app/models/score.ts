import { ScoreSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Race from '#models/race'
import League from '#models/league'

export default class Score extends ScoreSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Race)
  declare race: BelongsTo<typeof Race>

  @belongsTo(() => League)
  declare league: BelongsTo<typeof League>
}
