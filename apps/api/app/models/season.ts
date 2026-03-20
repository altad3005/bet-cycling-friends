import { SeasonSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import League from '#models/league'

export default class Season extends SeasonSchema {
  @hasMany(() => League, { foreignKey: 'season' })
  declare leagues: HasMany<typeof League>
}
