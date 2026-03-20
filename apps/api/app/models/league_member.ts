import { LeagueMemberSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import League from '#models/league'
import User from '#models/user'

export default class LeagueMember extends LeagueMemberSchema {
  @belongsTo(() => League)
  declare league: BelongsTo<typeof League>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
