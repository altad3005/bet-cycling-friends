import { randomUUID } from 'node:crypto'
import vine from '@vinejs/vine'
import PushSubscription from '#models/push_subscription'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

const subscribeValidator = vine.compile(
  vine.object({
    endpoint: vine.string().url(),
    keys: vine.object({
      p256dh: vine.string(),
      auth: vine.string(),
    }),
  })
)

export default class PushSubscriptionController {
  async store({ request, auth, response }: HttpContext) {
    const user = await auth.authenticate()
    const { endpoint, keys } = await request.validateUsing(subscribeValidator)

    await PushSubscription.updateOrCreate(
      { userId: user.id, endpoint },
      { id: randomUUID(), userId: user.id, endpoint, p256Dh: keys.p256dh, auth: keys.auth }
    )

    return response.noContent()
  }

  async destroy({ request, auth, response }: HttpContext) {
    const user = await auth.authenticate()
    const { endpoint } = request.only(['endpoint'])

    await PushSubscription.query()
      .where('user_id', user.id)
      .where('endpoint', endpoint)
      .delete()

    return response.noContent()
  }

  async vapidPublicKey({ response }: HttpContext) {
    return response.ok({ publicKey: env.get('VAPID_PUBLIC_KEY', '') })
  }
}
