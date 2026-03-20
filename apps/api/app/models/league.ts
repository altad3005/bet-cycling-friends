import { LeagueSchema } from '#database/schema'
import { belongsTo, hasMany, hasManyThrough } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasManyThrough } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import LeagueMember from '#models/league_member'
import LeagueRace from '#models/league_race'
import Race from '#models/race'

export default class League extends LeagueSchema {
  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => LeagueMember)
  declare members: HasMany<typeof LeagueMember>

  @hasMany(() => LeagueRace)
  declare leagueRaces: HasMany<typeof LeagueRace>

  @hasManyThrough([() => Race, () => LeagueRace], {
    foreignKey: 'leagueId',
    throughForeignKey: 'raceId',
  })
  declare races: HasManyThrough<typeof Race>
}
