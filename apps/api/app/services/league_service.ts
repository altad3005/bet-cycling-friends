import { MAX_LEAGUE_MEMBERS } from '@bcf/shared'
import { Exception } from '@adonisjs/core/exceptions'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import League from '#models/league'
import LeagueMember from '#models/league_member'
import Season from '#models/season'
import type User from '#models/user'

export default class LeagueService {
  async create(user: User, name: string): Promise<League> {
    const year = DateTime.now().year
    await Season.firstOrCreate({ year }, { year })

    const code = await this.generateUniqueCode()

    const league = await League.create({
      name,
      code,
      season: year,
      createdBy: user.id,
    })

    await LeagueMember.create({
      leagueId: league.id,
      userId: user.id,
      isAdmin: true,
      joinedAt: DateTime.now(),
    })

    return league
  }

  async previewByCode(code: string): Promise<League> {
    return League.query()
      .where('code', code)
      .withCount('members')
      .firstOrFail()
  }

  async join(user: User, code: string): Promise<League> {
    const league = await League.findByOrFail('code', code)

    const existing = await LeagueMember.query()
      .where('league_id', league.id)
      .where('user_id', user.id)
      .first()

    if (existing) {
      throw new Exception('Vous êtes déjà membre de cette ligue.', { status: 409 })
    }

    const memberCount = await LeagueMember.query()
      .where('league_id', league.id)
      .count('* as total')

    if (Number(memberCount[0].$extras.total) >= MAX_LEAGUE_MEMBERS) {
      throw new Exception('La ligue est pleine.', { status: 409 })
    }

    await LeagueMember.create({
      leagueId: league.id,
      userId: user.id,
      isAdmin: false,
      joinedAt: DateTime.now(),
    })

    return league
  }

  async leave(user: User, leagueId: string): Promise<void> {
    const member = await LeagueMember.query()
      .where('league_id', leagueId)
      .where('user_id', user.id)
      .firstOrFail()

    if (member.isAdmin) {
      const adminCount = await LeagueMember.query()
        .where('league_id', leagueId)
        .where('is_admin', true)
        .count('* as total')

      if (Number(adminCount[0].$extras.total) <= 1) {
        throw new Exception(
          'Vous êtes le seul administrateur. Promouvez un autre membre avant de quitter.',
          { status: 409 }
        )
      }
    }

    await member.delete()
  }

  async updateMember(
    requestingUser: User,
    leagueId: string,
    targetUserId: string,
    isAdmin: boolean
  ): Promise<LeagueMember> {
    await this.requireAdmin(requestingUser.id, leagueId)

    const member = await LeagueMember.query()
      .where('league_id', leagueId)
      .where('user_id', targetUserId)
      .firstOrFail()

    member.isAdmin = isAdmin
    await member.save()

    return member
  }

  async kickMember(requestingUser: User, leagueId: string, targetUserId: string): Promise<void> {
    await this.requireAdmin(requestingUser.id, leagueId)

    if (requestingUser.id === targetUserId) {
      throw new Exception('Utilisez la route /leave pour quitter la ligue.', { status: 400 })
    }

    const member = await LeagueMember.query()
      .where('league_id', leagueId)
      .where('user_id', targetUserId)
      .firstOrFail()

    await member.delete()
  }

  private async requireAdmin(userId: string, leagueId: string): Promise<void> {
    const member = await LeagueMember.query()
      .where('league_id', leagueId)
      .where('user_id', userId)
      .first()

    if (!member?.isAdmin) {
      throw new Exception('Accès réservé aux administrateurs.', { status: 403 })
    }
  }

  private async generateUniqueCode(): Promise<string> {
    let code: string
    let exists: League | null

    do {
      code = randomBytes(4).toString('hex').toUpperCase()
      exists = await League.findBy('code', code)
    } while (exists)

    return code
  }
}
