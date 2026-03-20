import RaceService from '#services/race_service'
import RaceTransformer from '#transformers/race_transformer'
import { addRaceValidator } from '#validators/race'
import Race from '#models/race'
import LeagueRace from '#models/league_race'
import type { HttpContext } from '@adonisjs/core/http'

export default class LeagueRaceController {
  async index({ params, serialize }: HttpContext) {
    const leagueRaces = await LeagueRace.query().where('league_id', params.id).select('race_id')
    const raceIds = leagueRaces.map((lr) => lr.raceId)

    if (raceIds.length === 0) {
      return serialize({ races: [] })
    }

    const races = await Race.query().whereIn('id', raceIds).orderBy('start_at', 'asc')
    return serialize({ races: races.map((r) => RaceTransformer.transform(r)) })
  }

  async store({ params, request, auth, response, serialize }: HttpContext) {
    const { slug } = await request.validateUsing(addRaceValidator)
    const user = auth.getUserOrFail()
    const race = await new RaceService().addToLeague(user, params.id, slug)
    response.status(201)
    return serialize({ race: RaceTransformer.transform(race) })
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await new RaceService().removeFromLeague(user, params.id, params.raceId)
    return response.noContent()
  }
}
