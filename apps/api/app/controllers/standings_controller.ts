import StandingsService from '#services/standings_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class StandingsController {
  async leagueStandings({ params, serialize }: HttpContext) {
    const standings = await new StandingsService().getLeagueStandings(params.id)
    return serialize({ standings })
  }

  async raceStandings({ params, serialize }: HttpContext) {
    const standings = await new StandingsService().getRaceStandings(params.id, params.raceId)
    return serialize({ standings })
  }

  async stageStandings({ params, serialize }: HttpContext) {
    const standings = await new StandingsService().getStageStandings(
      params.id,
      params.raceId,
      Number(params.n)
    )
    return serialize({ standings })
  }

  async globalStandings({ serialize }: HttpContext) {
    const standings = await new StandingsService().getGlobalStandings()
    return serialize({ standings })
  }
}
