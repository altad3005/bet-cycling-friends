import { RiderSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import StageResult from '#models/stage_result'

export default class Rider extends RiderSchema {
  @hasMany(() => StageResult)
  declare stageResults: HasMany<typeof StageResult>
}
