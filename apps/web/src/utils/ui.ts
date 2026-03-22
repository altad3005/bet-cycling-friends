export const AVATAR_COLORS = [
  { bg: 'rgba(232,201,109,0.15)', color: '#e8c96d' },
  { bg: 'rgba(176,184,200,0.12)', color: '#b0b8c8' },
  { bg: 'rgba(205,127,50,0.15)', color: '#cd7f32' },
  { bg: 'rgba(94,160,220,0.10)', color: '#5ea0dc' },
  { bg: 'rgba(120,180,120,0.10)', color: '#78b478' },
  { bg: 'rgba(200,100,150,0.10)', color: '#c86496' },
  { bg: 'rgba(180,120,220,0.10)', color: '#b478dc' },
  { bg: 'rgba(220,160,80,0.10)', color: '#dca050' },
]

export function initials(pseudo: string) {
  return pseudo
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

export function formatGap(gap: number) {
  if (gap === 0) return '0'
  return gap > 0 ? `+${gap.toLocaleString('fr-FR')}` : `−${Math.abs(gap).toLocaleString('fr-FR')}`
}
