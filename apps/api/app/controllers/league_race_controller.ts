import RaceService from '#services/race_service'
import RaceTransformer from '#transformers/race_transformer'
import { addRaceValidator } from '#validators/race'
import Race from '#models/race'
import LeagueRace from '#models/league_race'
import RaceRiderCost from '#models/race_rider_cost'
import type { HttpContext } from '@adonisjs/core/http'

export default class LeagueRaceController {
  async index({ params, serialize }: HttpContext) {
    const leagueRaces = await LeagueRace.query().where('league_id', params.id).select('race_id')
    const raceIds = leagueRaces.map((lr) => lr.raceId)

    if (raceIds.length === 0) {
      return serialize({ races: [] })
    }

    const [races, snapshots] = await Promise.all([
      Race.query().whereIn('id', raceIds).orderBy('start_at', 'asc'),
      RaceRiderCost.query().whereIn('race_id', raceIds).distinct('race_id').select('race_id'),
    ])

    const snapshotRaceIds = new Set(snapshots.map((s) => s.raceId))

    return serialize({
      races: races.map((race) => ({
        ...(RaceTransformer.transform(race) as object),
        costsSnapshotted: snapshotRaceIds.has(race.id),
      })),
    })
  }

  async store({ params, request, auth, response, serialize }: HttpContext) {
    const { slug } = await request.validateUsing(addRaceValidator)
    const user = auth.getUserOrFail()
    const race = await new RaceService().addToLeague(user, params.id, slug)
    response.status(201)
    return serialize({ race: { ...(RaceTransformer.transform(race) as object), costsSnapshotted: false } })
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await new RaceService().removeFromLeague(user, params.id, params.raceId)
    return response.noContent()
  }
}
