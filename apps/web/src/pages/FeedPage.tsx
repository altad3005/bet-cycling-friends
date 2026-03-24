import { useQuery } from '@tanstack/react-query'
import { feedApi, type FeedEvent } from '../api/feed'
import { useLeague } from '../hooks/useLeague'
import { initials, avatarColor } from '../utils/ui'
import AppShell from '../components/AppShell'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function iconBg(type: FeedEvent['type']) {
  if (type === 'results_published') return { bg: 'rgba(232,201,109,0.12)', color: '#e8c96d' }
  if (type === 'bet_placed') return { bg: 'rgba(91,156,246,0.12)', color: '#5b9cf6' }
  return { bg: 'rgba(130,201,154,0.12)', color: '#82c99a' }
}

function EventIcon({ type }: { type: FeedEvent['type'] }) {
  if (type === 'bet_placed') {
    return (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    )
  }
  if (type === 'results_published') {
    return (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  )
}

function FeedEventCard({ event, isLast }: { event: FeedEvent; isLast?: boolean }) {
  const ic = iconBg(event.type)

  let title: string
  let subtitle: string | undefined

  if (event.type === 'bet_placed') {
    title = `${event.pseudo} a pronostiqué`
    subtitle = event.raceName
  } else if (event.type === 'results_published') {
    title = `Résultats · ${event.raceName}`
    subtitle = `${event.winnerPseudo} 1er avec ${event.winnerPoints} pts`
  } else {
    title = `${event.pseudo} a rejoint la ligue`
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0.85rem 1.25rem',
      borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: ic.bg, color: ic.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <EventIcon type={event.type} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#f0ede8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: event.type === 'results_published' ? '#e8c96d' : 'rgba(240,237,232,0.4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.2)', flexShrink: 0 }}>
        {timeAgo(event.at)}
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { activeLeague } = useLeague()

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['feed', 'league', activeLeague?.id, 50],
    queryFn: () => feedApi.league(activeLeague!.id, 50).then((r) => r.data.data.events),
    enabled: !!activeLeague,
  })

  return (
    <AppShell activePage="dashboard" pageTitle="Activité" backPath="/dashboard">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 1rem 2rem' }}>
        <div style={{ background: '#131318', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', fontSize: 13, color: 'rgba(240,237,232,0.3)' }}>Chargement…</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', fontSize: 13, color: 'rgba(240,237,232,0.3)' }}>Aucune activité pour l'instant.</div>
          ) : (
            events.map((event, i) => (
              <FeedEventCard key={`${event.type}-${event.at}-${i}`} event={event} isLast={i === events.length - 1} />
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
