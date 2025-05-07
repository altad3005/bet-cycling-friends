import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import League from '#models/league'
import Course from '#models/course'

export default class Bet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare leagueId: number

  @column()
  declare courseId: number

  @column()
  declare favoriteRider: string

  @column()
  declare bonusRider: string

  @column()
  declare points: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => League)
  declare league: BelongsTo<typeof League>

  @belongsTo(() => Course)
  declare course: BelongsTo<typeof Course>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
