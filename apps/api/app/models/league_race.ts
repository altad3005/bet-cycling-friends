import { LeagueRaceSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import League from '#models/league'
import Race from '#models/race'

export default class LeagueRace extends LeagueRaceSchema {
  @belongsTo(() => League)
  declare league: BelongsTo<typeof League>

  @belongsTo(() => Race)
  declare race: BelongsTo<typeof Race>
}
