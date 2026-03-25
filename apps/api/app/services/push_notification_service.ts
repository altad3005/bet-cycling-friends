import webpush from 'web-push'
import env from '#start/env'
import PushSubscription from '#models/push_subscription'

webpush.setVapidDetails(
  env.get('VAPID_SUBJECT', ''),
  env.get('VAPID_PUBLIC_KEY', ''),
  env.get('VAPID_PRIVATE_KEY', '')
)

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export default class PushNotificationService {
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const subscriptions = await PushSubscription.query().where('user_id', userId)

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256Dh, auth: sub.auth } },
            JSON.stringify(payload)
          )
        } catch (err: any) {
          // Subscription expired or invalid — remove it
          if (err.statusCode === 404 || err.statusCode === 410) {
            await sub.delete()
          }
        }
      })
    )
  }

  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    await Promise.allSettled(userIds.map((id) => this.sendToUser(id, payload)))
  }
}
