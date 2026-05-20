import Race from '#models/race'
import RaceService from '#services/race_service'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class RaceSnapshotController {
  async snapshotCosts({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!user.isSuperAdmin) {
      throw new Exception('Accès réservé au super administrateur.', { status: 403 })
    }

    const race = await Race.findOrFail(params.id)
    await new RaceService().snapshotRiderCosts(race)
    return response.accepted({ snapshotted: true })
  }
}
