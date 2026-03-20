import env from '#start/env'
import User from '#models/user'
import PasswordResetMail from '#mails/password_reset_mail'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import db from '@adonisjs/lucid/services/db'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'

export default class PasswordResetService {
  async sendResetLink(email: string): Promise<void> {
    const user = await User.findBy('email', email)
    if (!user) return

    await db.from('password_reset_tokens').where('email', email).delete()

    const token = randomBytes(32).toString('hex')
    await db.table('password_reset_tokens').insert({
      email,
      token,
      expires_at: DateTime.now().plus({ hours: 1 }).toJSDate(),
      created_at: new Date(),
    })

    const resetUrl = `${env.get('FRONTEND_URL')}/reset-password?token=${token}`
    await mail.send(new PasswordResetMail(user.pseudo, user.email, resetUrl))
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const record = await db
      .from('password_reset_tokens')
      .where('token', token)
      .where('expires_at', '>', new Date())
      .first()

    if (!record) return false

    const user = await User.findByOrFail('email', record.email)
    user.passwordHash = await hash.make(newPassword)
    await user.save()

    await db.from('password_reset_tokens').where('token', token).delete()
    return true
  }
}
