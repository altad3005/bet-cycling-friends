import { BaseMail } from '@adonisjs/mail'

export default class PasswordResetMail extends BaseMail {
  subject = 'Réinitialisation de votre mot de passe — BetCyclingFriends'

  constructor(
    private readonly pseudo: string,
    private readonly email: string,
    private readonly resetUrl: string
  ) {
    super()
  }

  prepare() {
    this.message.to(this.email)
    this.message.html(`
      <p>Bonjour ${this.pseudo},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p><a href="${this.resetUrl}">Cliquez ici pour réinitialiser votre mot de passe</a></p>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `)
  }
}
