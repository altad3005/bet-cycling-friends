import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RaceStatus } from '@bcf/shared'
import { racesApi, type RaceResponse } from '../api/races'
import { useLeague } from '../hooks/useLeague'
import AppShell from '../components/AppShell'
import './CalendarPage.css'

type Filter = 'all' | 'upcoming' | 'live' | 'finished'

// ── Helpers ────────────────────────────────────────

const MONTH_FORMATTER = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const DATE_FORMATTER   = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

function formatDate(race: RaceResponse): string {
  if (!race.startAt) return '—'
  const start = new Date(race.startAt)
  if (!race.endAt) return DATE_FORMATTER.format(start)
  const end = new Date(race.endAt)
  const sameMonth = start.getMonth() === end.getMonth()
  if (sameMonth) {
    return `${start.getDate()}–${DATE_FORMATTER.format(end)}`
  }
  return `${DATE_FORMATTER.format(start)} – ${DATE_FORMATTER.format(end)}`
}

function monthKey(race: RaceResponse): string {
  if (!race.startAt) return 'Sans date'
  const d = new Date(race.startAt)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  if (key === 'Sans date') return key
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return MONTH_FORMATTER.format(d).replace(/^./, (c) => c.toUpperCase())
}

function typeLabel(race: RaceResponse): { label: string; cls: string } {
  if (race.raceType === 'classic') {
    if (race.multiplierType === 'monument')   return { label: 'Monument',   cls: 'monument' }
    if (race.multiplierType === 'wt_classic') return { label: 'WorldTour',  cls: 'wt-classic' }
    return { label: 'Classique', cls: 'classic' }
  }
  switch (race.raceType) {
    case 'grand_tour': return { label: 'Grand Tour',      cls: 'grand-tour' }
    case 'stage_race': return { label: 'Tour par étapes', cls: 'stage-race' }
    case 'national':   return { label: 'National',        cls: 'national' }
    case 'worlds':     return { label: 'Championnats',    cls: 'worlds' }
    default:           return { label: race.raceType,     cls: 'national' }
  }
}

function multBadge(race: RaceResponse): { label: string; cls: string } {
  switch (race.multiplierType) {
    case 'monument':    return { label: '×2,0', cls: 'monument' }
    case 'wt_classic':  return { label: '×1,5', cls: 'wt-classic' }
    case 'stage_race':  return { label: '×1,0', cls: 'stage-race' }
    case 'gt_stage':
    case 'gt_gc':       return { label: 'GT',   cls: 'gt' }
    default:            return { label: '×1,0', cls: 'stage-race' }
  }
}

function actionProps(race: RaceResponse): { label: string; cls: string } {
  if (race.status === RaceStatus.LIVE)     return { label: 'En cours', cls: 'live' }
  if (race.status === RaceStatus.FINISHED) return { label: race.resultsFinal ? 'Scoré' : 'Terminé', cls: 'done' }
  return { label: 'Parier', cls: 'bet' }
}

// ── Component ──────────────────────────────────────

export default function CalendarPage() {
  const { activeLeague } = useLeague()
  const [filter, setFilter] = useState<Filter>('all')

  const { data: races, isLoading } = useQuery({
    queryKey: ['races', 'league', activeLeague?.id],
    queryFn: () => racesApi.leagueRaces(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })

  const filtered = useMemo(() => {
    if (!races) return []
    if (filter === 'all') return races
    return races.filter((r) => r.status === filter)
  }, [races, filter])

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, RaceResponse[]>()
    for (const race of filtered) {
      const key = monthKey(race)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(race)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const counts = useMemo(() => ({
    all:      races?.length ?? 0,
    upcoming: races?.filter((r) => r.status === RaceStatus.UPCOMING).length ?? 0,
    live:     races?.filter((r) => r.status === RaceStatus.LIVE).length    ?? 0,
    finished: races?.filter((r) => r.status === RaceStatus.FINISHED).length ?? 0,
  }), [races])

  const TABS: { key: Filter; label: string; count: number }[] = [
    { key: 'all',      label: 'Toutes',    count: counts.all },
    { key: 'upcoming', label: 'À venir',   count: counts.upcoming },
    { key: 'live',     label: 'En cours',  count: counts.live },
    { key: 'finished', label: 'Terminées', count: counts.finished },
  ]

  return (
    <AppShell
      activePage="calendar"
      pageTitle="Calendrier"
      topbarRight={
        activeLeague && (
          <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.3)', letterSpacing: '0.5px' }}>
            {activeLeague.name}
          </span>
        )
      }
    >
      {/* Filter tabs */}
      <div className="cal-filters">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`cal-tab${filter === t.key ? ' active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            {t.count > 0 && <span className="cal-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="cal-empty">Chargement…</div>
      ) : !activeLeague ? (
        <div className="cal-empty">Rejoins ou crée une ligue pour voir son calendrier.</div>
      ) : grouped.length === 0 ? (
        <div className="cal-empty">Aucune course dans cette catégorie.</div>
      ) : (
        grouped.map(([key, monthRaces]) => (
          <div key={key} className="cal-month">
            <div className="cal-month-label">{monthLabel(key)}</div>

            {monthRaces.map((race) => {
              const type   = typeLabel(race)
              const mult   = multBadge(race)
              const action = actionProps(race)
              const isDone = race.status === RaceStatus.FINISHED

              return (
                <div key={race.id} className={`cal-row${race.status === RaceStatus.LIVE ? ' live' : ''}`}>
                  <div className={`cal-dot ${race.status}`} />

                  <div className="cal-info">
                    <div className={`cal-name${isDone ? ' dim' : ''}`}>{race.name}</div>
                    <div className="cal-meta">{formatDate(race)}</div>
                  </div>

                  <div className={`cal-type ${type.cls}`}>{type.label}</div>
                  <div className={`cal-mult ${mult.cls}`}>{mult.label}</div>

                  <button className={`cal-action ${action.cls}`} disabled={action.cls !== 'bet'}>
                    {action.label}
                  </button>
                </div>
              )
            })}
          </div>
        ))
      )}
    </AppShell>
  )
}
