import env from '#start/env'
import GoogleAuthService from '#services/google_auth_service'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class GoogleAuthController {
  async redirect({ ally }: HttpContext) {
    return ally.use('google').redirect()
  }

  async callback({ ally, response }: HttpContext) {
    const google = ally.use('google')
    const frontendUrl = env.get('FRONTEND_URL')

    if (google.accessDenied() || google.stateMisMatch() || google.hasError()) {
      return response.redirect(`${frontendUrl}/login?error=oauth_failed`)
    }

    const googleUser = await google.user()
    const service = new GoogleAuthService()
    const user = await service.findOrCreateUser({
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
    })

    const token = await User.accessTokens.create(user)
    return response.redirect(`${frontendUrl}/auth/callback?token=${token.value!.release()}`)
  }
}
