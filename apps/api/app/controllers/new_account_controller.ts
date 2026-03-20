import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import hash from '@adonisjs/core/services/hash'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const { pseudo, email, password } = await request.validateUsing(signupValidator)

    const user = await User.create({
      pseudo: pseudo ?? undefined,
      email,
      passwordHash: await hash.make(password),
    })
    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
