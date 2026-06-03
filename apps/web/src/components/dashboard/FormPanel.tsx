import { useQuery } from '@tanstack/react-query'
import { formApi } from '../../api/form'
import { useLeague } from '../../hooks/useLeague'

const UP = '#82c99a'
const DOWN = '#f0816a'
const POINTS_COLOR = '#5b9cf6'
const MUTED = 'rgba(240,237,232,0.4)'

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

export default function FormPanel() {
  const { activeLeague } = useLeague()

  const { data: races = [], isLoading } = useQuery({
    queryKey: ['form', 'league', activeLeague?.id],
    queryFn: () => formApi.league(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })

  const points = races.map((e) => e.points)
  const last = races[races.length - 1]
  const prev = races[races.length - 2]
  const pointsDelta = last && prev ? last.points - prev.points : 0

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
        <div style={{ padding: '0.5rem 1.25rem 1rem' }}>
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
        </div>
      )}
    </div>
  )
}
