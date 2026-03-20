import type League from '#models/league'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class LeagueTransformer extends BaseTransformer<League> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'code', 'season', 'createdAt', 'updatedAt']),
      memberCount: this.resource.$extras.membersCount ?? undefined,
    }
  }
}
