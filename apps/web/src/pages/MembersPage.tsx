import { useQuery } from '@tanstack/react-query'
import { leaguesApi } from '../api/leagues'
import { standingsApi } from '../api/standings'
import { useAuthStore } from '../stores/auth'
import { useLeague } from '../hooks/useLeague'
import AppShell from '../components/AppShell'
import { initials, avatarColor } from '../utils/ui'
import './HomePage.css'
import './MembersPage.css'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const RANK_CLASSES = ['g', 's', 'b']

export default function MembersPage() {
  const user = useAuthStore((s) => s.user)
  const { activeLeague } = useLeague()

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', activeLeague?.id],
    queryFn: () => leaguesApi.members(activeLeague!.id).then((r) => r.data.data.members),
    enabled: !!activeLeague,
  })

  const { data: standings } = useQuery({
    queryKey: ['standings', 'league', activeLeague?.id],
    queryFn: () => standingsApi.league(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  // Merge members with standings
  const enriched = members?.map((m, i) => {
    const standing = standings?.find((s) => s.userId === m.userId)
    return { ...m, rank: standing?.rank, totalPoints: standing?.totalPoints ?? 0, racesPlayed: standing?.racesPlayed ?? 0, colorIndex: i }
  }).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))

  return (
    <AppShell activePage="members" pageTitle="Membres">

      {/* ── League info strip ── */}
      {activeLeague && (
        <div className="members-strip">
          <div className="members-strip-item">
            <div className="members-strip-val">{activeLeague.memberCount}</div>
            <div className="members-strip-label">membres</div>
          </div>
          <div className="members-strip-sep" />
          <div className="members-strip-item">
            <div className="members-strip-val members-strip-code">{activeLeague.code}</div>
            <div className="members-strip-label">code d'invitation</div>
          </div>
          <div className="members-strip-sep" />
          <div className="members-strip-item">
            <div className="members-strip-val">Saison {activeLeague.season}</div>
            <div className="members-strip-label">en cours</div>
          </div>
        </div>
      )}

      {/* ── Member list ── */}
      {membersLoading ? (
        <div className="members-loading">Chargement…</div>
      ) : !enriched || enriched.length === 0 ? (
        <div className="members-empty">Aucun membre pour l'instant.</div>
      ) : (
        <div className="members-list">
          <div className="members-col-head">
            <div className="mcol-rank">#</div>
            <div className="mcol-avatar" />
            <div className="mcol-name">Joueur</div>
            <div className="mcol-races">Crses</div>
            <div className="mcol-pts">Points</div>
            <div className="mcol-joined">Membre depuis</div>
          </div>

          {enriched.map((m) => {
            const isMe = m.userId === user?.id
            const rankIdx = (m.rank ?? 999) - 1
            const col = avatarColor(m.colorIndex)
            return (
              <div key={m.userId} className={`members-row${isMe ? ' me' : ''}`}>
                <div className={`mcol-rank rank-num ${RANK_CLASSES[rankIdx] ?? ''}`}>
                  {m.rank ?? '—'}
                </div>
                <div className="mcol-avatar">
                  <div className="m-avatar" style={{ background: col.bg, color: col.color }}>
                    {initials(m.pseudo ?? '?')}
                  </div>
                </div>
                <div className="mcol-name">
                  <span className="m-pseudo">{m.pseudo}</span>
                  {isMe && <span className="me-badge">Moi</span>}
                  {m.isAdmin && (
                    <span className="admin-badge">
                      <svg viewBox="0 0 24 24" width="10" height="10"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>
                      Admin
                    </span>
                  )}
                </div>
                <div className="mcol-races">{m.racesPlayed}</div>
                <div className="mcol-pts">{m.totalPoints.toLocaleString('fr-FR')}</div>
                <div className="mcol-joined">
                  {m.joinedAt ? DATE_FMT.format(new Date(m.joinedAt)) : '—'}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </AppShell>
  )
}
