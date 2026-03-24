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
        router.put('/profile', [controllers.Profile, 'update'])
        router.get('/leagues', [controllers.Profile, 'leagues'])
        router.post('/push-subscription', [controllers.PushSubscription, 'store'])
        router.delete('/push-subscription', [controllers.PushSubscription, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router.get('/push/vapid-public-key', [controllers.PushSubscription, 'vapidPublicKey'])

    router
      .group(() => {
        router.post('/', [controllers.League, 'store'])
        router.get('/join/:code', [controllers.League, 'previewJoin'])
        router.post('/join/:code', [controllers.League, 'join'])
        router.get('/:id', [controllers.League, 'show'])
        router.delete('/:id/leave', [controllers.League, 'leave'])
        router.delete('/:id', [controllers.League, 'destroy'])
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

    router
      .group(() => {
        router.get('/:id/startlist', [controllers.Race, 'startlist'])
        router.get('/:id/stages', [controllers.Race, 'stages'])
        router.get('/:id/results', [controllers.Race, 'results'])
        router.get('/:id/bet', [controllers.Bet, 'show'])
        router.post('/:id/bet', [controllers.Bet, 'storeClassic'])
        router.post('/:id/bet/grandtour', [controllers.Bet, 'storeGrandTour'])
      })
      .prefix('races')
      .use(middleware.auth())

    router
      .get('/leagues/:id/races/:raceId/bets', [controllers.Bet, 'leagueBets'])
      .use(middleware.auth())

    router
      .get('/leagues/:id/stats', [controllers.Stats, 'leagueStats'])
      .use(middleware.auth())

    router
      .get('/leagues/:id/feed', [controllers.Feed, 'leagueFeed'])
      .use(middleware.auth())

    router
      .get('/leagues/:id/members/:userId/profile', [controllers.MemberProfile, 'show'])
      .use(middleware.auth())

    router
      .group(() => {
        router.get('/:id/standings', [controllers.Standings, 'leagueStandings'])
        router.get('/:id/races/:raceId/standings', [controllers.Standings, 'raceStandings'])
        router.get('/:id/races/:raceId/stage/:n/standings', [controllers.Standings, 'stageStandings'])
      })
      .prefix('leagues')
      .use(middleware.auth())

    router.get('/standings/global', [controllers.Standings, 'globalStandings'])

    router
      .post('/admin/races/:id/sync', [controllers.RaceSync, 'sync'])
      .use(middleware.auth())

  })
  .prefix('/api')
