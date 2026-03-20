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
}
