interface Props {
  delta?: number | null
}

const BASE_STYLE = { marginLeft: 6, fontSize: 11, fontWeight: 600 } as const

export default function RankDelta({ delta }: Props) {
  if (delta && delta > 0) {
    return <span style={{ ...BASE_STYLE, color: '#82c99a' }}>▲{delta}</span>
  }
  if (delta && delta < 0) {
    return <span style={{ ...BASE_STYLE, color: '#f0816a' }}>▼{Math.abs(delta)}</span>
  }
  return <span style={{ ...BASE_STYLE, color: 'rgba(240,237,232,0.3)' }}>–</span>
}
