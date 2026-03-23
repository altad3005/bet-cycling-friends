import { PushSubscriptionSchema } from '#database/schema'
import { column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class PushSubscription extends PushSubscriptionSchema {
  // schema.ts est auto-généré et génère p_256_dh au lieu de p256dh
  @column({ columnName: 'p256dh' })
  declare p256Dh: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
