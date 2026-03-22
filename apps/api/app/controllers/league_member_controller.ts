import LeagueService from '#services/league_service'
import LeagueMemberTransformer from '#transformers/league_member_transformer'
import { updateMemberValidator } from '#validators/league'
import type { HttpContext } from '@adonisjs/core/http'
import LeagueMember from '#models/league_member'

export default class LeagueMemberController {
  async index({ params, serialize }: HttpContext) {
    const members = await LeagueMember.query()
      .where('league_id', params.id)
      .preload('user')
      .orderBy('joined_at', 'asc')
    return serialize({ members: LeagueMemberTransformer.transform(members) })
  }

  async update({ params, request, auth, serialize }: HttpContext) {
    const { isAdmin } = await request.validateUsing(updateMemberValidator)
    const user = auth.getUserOrFail()
    const member = await new LeagueService().updateMember(user, params.id, params.userId, isAdmin)
    await member.load('user')
    return serialize({ member: LeagueMemberTransformer.transform(member) })
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await new LeagueService().kickMember(user, params.id, params.userId)
    return response.noContent()
  }
}
