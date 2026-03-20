import type BetGrandTour from '#models/bet_grand_tour'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class BetGrandTourTransformer extends BaseTransformer<BetGrandTour> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'userId', 'raceId', 'status', 'placedAt']),
      user: this.resource.user
        ? { id: this.resource.user.id, pseudo: this.resource.user.pseudo, icon: this.resource.user.icon }
        : undefined,
      riders: this.resource.betRiders?.map((br) => ({
        id: br.rider?.id,
        name: br.rider?.name,
        pcsUrl: br.rider?.pcsUrl,
      })),
    }
  }

  static transformMasked(bet: BetGrandTour) {
    const base = this.transform(bet)
    return { ...base, riders: null }
  }
}
