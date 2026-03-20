import PasswordResetService from '#services/password_reset_service'
import { passwordResetRequestValidator, passwordResetConfirmValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class PasswordResetController {
  async request({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(passwordResetRequestValidator)
    await new PasswordResetService().sendResetLink(email)
    return response.ok({ message: 'Si un compte existe avec cet email, un lien a été envoyé.' })
  }

  async confirm({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(passwordResetConfirmValidator)
    const success = await new PasswordResetService().resetPassword(token, password)
    if (!success) {
      return response.unprocessableEntity({ message: 'Token invalide ou expiré.' })
    }
    return response.ok({ message: 'Mot de passe réinitialisé avec succès.' })
  }
}
