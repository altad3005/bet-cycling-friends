import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MultiplierType, RaceStatus } from '@bcf/shared'
import { leaguesApi } from '../api/leagues'
import { racesApi, type RacePreview, type RaceResponse } from '../api/races'
import { useAuthStore } from '../stores/auth'
import { useLeague } from '../hooks/useLeague'
import AppShell from '../components/AppShell'
import { initials, avatarColor } from '../utils/ui'
import './HomePage.css'
import './AdminPage.css'

type Tab = 'members' | 'calendar'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function multLabel(mult: MultiplierType): string {
  if (mult === MultiplierType.MONUMENT)   return '×2,0'
  if (mult === MultiplierType.WT_CLASSIC) return '×1,5'
  if (mult === MultiplierType.GT_STAGE || mult === MultiplierType.GT_GC) return 'GT'
  return '×1,0'
}

function multClass(mult: MultiplierType): string {
  if (mult === MultiplierType.MONUMENT)   return 'x2'
  if (mult === MultiplierType.WT_CLASSIC) return 'x15'
  if (mult === MultiplierType.GT_STAGE || mult === MultiplierType.GT_GC) return 'x1'
  return ''
}

// ── Members tab ──────────────────────────────────────────────────────────

function MembersTab({ leagueId }: { leagueId: string }) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [confirmKick, setConfirmKick] = useState<string | null>(null)

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', leagueId],
    queryFn: () => leaguesApi.members(leagueId).then((r) => r.data.data.members),
  })

  const promoteMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      leaguesApi.updateMember(leagueId, userId, isAdmin),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', leagueId] }),
  })

  const kickMutation = useMutation({
    mutationFn: (userId: string) => leaguesApi.kickMember(leagueId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', leagueId] })
      queryClient.invalidateQueries({ queryKey: ['my-leagues'] })
      setConfirmKick(null)
    },
  })

  if (isLoading) return <div className="admin-loading">Chargement…</div>
  if (!members || members.length === 0) return <div className="admin-empty">Aucun membre.</div>

  const adminCount = members.filter((m) => m.isAdmin).length

  return (
    <div className="admin-list">
      {members.map((m, i) => {
        const isMe = m.userId === user?.id
        const col = avatarColor(i)
        const isKicking = confirmKick === m.userId
        const canDemote = m.isAdmin && adminCount > 1
        const canKick = !isMe

        return (
          <div key={m.userId} className={`admin-member-row${isMe ? ' me' : ''}`}>
            <div className="amr-avatar" style={{ background: col.bg, color: col.color }}>
              {initials(m.pseudo ?? '?')}
            </div>
            <div className="amr-info">
              <div className="amr-name">
                {m.pseudo}
                {isMe && <span className="me-badge">Moi</span>}
                {m.isAdmin && (
                  <span className="admin-badge-sm">
                    <svg viewBox="0 0 24 24" width="9" height="9"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>
                    Admin
                  </span>
                )}
              </div>
              <div className="amr-joined">
                Membre depuis le {m.joinedAt ? DATE_FMT.format(new Date(m.joinedAt)) : '—'}
              </div>
            </div>

            {!isMe && (
              <div className="amr-actions">
                {isKicking ? (
                  <>
                    <span className="amr-confirm-txt">Exclure ?</span>
                    <button
                      className="amr-btn danger"
                      onClick={() => kickMutation.mutate(m.userId)}
                      disabled={kickMutation.isPending}
                    >
                      Confirmer
                    </button>
                    <button className="amr-btn ghost" onClick={() => setConfirmKick(null)}>
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="amr-btn ghost"
                      onClick={() => promoteMutation.mutate({ userId: m.userId, isAdmin: !m.isAdmin })}
                      disabled={promoteMutation.isPending || (!canDemote && m.isAdmin)}
                      title={!canDemote && m.isAdmin ? 'Dernier admin — impossible de rétrograder' : ''}
                    >
                      {m.isAdmin ? 'Rétrograder' : 'Promouvoir admin'}
                    </button>
                    {canKick && (
                      <button className="amr-btn danger-ghost" onClick={() => setConfirmKick(m.userId)}>
                        Exclure
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Sync panel (per race) ─────────────────────────────────────────────────

function SyncPanel({ race }: { race: RaceResponse }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: stagesData } = useQuery({
    queryKey: ['stages', race.id],
    queryFn: () => racesApi.stages(race.id).then((r) => r.data.data),
    enabled: race.isGrandTour && open,
  })

  const syncMutation = useMutation({
    mutationFn: (stageNumber?: number) => racesApi.sync(race.id, stageNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages', race.id] })
      queryClient.invalidateQueries({ queryKey: ['races', 'league'] })
    },
  })

  const canSync = race.status === RaceStatus.LIVE || race.status === RaceStatus.FINISHED

  if (!canSync) return null

  if (!race.isGrandTour) {
    return (
      <button
        className="amr-btn ghost"
        onClick={() => syncMutation.mutate(undefined)}
        disabled={syncMutation.isPending}
        title="Synchroniser les résultats depuis PCS"
      >
        {syncMutation.isPending ? 'Envoi…' : syncMutation.isSuccess ? '✓ Envoyé' : 'Syncer'}
      </button>
    )
  }

  return (
    <div className="sync-gt-wrap">
      <button className="amr-btn ghost" onClick={() => setOpen((v) => !v)}>
        {open ? 'Fermer' : 'Syncer étapes'}
      </button>
      {open && (
        <div className="sync-gt-panel">
          {!stagesData ? (
            <div className="admin-loading" style={{ padding: '0.5rem' }}>Chargement…</div>
          ) : (
            <>
              <div className="sync-gt-list">
                {stagesData.stages.map((s) => (
                  <div key={s.number} className="sync-gt-row">
                    <span className="sync-gt-num">{s.number}</span>
                    <span className="sync-gt-name">{s.name}</span>
                    {s.synced && <span className="sync-badge done">✓</span>}
                    <button
                      className="amr-btn ghost"
                      style={{ fontSize: 11, padding: '2px 10px' }}
                      onClick={() => syncMutation.mutate(s.number)}
                      disabled={syncMutation.isPending}
                    >
                      Syncer
                    </button>
                  </div>
                ))}
              </div>
              <div className="sync-gt-gc-row">
                <button
                  className="amr-btn ghost"
                  onClick={() => syncMutation.mutate(undefined)}
                  disabled={syncMutation.isPending}
                >
                  {syncMutation.isPending ? 'Envoi…' : 'Syncer GC final'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

type BulkResult = { slug: string; status: 'pending' | 'ok' | 'error'; message?: string }

// ── Calendar tab ─────────────────────────────────────────────────────────

function CalendarTab({ leagueId }: { leagueId: string }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'single' | 'bulk'>('single')

  // single mode
  const [slug, setSlug] = useState('')
  const [preview, setPreview] = useState<RacePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // bulk mode
  const [bulkText, setBulkText] = useState('')
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([])
  const [bulkRunning, setBulkRunning] = useState(false)

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const { data: races, isLoading } = useQuery({
    queryKey: ['races', 'league', leagueId],
    queryFn: () => racesApi.leagueRaces(leagueId).then((r) => r.data.data.races),
  })

  const previewMutation = useMutation({
    mutationFn: (s: string) => racesApi.preview(s).then((r) => r.data.race),
    onSuccess: (race) => { setPreview(race); setPreviewError(null) },
    onError: () => { setPreviewError('Course introuvable. Vérifiez le slug PCS.'); setPreview(null) },
  })

  const addMutation = useMutation({
    mutationFn: (s: string) => racesApi.addToLeague(leagueId, s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races', 'league', leagueId] })
      setSlug('')
      setPreview(null)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (raceId: string) => racesApi.removeFromLeague(leagueId, raceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races', 'league', leagueId] })
      setConfirmRemove(null)
    },
  })

  async function runBulk() {
    const slugs = bulkText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!slugs.length) return

    setBulkRunning(true)
    setBulkResults(slugs.map((s) => ({ slug: s, status: 'pending' })))

    for (let i = 0; i < slugs.length; i++) {
      const s = slugs[i]
      try {
        await racesApi.addToLeague(leagueId, s)
        setBulkResults((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'ok' } : r))
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur'
        setBulkResults((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: msg } : r))
      }
    }

    setBulkRunning(false)
    queryClient.invalidateQueries({ queryKey: ['races', 'league', leagueId] })
  }

  return (
    <div>
      {/* ── Add race form ── */}
      <div className="admin-add-race">
        <div className="admin-add-race-header">
          <div className="admin-section-title" style={{ margin: 0 }}>Ajouter une course</div>
          <div className="bulk-mode-toggle">
            <button
              className={`bulk-toggle-btn${mode === 'single' ? ' active' : ''}`}
              onClick={() => setMode('single')}
            >Unique</button>
            <button
              className={`bulk-toggle-btn${mode === 'bulk' ? ' active' : ''}`}
              onClick={() => setMode('bulk')}
            >Bulk</button>
          </div>
        </div>

        {mode === 'single' ? (
          <>
            <div className="admin-add-race-form" style={{ marginTop: '0.75rem' }}>
              <input
                className="empty-input"
                placeholder="Slug PCS (ex: fleche-wallonne)"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setPreview(null); setPreviewError(null) }}
                onKeyDown={(e) => e.key === 'Enter' && slug && previewMutation.mutate(slug)}
                style={{ flex: 1, margin: 0, fontFamily: 'monospace', fontSize: 12 }}
              />
              <button
                className="btn-ghost-sm"
                onClick={() => previewMutation.mutate(slug)}
                disabled={!slug || previewMutation.isPending}
              >
                {previewMutation.isPending ? 'Recherche…' : 'Prévisualiser'}
              </button>
            </div>
            {previewError && <div className="empty-error" style={{ marginTop: 8 }}>{previewError}</div>}
            {preview && (
              <div className="admin-preview-card">
                <div className="admin-preview-name">{preview.name}</div>
                <div className="admin-preview-meta">
                  {preview.start_date && DATE_FMT.format(new Date(preview.start_date))}
                  {preview.start_date && preview.end_date && ' – '}
                  {preview.end_date && DATE_FMT.format(new Date(preview.end_date))}
                  <span className={`race-mult ${multClass(preview.multiplierType)}`} style={{ marginLeft: 8 }}>
                    {multLabel(preview.multiplierType)}
                  </span>
                </div>
                <button
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '6px 16px' }}
                  onClick={() => addMutation.mutate(slug)}
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? 'Ajout…' : '+ Ajouter au calendrier'}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <textarea
              className="bulk-textarea"
              placeholder={'Un slug par ligne :\nfleche-wallonne\nparis-roubaix\ngent-wevelgem'}
              value={bulkText}
              onChange={(e) => { setBulkText(e.target.value); setBulkResults([]) }}
              disabled={bulkRunning}
            />
            <div className="bulk-actions">
              <span className="bulk-count">
                {bulkText.split('\n').filter((s) => s.trim()).length} slug(s)
              </span>
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: '6px 16px' }}
                onClick={runBulk}
                disabled={bulkRunning || !bulkText.trim()}
              >
                {bulkRunning ? 'Ajout en cours…' : '+ Tout ajouter'}
              </button>
            </div>
            {bulkResults.length > 0 && (
              <div className="bulk-results">
                {bulkResults.map((r) => (
                  <div key={r.slug} className={`bulk-result-row ${r.status}`}>
                    <span className="bulk-result-icon">
                      {r.status === 'pending' ? '⋯' : r.status === 'ok' ? '✓' : '✗'}
                    </span>
                    <span className="bulk-result-slug">{r.slug}</span>
                    {r.message && <span className="bulk-result-msg">{r.message}</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Current races ── */}
      <div className="admin-section-title" style={{ marginTop: '1.5rem' }}>Calendrier actuel</div>
      {isLoading ? (
        <div className="admin-loading">Chargement…</div>
      ) : !races || races.length === 0 ? (
        <div className="admin-empty">Aucune course dans le calendrier.</div>
      ) : (
        <div className="admin-race-list">
          {races.map((race) => {
            const isRemoving = confirmRemove === race.id
            return (
              <div key={race.id} className="admin-race-row">
                <div className="arr-info">
                  <div className="arr-name">{race.name}</div>
                  <div className="arr-date">
                    {race.startAt ? DATE_FMT.format(new Date(race.startAt)) : '—'}
                    {race.endAt ? ` – ${DATE_FMT.format(new Date(race.endAt))}` : ''}
                  </div>
                </div>
                <div className={`race-mult ${multClass(race.multiplierType)}`}>
                  {multLabel(race.multiplierType)}
                </div>
                <div className="arr-actions">
                  <SyncPanel race={race} />
                  {isRemoving ? (
                    <>
                      <span className="amr-confirm-txt">Retirer ?</span>
                      <button
                        className="amr-btn danger"
                        onClick={() => removeMutation.mutate(race.id)}
                        disabled={removeMutation.isPending}
                      >
                        Confirmer
                      </button>
                      <button className="amr-btn ghost" onClick={() => setConfirmRemove(null)}>
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button className="amr-btn danger-ghost" onClick={() => setConfirmRemove(race.id)}>
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { activeLeague } = useLeague()
  const [tab, setTab] = useState<Tab>('members')

  const TABS: { key: Tab; label: string }[] = [
    { key: 'members',  label: 'Membres' },
    { key: 'calendar', label: 'Calendrier' },
  ]

  return (
    <AppShell activePage="admin" pageTitle="Administration">

      {/* ── Tabs ── */}
      <div className="bets-tabs" style={{ marginBottom: '1.5rem' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`bets-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!activeLeague ? (
        <div className="admin-empty">Aucune ligue sélectionnée.</div>
      ) : tab === 'members' ? (
        <MembersTab leagueId={activeLeague.id} />
      ) : (
        <CalendarTab leagueId={activeLeague.id} />
      )}

    </AppShell>
  )
}
