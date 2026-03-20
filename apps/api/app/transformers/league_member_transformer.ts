import type LeagueMember from '#models/league_member'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class LeagueMemberTransformer extends BaseTransformer<LeagueMember> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'leagueId', 'userId', 'isAdmin', 'joinedAt']),
      pseudo: this.resource.user?.pseudo,
      icon: this.resource.user?.icon,
    }
  }
}
