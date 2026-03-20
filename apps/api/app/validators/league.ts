import vine from '@vinejs/vine'

export const createLeagueValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(100),
})

export const updateMemberValidator = vine.create({
  isAdmin: vine.boolean(),
})
