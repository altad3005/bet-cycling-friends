import Race from '#models/race'
import Stage from '#models/stage'
import StageResult from '#models/stage_result'
import RaceService from '#services/race_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class RaceController {
  async preview({ request, response }: HttpContext) {
    const slug = request.input('slug')
    if (!slug) {
      return response.badRequest({ message: 'Le paramètre slug est requis.' })
    }

    const raceInfo = await new RaceService().preview(slug)
    return response.ok({ race: raceInfo })
  }

  async startlist({ params, serialize }: HttpContext) {
    const race = await Race.findOrFail(params.id)
    const riders = await new RaceService().getStartlist(race)
    return serialize({ riders })
  }

  async stages({ params, serialize }: HttpContext) {
    const race = await Race.findOrFail(params.id)

    const [dbStages, syncedResults] = await Promise.all([
      Stage.query().where('race_id', race.id).orderBy('number', 'asc'),
      StageResult.query()
        .where('race_id', race.id)
        .where('result_type', 'stage')
        .distinct('stage_number')
        .select('stage_number'),
    ])

    const syncedSet = new Set(syncedResults.map((r) => r.stageNumber))

    const stages = dbStages.map((s) => ({
      number: s.number,
      name: s.name,
      date: s.date,
      profileIcon: s.profileIcon,
      synced: syncedSet.has(s.number),
    }))

    return serialize({ stageCount: race.stageCount ?? stages.length, stages })
  }
}
