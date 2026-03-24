import type { HttpContext } from '@adonisjs/core/http'

export default class StatsController {
  async leagueStats({ params, response }: HttpContext) {
    const { default: StatsService } = await import('#services/stats_service')
    const data = await new StatsService().getLeagueStats(params.id)
    return response.ok({ data })
  }
}
