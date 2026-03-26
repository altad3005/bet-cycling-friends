import Race from '#models/race'
import RaceService from '#services/race_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class RaceSnapshotController {
  async snapshotCosts({ params, response }: HttpContext) {
    const race = await Race.findOrFail(params.id)
    await new RaceService().snapshotRiderCosts(race)
    return response.accepted({ snapshotted: true })
  }
}
