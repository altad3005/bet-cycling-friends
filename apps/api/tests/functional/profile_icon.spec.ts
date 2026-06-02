import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'

test.group('Profile icon update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createUser() {
    return User.create({
      email: `u${Date.now()}@test.dev`,
      pseudo: 'Tester',
      passwordHash: await hash.make('password123'),
    })
  }

  test('updates the icon with a valid value', async ({ client, assert }) => {
    const user = await createUser()

    const response = await client
      .put('/api/account/profile')
      .json({ pseudo: 'Tester', icon: 'jersey-yellow' })
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { icon: 'jersey-yellow' } })

    await user.refresh()
    assert.equal(user.icon, 'jersey-yellow')
  })

  test('rejects an unknown icon value', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .put('/api/account/profile')
      .json({ pseudo: 'Tester', icon: 'not-a-real-icon' })
      .loginAs(user)

    response.assertStatus(422)
  })
})
