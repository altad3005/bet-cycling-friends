import type { HttpContext } from '@adonisjs/core/http'

export default class FeedController {
  async leagueFeed({ params, request, response }: HttpContext) {
    const limit = Math.min(Number(request.qs().limit ?? 20), 50)
    const { default: FeedService } = await import('#services/feed_service')
    const events = await new FeedService().getLeagueFeed(params.id, limit)
    return response.ok({ data: { events } })
  }
}
