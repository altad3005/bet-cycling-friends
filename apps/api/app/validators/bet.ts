import vine from '@vinejs/vine'
import { GRAND_TOUR_TEAM_SIZE } from '@bcf/shared'

export const betClassicValidator = vine.create({
  favoriteRiderId: vine.string().uuid(),
  bonusRiderId: vine.string().uuid(),
})

export const betGrandTourValidator = vine.create({
  riderIds: vine
    .array(vine.string().uuid())
    .minLength(GRAND_TOUR_TEAM_SIZE)
    .maxLength(GRAND_TOUR_TEAM_SIZE),
})
