import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Bet from '#models/bet'

export default class Course extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare date: Date

  @column()
  declare type: 'one_day' | 'stage' | 'time_trial' | 'grand_tour'

  @column()
  declare multiplier: number

  @column()
  declare parentId?: number // null si ce n’est pas une étape d’un grand tour

  @hasMany(() => Course, {
    foreignKey: 'parentId',
  })
  declare stages: HasMany<typeof Course>

  @belongsTo(() => Course, {
    foreignKey: 'parentId',
  })
  declare parent: BelongsTo<typeof Course>

  @hasMany(() => Bet)
  declare bets: HasMany<typeof Bet>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
