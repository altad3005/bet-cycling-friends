import type Race from '#models/race'
import { RaceStatus } from '@bcf/shared'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class RaceTransformer extends BaseTransformer<Race> {
  toObject() {
    const base = this.pick(this.resource, [
      'id',
      'slug',
      'name',
      'raceType',
      'multiplierType',
      'isGrandTour',
      'stageCount',
      'resultsFinal',
      'startAt',
      'endAt',
      'seasonYear',
    ])
    return { ...base, status: this.resource.status as RaceStatus }
  }
}
