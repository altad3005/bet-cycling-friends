import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RaceStatus, BetStatus, MultiplierType } from '@bcf/shared'
import { racesApi, type RaceResponse } from '../api/races'
import { betsApi, type BetClassicResponse, type BetGrandTourResponse } from '../api/bets'
import { standingsApi } from '../api/standings'
import { useAuthStore } from '../stores/auth'
import { useLeague } from '../hooks/useLeague'
import AppShell from '../components/AppShell'
import './HomePage.css'
import './BetsPage.css'

type Tab = 'upcoming' | 'live' | 'finished'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

function formatDate(race: RaceResponse) {
  if (!race.startAt) return '—'
  const d = new Date(race.startAt)
  if (!race.endAt) return DATE_FMT.format(d)
  const end = new Date(race.endAt)
  if (d.getMonth() === end.getMonth()) return `${d.getDate()}–${DATE_FMT.format(end)}`
  return `${DATE_FMT.format(d)} – ${DATE_FMT.format(end)}`
}

function isUrgent(race: RaceResponse) {
  if (!race.startAt || race.status !== RaceStatus.UPCOMING) return false
  return new Date(race.startAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
}

function multProps(race: RaceResponse): { label: string; cls: string } {
  switch (race.multiplierType) {
    case MultiplierType.MONUMENT:   return { label: '×2,0', cls: 'monument' }
    case MultiplierType.WT_CLASSIC: return { label: '×1,5', cls: 'wt-classic' }
    case MultiplierType.GT_STAGE:
    case MultiplierType.GT_GC:      return { label: 'GT',   cls: 'gt' }
    default:                        return { label: '×1,0', cls: 'stage-race' }
  }
}

// ── Bet detail sub-component (lazy fetches its own data) ──────────────

function BetDetail({ race }: { race: RaceResponse }) {
  const { data: bet, isLoading } = useQuery({
    queryKey: ['bet', race.id],
    queryFn: () => betsApi.myBet(race.id).then((r) => r.data.data.bet),
  })

  if (isLoading) return <div className="bet-detail-loading">Chargement…</div>
  if (!bet) return <div className="bet-detail-empty">Aucun pronostic enregistré.</div>

  if (race.isGrandTour) {
    const gt = bet as BetGrandTourResponse
    return (
      <div>
        <div className="bet-detail-label">Équipe de 8</div>
        <div className="bet-riders">
          {gt.riders?.map((r) => (
            <div key={r.id} className="bet-rider-tag">{r.name}</div>
          )) ?? <div className="bet-detail-empty">Non renseigné</div>}
        </div>
      </div>
    )
  }

  const cl = bet as BetClassicResponse
  return (
    <div>
      <div className="bet-detail-label">Sélections</div>
      <div className="bet-riders">
        {cl.favoriteRider && (
          <div className="bet-rider-tag favorite">
            <span className="bet-rider-role">Favori</span>
            {cl.favoriteRider.name}
          </div>
        )}
        {cl.bonusRider && (
          <div className="bet-rider-tag bonus">
            <span className="bet-rider-role">Bonus</span>
            {cl.bonusRider.name}
          </div>
        )}
        {!cl.favoriteRider && !cl.bonusRider && (
          <div className="bet-detail-empty">Sélections masquées avant le départ</div>
        )}
      </div>
    </div>
  )
}

// ── Race bet card ──────────────────────────────────────────────────────

function BetCard({ race, tab }: { race: RaceResponse; tab: Tab }) {
  const [expanded, setExpanded] = useState(false)
  const urgent = isUrgent(race)
  const mult = multProps(race)
  const canExpand = tab !== 'upcoming'

  const dotClass = tab === 'live' ? 'live' : tab === 'upcoming' ? 'upcoming' : 'done'
  const nameClass = tab === 'finished' ? 'dim' : ''

  return (
    <div
      className={[
        'bet-card',
        urgent ? 'urgent' : '',
        tab === 'live' ? 'live' : '',
        canExpand ? 'expandable' : '',
      ].filter(Boolean).join(' ')}
      onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
    >
      <div className="bet-card-head">
        <div className={`bet-dot ${dotClass}`} />

        <div>
          <div className={`bet-name${nameClass ? ' ' + nameClass : ''}`}>{race.name}</div>
          <div className="bet-date">{formatDate(race)}</div>
        </div>

        <div className={`bet-mult ${mult.cls}`}>{mult.label}</div>

        {tab === 'upcoming' && (
          <button
            className={`bet-cta ${urgent ? 'urgent' : 'primary'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {urgent ? 'Urgent — Parier' : 'Parier'}
          </button>
        )}

        {tab === 'live' && (
          <button className="bet-cta ghost" disabled>Verrouillé</button>
        )}

        {tab === 'finished' && (
          <button className="bet-cta ghost" disabled>Scoré</button>
        )}

        {canExpand && (
          <div className={`bet-chevron${expanded ? ' open' : ''}`}>
            <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        )}
      </div>

      {expanded && (
        <div className="bet-detail">
          <BetDetail race={race} />
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────

export default function BetsPage() {
  const user = useAuthStore((s) => s.user)
  const { activeLeague } = useLeague()
  const [tab, setTab] = useState<Tab>('upcoming')

  const { data: races } = useQuery({
    queryKey: ['races', 'league', activeLeague?.id],
    queryFn: () => racesApi.leagueRaces(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })

  const { data: standings } = useQuery({
    queryKey: ['standings', 'league', activeLeague?.id],
    queryFn: () => standingsApi.league(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  const myStanding = standings?.find((s) => s.userId === user?.id)

  const grouped = useMemo(() => ({
    upcoming: races?.filter((r) => r.status === RaceStatus.UPCOMING) ?? [],
    live:     races?.filter((r) => r.status === RaceStatus.LIVE)     ?? [],
    finished: races?.filter((r) => r.status === RaceStatus.FINISHED) ?? [],
  }), [races])

  const nextRace = grouped.upcoming[0]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: 'À parier' },
    { key: 'live',     label: 'En cours' },
    { key: 'finished', label: 'Résultats' },
  ]

  return (
    <AppShell activePage="bets" pageTitle="Mes pronostics">

      {/* ── Stats ── */}
      <div className="bets-stats">
        <div className="stat-card">
          <div className="stat-label">Mon rang</div>
          <div className={`stat-val${myStanding?.rank === 1 ? ' gold' : ''}`}>
            {myStanding ? `${myStanding.rank}e` : '—'}
          </div>
          <div className="stat-sub">
            sur {activeLeague?.memberCount ?? '—'} joueurs
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Points totaux</div>
          <div className="stat-val">
            {myStanding ? myStanding.totalPoints.toLocaleString('fr-FR') : '—'}
          </div>
          <div className="stat-sub">cette saison</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Courses pariées</div>
          <div className="stat-val">{myStanding?.racesPlayed ?? '—'}</div>
          <div className="stat-sub">
            sur {(grouped.live.length + grouped.finished.length) || '—'} disputées
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Prochaine course</div>
          <div className="stat-val" style={{ fontSize: nextRace ? 14 : 28, lineHeight: nextRace ? 1.3 : 1, marginTop: nextRace ? 4 : 0 }}>
            {nextRace ? nextRace.name : '—'}
          </div>
          <div className="stat-sub">{nextRace ? formatDate(nextRace) : 'Calendrier vide'}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bets-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`bets-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {grouped[t.key].length > 0 && (
              <span className={`bets-tab-count${t.key === 'upcoming' && grouped.upcoming.some(isUrgent) ? ' urgent' : ''}`}>
                {grouped[t.key].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Race list ── */}
      {grouped[tab].length === 0 ? (
        <div className="bets-empty">
          {tab === 'upcoming' && 'Aucune course à venir dans le calendrier.'}
          {tab === 'live' && 'Aucune course en cours actuellement.'}
          {tab === 'finished' && 'Aucune course terminée pour l\'instant.'}
        </div>
      ) : (
        grouped[tab].map((race) => (
          <BetCard key={race.id} race={race} tab={tab} />
        ))
      )}

    </AppShell>
  )
}
