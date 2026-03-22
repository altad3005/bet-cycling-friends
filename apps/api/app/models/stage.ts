import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Stage extends BaseModel {
  static table = 'stages'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare raceId: string

  @column()
  declare number: number

  @column()
  declare name: string

  @column()
  declare date: string | null

  @column()
  declare profileIcon: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
