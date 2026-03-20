import type Race from '#models/race'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class RaceTransformer extends BaseTransformer<Race> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'slug',
      'name',
      'raceType',
      'multiplierType',
      'isGrandTour',
      'status',
      'resultsFinal',
      'startAt',
      'endAt',
      'seasonYear',
    ])
  }
}
