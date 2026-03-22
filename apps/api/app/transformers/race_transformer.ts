import type Race from '#models/race'
import { RaceStatus } from '@bcf/shared'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { DateTime } from 'luxon'

function computeStatus(race: Race): RaceStatus {
  const now = DateTime.now()
  if (race.endAt && race.endAt < now) return RaceStatus.FINISHED
  if (race.startAt && race.startAt < now) return RaceStatus.LIVE
  return RaceStatus.UPCOMING
}

export default class RaceTransformer extends BaseTransformer<Race> {
  toObject() {
    const base = this.pick(this.resource, [
      'id',
      'slug',
      'name',
      'raceType',
      'multiplierType',
      'isGrandTour',
      'resultsFinal',
      'startAt',
      'endAt',
      'seasonYear',
    ])
    return { ...base, status: computeStatus(this.resource) }
  }
}
