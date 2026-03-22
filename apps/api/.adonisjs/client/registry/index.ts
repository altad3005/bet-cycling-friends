/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/auth/signup',
    tokens: [{"old":"/api/auth/signup","type":0,"val":"api","end":""},{"old":"/api/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_token.store': {
    methods: ["POST"],
    pattern: '/api/auth/login',
    tokens: [{"old":"/api/auth/login","type":0,"val":"api","end":""},{"old":"/api/auth/login","type":0,"val":"auth","end":""},{"old":"/api/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_token.store']['types'],
  },
  'auth.access_token.destroy': {
    methods: ["POST"],
    pattern: '/api/auth/logout',
    tokens: [{"old":"/api/auth/logout","type":0,"val":"api","end":""},{"old":"/api/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.access_token.destroy']['types'],
  },
  'auth.google_auth.redirect': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/google/redirect',
    tokens: [{"old":"/api/auth/google/redirect","type":0,"val":"api","end":""},{"old":"/api/auth/google/redirect","type":0,"val":"auth","end":""},{"old":"/api/auth/google/redirect","type":0,"val":"google","end":""},{"old":"/api/auth/google/redirect","type":0,"val":"redirect","end":""}],
    types: placeholder as Registry['auth.google_auth.redirect']['types'],
  },
  'auth.google_auth.callback': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/google/callback',
    tokens: [{"old":"/api/auth/google/callback","type":0,"val":"api","end":""},{"old":"/api/auth/google/callback","type":0,"val":"auth","end":""},{"old":"/api/auth/google/callback","type":0,"val":"google","end":""},{"old":"/api/auth/google/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['auth.google_auth.callback']['types'],
  },
  'auth.password_reset.request': {
    methods: ["POST"],
    pattern: '/api/auth/password-reset/request',
    tokens: [{"old":"/api/auth/password-reset/request","type":0,"val":"api","end":""},{"old":"/api/auth/password-reset/request","type":0,"val":"auth","end":""},{"old":"/api/auth/password-reset/request","type":0,"val":"password-reset","end":""},{"old":"/api/auth/password-reset/request","type":0,"val":"request","end":""}],
    types: placeholder as Registry['auth.password_reset.request']['types'],
  },
  'auth.password_reset.confirm': {
    methods: ["POST"],
    pattern: '/api/auth/password-reset/confirm',
    tokens: [{"old":"/api/auth/password-reset/confirm","type":0,"val":"api","end":""},{"old":"/api/auth/password-reset/confirm","type":0,"val":"auth","end":""},{"old":"/api/auth/password-reset/confirm","type":0,"val":"password-reset","end":""},{"old":"/api/auth/password-reset/confirm","type":0,"val":"confirm","end":""}],
    types: placeholder as Registry['auth.password_reset.confirm']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/account/profile',
    tokens: [{"old":"/api/account/profile","type":0,"val":"api","end":""},{"old":"/api/account/profile","type":0,"val":"account","end":""},{"old":"/api/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.profile.update': {
    methods: ["PUT"],
    pattern: '/api/account/profile',
    tokens: [{"old":"/api/account/profile","type":0,"val":"api","end":""},{"old":"/api/account/profile","type":0,"val":"account","end":""},{"old":"/api/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.update']['types'],
  },
  'profile.profile.leagues': {
    methods: ["GET","HEAD"],
    pattern: '/api/account/leagues',
    tokens: [{"old":"/api/account/leagues","type":0,"val":"api","end":""},{"old":"/api/account/leagues","type":0,"val":"account","end":""},{"old":"/api/account/leagues","type":0,"val":"leagues","end":""}],
    types: placeholder as Registry['profile.profile.leagues']['types'],
  },
  'league.store': {
    methods: ["POST"],
    pattern: '/api/leagues',
    tokens: [{"old":"/api/leagues","type":0,"val":"api","end":""},{"old":"/api/leagues","type":0,"val":"leagues","end":""}],
    types: placeholder as Registry['league.store']['types'],
  },
  'league.preview_join': {
    methods: ["GET","HEAD"],
    pattern: '/api/leagues/join/:code',
    tokens: [{"old":"/api/leagues/join/:code","type":0,"val":"api","end":""},{"old":"/api/leagues/join/:code","type":0,"val":"leagues","end":""},{"old":"/api/leagues/join/:code","type":0,"val":"join","end":""},{"old":"/api/leagues/join/:code","type":1,"val":"code","end":""}],
    types: placeholder as Registry['league.preview_join']['types'],
  },
  'league.join': {
    methods: ["POST"],
    pattern: '/api/leagues/join/:code',
    tokens: [{"old":"/api/leagues/join/:code","type":0,"val":"api","end":""},{"old":"/api/leagues/join/:code","type":0,"val":"leagues","end":""},{"old":"/api/leagues/join/:code","type":0,"val":"join","end":""},{"old":"/api/leagues/join/:code","type":1,"val":"code","end":""}],
    types: placeholder as Registry['league.join']['types'],
  },
  'league.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/leagues/:id',
    tokens: [{"old":"/api/leagues/:id","type":0,"val":"api","end":""},{"old":"/api/leagues/:id","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['league.show']['types'],
  },
  'league.leave': {
    methods: ["DELETE"],
    pattern: '/api/leagues/:id/leave',
    tokens: [{"old":"/api/leagues/:id/leave","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/leave","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/leave","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/leave","type":0,"val":"leave","end":""}],
    types: placeholder as Registry['league.leave']['types'],
  },
  'league_member.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/leagues/:id/members',
    tokens: [{"old":"/api/leagues/:id/members","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/members","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/members","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/members","type":0,"val":"members","end":""}],
    types: placeholder as Registry['league_member.index']['types'],
  },
  'league_member.update': {
    methods: ["PATCH"],
    pattern: '/api/leagues/:id/members/:userId',
    tokens: [{"old":"/api/leagues/:id/members/:userId","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/members/:userId","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/members/:userId","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/members/:userId","type":0,"val":"members","end":""},{"old":"/api/leagues/:id/members/:userId","type":1,"val":"userId","end":""}],
    types: placeholder as Registry['league_member.update']['types'],
  },
  'league_member.destroy': {
    methods: ["DELETE"],
    pattern: '/api/leagues/:id/members/:userId',
    tokens: [{"old":"/api/leagues/:id/members/:userId","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/members/:userId","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/members/:userId","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/members/:userId","type":0,"val":"members","end":""},{"old":"/api/leagues/:id/members/:userId","type":1,"val":"userId","end":""}],
    types: placeholder as Registry['league_member.destroy']['types'],
  },
  'league_race.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/leagues/:id/races',
    tokens: [{"old":"/api/leagues/:id/races","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/races","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/races","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/races","type":0,"val":"races","end":""}],
    types: placeholder as Registry['league_race.index']['types'],
  },
  'league_race.store': {
    methods: ["POST"],
    pattern: '/api/leagues/:id/races',
    tokens: [{"old":"/api/leagues/:id/races","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/races","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/races","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/races","type":0,"val":"races","end":""}],
    types: placeholder as Registry['league_race.store']['types'],
  },
  'league_race.destroy': {
    methods: ["DELETE"],
    pattern: '/api/leagues/:id/races/:raceId',
    tokens: [{"old":"/api/leagues/:id/races/:raceId","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/races/:raceId","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/races/:raceId","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/races/:raceId","type":0,"val":"races","end":""},{"old":"/api/leagues/:id/races/:raceId","type":1,"val":"raceId","end":""}],
    types: placeholder as Registry['league_race.destroy']['types'],
  },
  'race.preview': {
    methods: ["GET","HEAD"],
    pattern: '/api/races/preview',
    tokens: [{"old":"/api/races/preview","type":0,"val":"api","end":""},{"old":"/api/races/preview","type":0,"val":"races","end":""},{"old":"/api/races/preview","type":0,"val":"preview","end":""}],
    types: placeholder as Registry['race.preview']['types'],
  },
  'race.startlist': {
    methods: ["GET","HEAD"],
    pattern: '/api/races/:id/startlist',
    tokens: [{"old":"/api/races/:id/startlist","type":0,"val":"api","end":""},{"old":"/api/races/:id/startlist","type":0,"val":"races","end":""},{"old":"/api/races/:id/startlist","type":1,"val":"id","end":""},{"old":"/api/races/:id/startlist","type":0,"val":"startlist","end":""}],
    types: placeholder as Registry['race.startlist']['types'],
  },
  'bet.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/races/:id/bet',
    tokens: [{"old":"/api/races/:id/bet","type":0,"val":"api","end":""},{"old":"/api/races/:id/bet","type":0,"val":"races","end":""},{"old":"/api/races/:id/bet","type":1,"val":"id","end":""},{"old":"/api/races/:id/bet","type":0,"val":"bet","end":""}],
    types: placeholder as Registry['bet.show']['types'],
  },
  'bet.store_classic': {
    methods: ["POST"],
    pattern: '/api/races/:id/bet',
    tokens: [{"old":"/api/races/:id/bet","type":0,"val":"api","end":""},{"old":"/api/races/:id/bet","type":0,"val":"races","end":""},{"old":"/api/races/:id/bet","type":1,"val":"id","end":""},{"old":"/api/races/:id/bet","type":0,"val":"bet","end":""}],
    types: placeholder as Registry['bet.store_classic']['types'],
  },
  'bet.store_grand_tour': {
    methods: ["POST"],
    pattern: '/api/races/:id/bet/grandtour',
    tokens: [{"old":"/api/races/:id/bet/grandtour","type":0,"val":"api","end":""},{"old":"/api/races/:id/bet/grandtour","type":0,"val":"races","end":""},{"old":"/api/races/:id/bet/grandtour","type":1,"val":"id","end":""},{"old":"/api/races/:id/bet/grandtour","type":0,"val":"bet","end":""},{"old":"/api/races/:id/bet/grandtour","type":0,"val":"grandtour","end":""}],
    types: placeholder as Registry['bet.store_grand_tour']['types'],
  },
  'bet.league_bets': {
    methods: ["GET","HEAD"],
    pattern: '/api/leagues/:id/races/:raceId/bets',
    tokens: [{"old":"/api/leagues/:id/races/:raceId/bets","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/races/:raceId/bets","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/races/:raceId/bets","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/races/:raceId/bets","type":0,"val":"races","end":""},{"old":"/api/leagues/:id/races/:raceId/bets","type":1,"val":"raceId","end":""},{"old":"/api/leagues/:id/races/:raceId/bets","type":0,"val":"bets","end":""}],
    types: placeholder as Registry['bet.league_bets']['types'],
  },
  'standings.league_standings': {
    methods: ["GET","HEAD"],
    pattern: '/api/leagues/:id/standings',
    tokens: [{"old":"/api/leagues/:id/standings","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/standings","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/standings","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/standings","type":0,"val":"standings","end":""}],
    types: placeholder as Registry['standings.league_standings']['types'],
  },
  'standings.race_standings': {
    methods: ["GET","HEAD"],
    pattern: '/api/leagues/:id/races/:raceId/standings',
    tokens: [{"old":"/api/leagues/:id/races/:raceId/standings","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/races/:raceId/standings","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/races/:raceId/standings","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/races/:raceId/standings","type":0,"val":"races","end":""},{"old":"/api/leagues/:id/races/:raceId/standings","type":1,"val":"raceId","end":""},{"old":"/api/leagues/:id/races/:raceId/standings","type":0,"val":"standings","end":""}],
    types: placeholder as Registry['standings.race_standings']['types'],
  },
  'standings.stage_standings': {
    methods: ["GET","HEAD"],
    pattern: '/api/leagues/:id/races/:raceId/stage/:n/standings',
    tokens: [{"old":"/api/leagues/:id/races/:raceId/stage/:n/standings","type":0,"val":"api","end":""},{"old":"/api/leagues/:id/races/:raceId/stage/:n/standings","type":0,"val":"leagues","end":""},{"old":"/api/leagues/:id/races/:raceId/stage/:n/standings","type":1,"val":"id","end":""},{"old":"/api/leagues/:id/races/:raceId/stage/:n/standings","type":0,"val":"races","end":""},{"old":"/api/leagues/:id/races/:raceId/stage/:n/standings","type":1,"val":"raceId","end":""},{"old":"/api/leagues/:id/races/:raceId/stage/:n/standings","type":0,"val":"stage","end":""},{"old":"/api/leagues/:id/races/:raceId/stage/:n/standings","type":1,"val":"n","end":""},{"old":"/api/leagues/:id/races/:raceId/stage/:n/standings","type":0,"val":"standings","end":""}],
    types: placeholder as Registry['standings.stage_standings']['types'],
  },
  'standings.global_standings': {
    methods: ["GET","HEAD"],
    pattern: '/api/standings/global',
    tokens: [{"old":"/api/standings/global","type":0,"val":"api","end":""},{"old":"/api/standings/global","type":0,"val":"standings","end":""},{"old":"/api/standings/global","type":0,"val":"global","end":""}],
    types: placeholder as Registry['standings.global_standings']['types'],
  },
  'race_sync.sync': {
    methods: ["POST"],
    pattern: '/api/admin/races/:id/sync',
    tokens: [{"old":"/api/admin/races/:id/sync","type":0,"val":"api","end":""},{"old":"/api/admin/races/:id/sync","type":0,"val":"admin","end":""},{"old":"/api/admin/races/:id/sync","type":0,"val":"races","end":""},{"old":"/api/admin/races/:id/sync","type":1,"val":"id","end":""},{"old":"/api/admin/races/:id/sync","type":0,"val":"sync","end":""}],
    types: placeholder as Registry['race_sync.sync']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
