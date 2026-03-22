import { MultiplierType, RaceStatus } from '@bcf/shared'
import type { RaceResponse } from '../../api/races'

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

const TYPE_LABEL: Partial<Record<string, string>> = {
  monument:   'Monument',
  wt_classic: 'Classique',
  stage_race: 'Étapes',
}

export function raceDot(status: RaceStatus): 'live' | 'upcoming' | 'done' {
  if (status === RaceStatus.LIVE)     return 'live'
  if (status === RaceStatus.FINISHED) return 'done'
  return 'upcoming'
}

export function raceMultDisplay(race: RaceResponse): { mult: string; multClass: string } {
  if (race.isGrandTour) return { mult: 'GT', multClass: 'x1' }
  switch (race.multiplierType) {
    case MultiplierType.MONUMENT:   return { mult: '×2',   multClass: 'x2'  }
    case MultiplierType.WT_CLASSIC: return { mult: '×1,5', multClass: 'x15' }
    default:                        return { mult: '×1',   multClass: 'x1'  }
  }
}

export function raceDateLabel(race: RaceResponse): string {
  const dot = raceDot(race.status)
  const typeLabel = race.isGrandTour ? 'Grand Tour' : (TYPE_LABEL[race.multiplierType] ?? '')

  if (dot === 'done') {
    if (race.startAt) {
      const d = new Date(race.startAt)
      return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} · Terminé`
    }
    return 'Terminé'
  }

  if (dot === 'live') return `En cours · ${typeLabel}`

  if (race.startAt) {
    const d = new Date(race.startAt)
    return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} · ${typeLabel}`
  }
  return typeLabel
}
