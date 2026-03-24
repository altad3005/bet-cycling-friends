import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { memberProfileApi, type MemberProfileRace } from '../api/memberProfile'
import { useAuthStore } from '../stores/auth'
import { useLeague } from '../hooks/useLeague'
import { initials, avatarColor } from '../utils/ui'
import AppShell from '../components/AppShell'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function RankBadge({ rank }: { rank: number | null }) {
  if (!rank) return <span style={{ color: 'rgba(240,237,232,0.2)' }}>—</span>
  const color = rank === 1 ? '#e8c96d' : rank === 2 ? '#b0b8c8' : rank === 3 ? '#cd7f32' : 'rgba(240,237,232,0.5)'
  return <span style={{ color, fontWeight: 700 }}>{rank}</span>
}

function RaceRow({ race }: { race: MemberProfileRace }) {
  const hasScore = race.points !== null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 56px 56px',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.7rem 1.25rem',
      borderBottom: '0.5px solid rgba(255,255,255,0.05)',
    }}>
      <div>
        <div style={{ fontSize: 13, color: hasScore ? '#f0ede8' : 'rgba(240,237,232,0.35)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {race.raceName}
        </div>
        {race.startAt && (
          <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.25)', marginTop: 2 }}>
            {DATE_FMT.format(new Date(race.startAt))}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: hasScore ? '#e8c96d' : 'rgba(240,237,232,0.2)' }}>
        {hasScore ? `${race.points} pts` : '—'}
      </div>
      <div style={{ textAlign: 'right', fontSize: 13 }}>
        {hasScore ? <RankBadge rank={race.leagueRank} /> : (
          <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.2)' }}>
            {race.participated ? 'en attente' : 'non parié'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function MemberProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { activeLeague } = useLeague()
  const currentUser = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['member-profile', activeLeague?.id, userId],
    queryFn: () => memberProfileApi.get(activeLeague!.id, userId!).then((r) => r.data.data),
    enabled: !!activeLeague && !!userId,
  })

  const isMe = data?.user.id === currentUser?.id
  const col = avatarColor(0)

  return (
    <AppShell activePage="members" pageTitle={data?.user.pseudo ?? 'Profil'} backPath="-1">
      {isLoading || !data ? (
        <div style={{ textAlign: 'center', padding: '3rem', fontSize: 13, color: 'rgba(240,237,232,0.3)' }}>
          Chargement…
        </div>
      ) : (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 1rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Header ── */}
          <div style={{
            background: '#131318',
            border: '0.5px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '1.5rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: col.bg, color: col.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, flexShrink: 0,
            }}>
              {initials(data.user.pseudo)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8' }}>{data.user.pseudo}</div>
                {isMe && <span style={{ fontSize: 11, background: 'rgba(232,201,109,0.15)', color: '#e8c96d', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>Moi</span>}
                {data.user.isAdmin && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.5)', borderRadius: 20, padding: '2px 8px' }}>Admin</span>}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(240,237,232,0.3)', marginTop: 4 }}>
                Membre depuis {DATE_FMT.format(new Date(data.user.joinedAt))}
              </div>
            </div>
            {data.standing.rank && (
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: data.standing.rank <= 3 ? '#e8c96d' : '#f0ede8', lineHeight: 1 }}>
                  #{data.standing.rank}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', marginTop: 3 }}>dans la ligue</div>
              </div>
            )}
          </div>

          {/* ── KPIs ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Total points', value: data.standing.totalPoints.toLocaleString('fr-FR'), sub: 'cette saison' },
              { label: 'Moyenne', value: `${data.standing.avgPoints} pts`, sub: 'par course scorée' },
              { label: 'Courses', value: data.standing.racesPlayed, sub: 'jouées' },
              { label: 'Participation', value: `${data.standing.participationRate}%`, sub: 'des courses pariées' },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: '#131318', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.9rem 1.1rem' }}>
                <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#f0ede8', lineHeight: 1.2, marginTop: 4 }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', marginTop: 2 }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Meilleure course ── */}
          {data.standing.bestRace && (
            <div style={{ background: '#131318', border: '0.5px solid rgba(232,201,109,0.15)', borderRadius: 10, padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Meilleure course</div>
                <div style={{ fontSize: 14, color: '#f0ede8', fontWeight: 500 }}>{data.standing.bestRace.raceName}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e8c96d', flexShrink: 0 }}>
                {data.standing.bestRace.points} pts
              </div>
            </div>
          )}

          {/* ── Race history ── */}
          {data.races.length > 0 && (
            <div style={{ background: '#131318', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 56px 56px', gap: '0.5rem', padding: '0.6rem 1.25rem', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course</div>
                <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Pts</div>
                <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Rang</div>
              </div>
              {[...data.races].reverse().map((race) => (
                <RaceRow key={race.raceId} race={race} />
              ))}
            </div>
          )}

        </div>
      )}
    </AppShell>
  )
}
