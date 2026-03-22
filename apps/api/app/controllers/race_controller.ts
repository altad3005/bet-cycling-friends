import Race from '#models/race'
import Stage from '#models/stage'
import StageResult from '#models/stage_result'
import Rider from '#models/rider'
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

  async results({ params, serialize }: HttpContext) {
    const race = await Race.findOrFail(params.id)

    // Classique : result_type='result', stage 0
    // GT : result_type='gc', stage 0 (classement général final)
    const resultType = race.isGrandTour ? 'gc' : 'result'

    const rows = await StageResult.query()
      .where('race_id', race.id)
      .where('stage_number', 0)
      .where('result_type', resultType)
      .where('rank', '<=', 10)
      .orderBy('rank', 'asc')

    if (rows.length === 0) return serialize({ results: [] })

    const riderIds = rows.map((r) => r.riderId)
    const riders = await Rider.query().whereIn('id', riderIds)
    const riderMap = new Map(riders.map((r) => [r.id, r.name]))

    return serialize({
      results: rows.map((r) => ({
        rank: r.rank,
        riderId: r.riderId,
        name: riderMap.get(r.riderId) ?? '—',
      })),
    })
  }
}
