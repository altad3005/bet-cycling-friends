import { useQuery } from '@tanstack/react-query'
import { formApi } from '../../api/form'
import { useLeague } from '../../hooks/useLeague'

const UP = '#82c99a'
const DOWN = '#f0816a'
const POINTS_COLOR = '#5b9cf6'
const RANK_COLOR = '#e8c96d'
const MUTED = 'rgba(240,237,232,0.4)'

function ordinal(rank: number): string {
  return rank === 1 ? '1er' : `${rank}e`
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <span style={{ color: MUTED, fontSize: 12 }}>=</span>
  const good = value > 0
  return (
    <span style={{ color: good ? UP : DOWN, fontSize: 12, fontWeight: 600 }}>
      {good ? '▲+' : '▼'}
      {value}
    </span>
  )
}

function PointsBars({ points }: { points: number[] }) {
  const W = 120
  const H = 36
  const gap = 4
  const n = points.length
  const barW = (W - gap * (n - 1)) / n
  const max = Math.max(...points, 1)
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {points.map((p, i) => {
        const h = Math.max(2, (p / max) * H)
        return <rect key={i} x={i * (barW + gap)} y={H - h} width={barW} height={h} rx={2} fill={POINTS_COLOR} />
      })}
    </svg>
  )
}

function RankLine({ ranks }: { ranks: number[] }) {
  const W = 120
  const H = 36
  const pad = 4
  const n = ranks.length
  const min = Math.min(...ranks)
  const max = Math.max(...ranks)
  const span = max - min || 1
  const x = (i: number) => (n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1))
  const y = (r: number) => pad + ((r - min) / span) * (H - 2 * pad)
  const pts = ranks.map((r, i) => `${x(i)},${y(r)}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {n > 1 && (
        <polyline points={pts} fill="none" stroke={RANK_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {ranks.map((r, i) => (
        <circle key={i} cx={x(i)} cy={y(r)} r={3} fill={RANK_COLOR} />
      ))}
    </svg>
  )
}

export default function FormPanel() {
  const { activeLeague } = useLeague()

  const { data: races = [], isLoading } = useQuery({
    queryKey: ['form', 'league', activeLeague?.id],
    queryFn: () => formApi.league(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })

  const points = races.map((e) => e.points)
  const ranks = races.map((e) => e.rank)
  const last = races[races.length - 1]
  const prev = races[races.length - 2]
  const pointsDelta = last && prev ? last.points - prev.points : 0
  const rankDelta = last && prev ? prev.rank - last.rank : 0

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Ma forme</div>
      </div>

      {isLoading ? (
        <div style={{ padding: '1.5rem 1.25rem', textAlign: 'center', fontSize: 13, color: MUTED }}>Chargement…</div>
      ) : races.length === 0 ? (
        <div style={{ padding: '1.5rem 1.25rem', textAlign: 'center', fontSize: 13, color: MUTED }}>
          Pas encore de résultats cette saison.
        </div>
      ) : (
        <div style={{ padding: '0.5rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Points · {races.length} dernières courses</div>
              <PointsBars points={points} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8' }}>{last.points} pts</div>
              <Delta value={pointsDelta} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Rang ligue · plus haut = mieux</div>
              <RankLine ranks={ranks} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8' }}>{ordinal(last.rank)}</div>
              <Delta value={rankDelta} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
