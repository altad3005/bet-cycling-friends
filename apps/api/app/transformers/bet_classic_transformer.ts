import type BetClassic from '#models/bet_classic'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class BetClassicTransformer extends BaseTransformer<BetClassic> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'userId', 'raceId', 'status', 'placedAt']),
      user: this.resource.user
        ? { id: this.resource.user.id, pseudo: this.resource.user.pseudo, icon: this.resource.user.icon }
        : undefined,
      favoriteRider: this.serializeRider(this.resource.favoriteRider),
      bonusRider: this.serializeRider(this.resource.bonusRider),
    }
  }

  static transformMasked(bet: BetClassic) {
    const base = this.transform(bet)
    return { ...base, favoriteRider: null, bonusRider: null }
  }

  private serializeRider(rider: BetClassic['favoriteRider'] | undefined) {
    if (!rider) return undefined
    return { id: rider.id, name: rider.name, pcsUrl: rider.pcsUrl }
  }
}
