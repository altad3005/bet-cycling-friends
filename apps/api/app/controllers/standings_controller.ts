import StandingsService from '#services/standings_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class StandingsController {
  async leagueStandings({ params, response }: HttpContext) {
    const standings = await new StandingsService().getLeagueStandings(params.id)
    return response.ok({ standings })
  }

  async raceStandings({ params, response }: HttpContext) {
    const standings = await new StandingsService().getRaceStandings(params.id, params.raceId)
    return response.ok({ standings })
  }

  async stageStandings({ params, response }: HttpContext) {
    const standings = await new StandingsService().getStageStandings(
      params.id,
      params.raceId,
      Number(params.n)
    )
    return response.ok({ standings })
  }

  async globalStandings({ response }: HttpContext) {
    const standings = await new StandingsService().getGlobalStandings()
    return response.ok({ standings })
  }
}
