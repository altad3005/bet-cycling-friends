import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaguesApi } from '../api/leagues'
import { standingsApi } from '../api/standings'
import { useAuthStore } from '../stores/auth'
import { useLeague } from '../hooks/useLeague'
import { useLeagueStore } from '../stores/league'
import AppShell from '../components/AppShell'
import { initials, avatarColor } from '../utils/ui'
import './HomePage.css'
import './MembersPage.css'
import './AdminPage.css'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const RANK_CLASSES = ['g', 's', 'b']

export default function MembersPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { activeLeague } = useLeague()
  const queryClient = useQueryClient()
  const resetLeague = useLeagueStore((s) => s.reset)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  const leaveMutation = useMutation({
    mutationFn: () => leaguesApi.leave(activeLeague!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leagues'] })
      resetLeague()
      navigate('/dashboard')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur'
      setLeaveError(msg)
      setConfirmLeave(false)
    },
  })

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

      {/* ── Quitter la ligue ── */}
      {activeLeague && (
        <div className="danger-zone" style={{ marginTop: '2rem' }}>
          <div className="danger-zone-title">Zone dangereuse</div>
          {leaveError && <div className="danger-zone-error">{leaveError}</div>}
          <div className="danger-zone-row">
            <div className="danger-zone-info">
              <div className="danger-zone-label">Quitter la ligue</div>
              <div className="danger-zone-desc">Vous perdrez l'accès à cette ligue et à vos pronostics.</div>
            </div>
            {confirmLeave ? (
              <div className="danger-zone-confirm">
                <span className="amr-confirm-txt">Confirmer ?</span>
                <button className="amr-btn danger" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}>
                  {leaveMutation.isPending ? '…' : 'Quitter'}
                </button>
                <button className="amr-btn ghost" onClick={() => setConfirmLeave(false)}>Annuler</button>
              </div>
            ) : (
              <button className="amr-btn danger-ghost" onClick={() => { setLeaveError(null); setConfirmLeave(true) }}>
                Quitter
              </button>
            )}
          </div>
        </div>
      )}

    </AppShell>
  )
}
