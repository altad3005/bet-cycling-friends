import Race from '#models/race'
import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'

const updateStartTimeValidator = vine.compile(
  vine.object({
    startAt: vine.string().trim(),
  })
)

export default class RaceStartTimeController {
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (!user.isSuperAdmin) {
      throw new Exception('Accès réservé au super administrateur.', { status: 403 })
    }

    const race = await Race.findOrFail(params.id)
    const { startAt } = await request.validateUsing(updateStartTimeValidator)

    const parsed = DateTime.fromISO(startAt, { zone: 'utc' })
    if (!parsed.isValid) {
      throw new Exception('Date invalide.', { status: 422 })
    }

    race.startAt = parsed
    await race.save()

    return response.ok({ data: { startAt: race.startAt } })
  }
}
