import User from '#models/user'

export default class GoogleAuthService {
  async findOrCreateUser(googleUser: {
    id: string
    email: string | null
    name: string | null
  }): Promise<{ user: User; isNew: boolean }> {
    let user = await User.findBy('google_id', googleUser.id)

    if (!user && googleUser.email) {
      user = await User.findBy('email', googleUser.email)
      if (user) {
        user.googleId = googleUser.id
        await user.save()
        return { user, isNew: false }
      }
    }

    if (!user) {
      const pseudo = await this.generateUniquePseudo(
        googleUser.name ?? googleUser.email?.split('@')[0] ?? 'rider'
      )
      user = await User.create({
        email: googleUser.email!,
        googleId: googleUser.id,
        pseudo,
      })
      return { user, isNew: true }
    }

    return { user, isNew: false }
  }

  private async generateUniquePseudo(base: string): Promise<string> {
    const slug = base
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 45)

    let pseudo = slug
    let exists = await User.findBy('pseudo', pseudo)
    let attempt = 1

    while (exists) {
      pseudo = `${slug}_${attempt}`
      exists = await User.findBy('pseudo', pseudo)
      attempt++
    }

    return pseudo
  }
}
