import type { HttpContext } from '@adonisjs/core/http'

export default class FeedController {
  async leagueFeed({ params, request, response }: HttpContext) {
    const limit = Math.min(Number(request.qs().limit) || 20, 50)
    const offset = Math.max(Number(request.qs().offset) || 0, 0)
    const { default: FeedService } = await import('#services/feed_service')
    const { events, hasMore } = await new FeedService().getLeagueFeed(params.id, limit, offset)
    return response.ok({ data: { events, hasMore } })
  }
}
