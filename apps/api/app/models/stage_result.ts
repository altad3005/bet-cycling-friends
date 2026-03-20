import { StageResultSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Race from '#models/race'
import Rider from '#models/rider'

export default class StageResult extends StageResultSchema {
  @belongsTo(() => Race)
  declare race: BelongsTo<typeof Race>

  @belongsTo(() => Rider)
  declare rider: BelongsTo<typeof Rider>
}
