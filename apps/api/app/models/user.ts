import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import LeagueMember from '#models/league_member'
import BetClassic from '#models/bet_classic'
import BetGrandTour from '#models/bet_grand_tour'
import Score from '#models/score'
import PushSubscription from '#models/push_subscription'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @hasMany(() => LeagueMember)
  declare leagueMemberships: HasMany<typeof LeagueMember>

  @hasMany(() => BetClassic)
  declare betsClassic: HasMany<typeof BetClassic>

  @hasMany(() => BetGrandTour)
  declare betsGrandTour: HasMany<typeof BetGrandTour>

  @hasMany(() => Score)
  declare scores: HasMany<typeof Score>

  @hasMany(() => PushSubscription)
  declare pushSubscriptions: HasMany<typeof PushSubscription>

  get initials() {
    const [first, last] = this.pseudo ? this.pseudo.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
