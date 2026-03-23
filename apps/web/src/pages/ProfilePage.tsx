import { useState } from 'react'
import { authApi } from '../api/auth'
import { notificationsApi } from '../api/notifications'
import { useAuthStore } from '../stores/auth'
import { usePushNotifications } from '../hooks/usePushNotifications'
import AppShell from '../components/AppShell'

function TestPushButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function handleTest() {
    setState('loading')
    try {
      await notificationsApi.testPush()
      setState('ok')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleTest}
      disabled={state === 'loading'}
      style={{
        background: state === 'ok' ? 'rgba(92,184,92,0.12)' : state === 'error' ? 'rgba(232,100,80,0.12)' : 'rgba(255,255,255,0.04)',
        color: state === 'ok' ? '#5cb85c' : state === 'error' ? '#e86450' : 'rgba(240,237,232,0.5)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '0.65rem 1.25rem',
        fontSize: 14,
        fontWeight: 600,
        cursor: state === 'loading' ? 'not-allowed' : 'pointer',
        marginBottom: '0.75rem',
      }}
    >
      {state === 'loading' ? 'Envoi…' : state === 'ok' ? '✓ Notification envoyée !' : state === 'error' ? '✗ Erreur' : 'Tester les notifications'}
    </button>
  )
}

export default function ProfilePage() {
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  const push = usePushNotifications()
  const [pseudo, setPseudo] = useState(user?.pseudo ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)
    try {
      const res = await authApi.updateProfile(pseudo)
      setUser(res.data.data)
      setSuccess(true)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data as
        | { errors?: { message: string }[]; message?: string }
        | undefined
      setError(data?.errors?.[0]?.message ?? data?.message ?? 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell activePage="profile" pageTitle="Mon profil">
      <div style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          background: '#131318',
          border: '0.5px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: '1.75rem',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f0ede8', marginBottom: '1.5rem' }}>
            Informations du profil
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(240,237,232,0.5)', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.6)', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                {user?.email}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(240,237,232,0.5)', marginBottom: 6 }}>
                Pseudo
              </label>
              <input
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  padding: '0.6rem 0.75rem',
                  color: '#f0ede8',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                type="text"
                value={pseudo}
                onChange={(e) => { setPseudo(e.target.value); setSuccess(false) }}
                required
                minLength={2}
                maxLength={50}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: '#e05c5c', padding: '0.5rem 0.75rem', background: 'rgba(224,92,92,0.08)', borderRadius: 6 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ fontSize: 13, color: '#5cb85c', padding: '0.5rem 0.75rem', background: 'rgba(92,184,92,0.08)', borderRadius: 6 }}>
                Profil mis à jour.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#e8c96d',
                color: '#13110d',
                border: 'none',
                borderRadius: 8,
                padding: '0.65rem 1.25rem',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                alignSelf: 'flex-start',
              }}
            >
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>

        {/* ── Notifications ── */}
        {push.state !== 'unsupported' && (
          <div style={{
            background: '#131318',
            border: '0.5px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '1.75rem',
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f0ede8', marginBottom: 8 }}>
              Notifications
            </div>
            <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {push.state === 'subscribed'
                ? 'Tu recevras un rappel 5h et 1h avant le départ d\'une course si tu n\'as pas encore pronostiqué.'
                : push.state === 'denied'
                ? 'Les notifications sont bloquées dans les paramètres de ton navigateur.'
                : 'Active les notifications pour recevoir un rappel avant chaque course.'}
            </div>
            {push.state === 'subscribed' && (
              <TestPushButton />
            )}
            {push.state !== 'denied' && (
              <button
                onClick={push.state === 'subscribed' ? push.unsubscribe : push.subscribe}
                disabled={push.loading}
                style={{
                  background: push.state === 'subscribed' ? 'rgba(255,255,255,0.06)' : '#e8c96d',
                  color: push.state === 'subscribed' ? 'rgba(240,237,232,0.7)' : '#13110d',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.65rem 1.25rem',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: push.loading ? 'not-allowed' : 'pointer',
                  opacity: push.loading ? 0.7 : 1,
                }}
              >
                {push.loading
                  ? '…'
                  : push.state === 'subscribed'
                  ? 'Désactiver les notifications'
                  : 'Activer les notifications'}
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
