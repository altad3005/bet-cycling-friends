/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessToken: {
      store: typeof routes['auth.access_token.store']
      destroy: typeof routes['auth.access_token.destroy']
    }
    googleAuth: {
      redirect: typeof routes['auth.google_auth.redirect']
      callback: typeof routes['auth.google_auth.callback']
    }
    passwordReset: {
      request: typeof routes['auth.password_reset.request']
      confirm: typeof routes['auth.password_reset.confirm']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
      update: typeof routes['profile.profile.update']
      leagues: typeof routes['profile.profile.leagues']
    }
    pushSubscription: {
      store: typeof routes['profile.push_subscription.store']
      destroy: typeof routes['profile.push_subscription.destroy']
    }
  }
  pushSubscription: {
    vapidPublicKey: typeof routes['push_subscription.vapid_public_key']
  }
  league: {
    store: typeof routes['league.store']
    previewJoin: typeof routes['league.preview_join']
    join: typeof routes['league.join']
    show: typeof routes['league.show']
    leave: typeof routes['league.leave']
    destroy: typeof routes['league.destroy']
  }
  leagueMember: {
    index: typeof routes['league_member.index']
    update: typeof routes['league_member.update']
    destroy: typeof routes['league_member.destroy']
  }
  leagueRace: {
    index: typeof routes['league_race.index']
    store: typeof routes['league_race.store']
    destroy: typeof routes['league_race.destroy']
  }
  race: {
    preview: typeof routes['race.preview']
    startlist: typeof routes['race.startlist']
    stages: typeof routes['race.stages']
    results: typeof routes['race.results']
  }
  bet: {
    show: typeof routes['bet.show']
    storeClassic: typeof routes['bet.store_classic']
    storeGrandTour: typeof routes['bet.store_grand_tour']
    leagueBets: typeof routes['bet.league_bets']
  }
  standings: {
    leagueStandings: typeof routes['standings.league_standings']
    raceStandings: typeof routes['standings.race_standings']
    stageStandings: typeof routes['standings.stage_standings']
    globalStandings: typeof routes['standings.global_standings']
  }
  raceSync: {
    sync: typeof routes['race_sync.sync']
  }
}
