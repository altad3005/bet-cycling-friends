import Race from '#models/race'
import { scoringQueue } from '#start/queue'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class RaceSyncController {
  async sync({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!user.isSuperAdmin) {
      throw new Exception('Accès réservé au super administrateur.', { status: 403 })
    }

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
