import vine from '@vinejs/vine'

export const addRaceValidator = vine.create({
  slug: vine.string().trim(),
})
