import { api } from './client'

export const notificationsApi = {
  vapidPublicKey: () =>
    api.get<{ publicKey: string }>('/push/vapid-public-key'),

  subscribe: (subscription: PushSubscriptionJSON) =>
    api.post('/account/push-subscription', {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    }),

  unsubscribe: (endpoint: string) =>
    api.delete('/account/push-subscription', { data: { endpoint } }),
}
