import { useState, useEffect } from 'react'
import { notificationsApi } from '../api/notifications'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)))
}

export type NotificationState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export function usePushNotifications() {
  const [state, setState] = useState<NotificationState>('unsubscribed')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }

    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      setState(existing ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  async function subscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      console.log('[push] SW ready:', reg.active?.state)

      const { data } = await notificationsApi.vapidPublicKey()
      console.log('[push] VAPID key:', data.publicKey?.slice(0, 20) + '…')

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey) as unknown as BufferSource,
      })
      console.log('[push] Browser subscription created:', subscription.endpoint.slice(0, 60) + '…')

      await notificationsApi.subscribe(subscription.toJSON())
      console.log('[push] Saved to API ✓')
      setState('subscribed')
    } catch (err) {
      console.error('[push] Error:', err)
      if (Notification.permission === 'denied') setState('denied')
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.getSubscription()
      if (subscription) {
        await notificationsApi.unsubscribe(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setState('unsubscribed')
    } finally {
      setLoading(false)
    }
  }

  return { state, loading, subscribe, unsubscribe }
}
