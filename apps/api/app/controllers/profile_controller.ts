import UserTransformer from '#transformers/user_transformer'
import LeagueMember from '#models/league_member'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'

const updateProfileValidator = vine.compile(
  vine.object({
    pseudo: vine.string().trim().minLength(2).maxLength(50),
  })
)

export default class ProfileController {
  async show({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }

  async update({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { pseudo } = await request.validateUsing(updateProfileValidator)
    user.pseudo = pseudo
    await user.save()
    return serialize(UserTransformer.transform(user))
  }

  async leagues({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    const memberships = await LeagueMember.query()
      .where('user_id', user.id)
      .preload('league')
      .orderBy('joined_at', 'desc')

    const leagueIds = memberships.map((m) => m.leagueId)

    const counts = leagueIds.length
      ? await db
          .from('league_members')
          .whereIn('league_id', leagueIds)
          .groupBy('league_id')
          .select('league_id', db.raw('COUNT(*) as member_count'))
      : []

    const countMap = new Map(counts.map((r) => [r.league_id, Number(r.member_count)]))

    return serialize({
      leagues: memberships.map((m) => ({
        id: m.league.id,
        name: m.league.name,
        code: m.league.code,
        season: m.league.season,
        isAdmin: m.isAdmin,
        memberCount: countMap.get(m.leagueId) ?? 1,
      })),
    })
  }
}
