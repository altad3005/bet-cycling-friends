/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessToken, 'store'])
        router.post('logout', [controllers.AccessToken, 'destroy']).use(middleware.auth())
        router.get('google/redirect', [controllers.GoogleAuth, 'redirect'])
        router.get('google/callback', [controllers.GoogleAuth, 'callback'])
        router.post('password-reset/request', [controllers.PasswordReset, 'request'])
        router.post('password-reset/confirm', [controllers.PasswordReset, 'confirm'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('/profile', [controllers.Profile, 'show'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.post('/', [controllers.League, 'store'])
        router.get('/join/:code', [controllers.League, 'previewJoin'])
        router.post('/join/:code', [controllers.League, 'join'])
        router.get('/:id', [controllers.League, 'show'])
        router.delete('/:id/leave', [controllers.League, 'leave'])
        router.get('/:id/members', [controllers.LeagueMember, 'index'])
        router.patch('/:id/members/:userId', [controllers.LeagueMember, 'update'])
        router.delete('/:id/members/:userId', [controllers.LeagueMember, 'destroy'])
        router.get('/:id/races', [controllers.LeagueRace, 'index'])
        router.post('/:id/races', [controllers.LeagueRace, 'store'])
        router.delete('/:id/races/:raceId', [controllers.LeagueRace, 'destroy'])
      })
      .prefix('leagues')
      .use(middleware.auth())

    router.get('/races/preview', [controllers.Race, 'preview']).use(middleware.auth())
  })
  .prefix('/api')
