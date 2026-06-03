import type { HttpContext } from '@adonisjs/core/http'

export default class FormController {
  async leagueForm({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { default: FormService } = await import('#services/form_service')
    const races = await new FormService().getUserForm(params.id, user.id)
    return response.ok({ data: { races } })
  }
}
