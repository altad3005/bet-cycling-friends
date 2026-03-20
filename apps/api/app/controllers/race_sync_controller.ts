import Race from '#models/race'
import { scoringQueue } from '#start/queue'
import type { HttpContext } from '@adonisjs/core/http'

export default class RaceSyncController {
  async sync({ params, request, response }: HttpContext) {
    const race = await Race.findOrFail(params.id)
    const { stageNumber } = request.only(['stageNumber'])

    if (race.isGrandTour) {
      if (stageNumber !== undefined) {
        await scoringQueue.add('sync', {
          type: 'sync-gt-stage',
          raceId: race.id,
          stageNumber: Number(stageNumber),
        })
      } else {
        await scoringQueue.add('sync', { type: 'sync-gt-gc', raceId: race.id })
      }
    } else {
      await scoringQueue.add('sync', { type: 'sync-classic', raceId: race.id })
    }

    return response.accepted({ queued: true })
  }
}
