import LeagueService from '#services/league_service'
import LeagueTransformer from '#transformers/league_transformer'
import { createLeagueValidator } from '#validators/league'
import League from '#models/league'
import type { HttpContext } from '@adonisjs/core/http'

export default class LeagueController {
  async store({ request, auth, response, serialize }: HttpContext) {
    const { name } = await request.validateUsing(createLeagueValidator)
    const user = auth.getUserOrFail()
    const league = await new LeagueService().create(user, name)
    response.status(201)
    return serialize({ league: LeagueTransformer.transform(league) })
  }

  async show({ params, serialize }: HttpContext) {
    const league = await League.query()
      .where('id', params.id)
      .withCount('members')
      .firstOrFail()
    await league.load('members', (q) => q.preload('user'))
    await league.load('races')
    return serialize({ league: LeagueTransformer.transform(league) })
  }

  async previewJoin({ params, serialize }: HttpContext) {
    const league = await new LeagueService().previewByCode(params.code)
    return serialize({ league: LeagueTransformer.transform(league) })
  }

  async join({ params, auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const league = await new LeagueService().join(user, params.code)
    response.status(201)
    return serialize({ league: LeagueTransformer.transform(league) })
  }

  async leave({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await new LeagueService().leave(user, params.id)
    return response.noContent()
  }
}
