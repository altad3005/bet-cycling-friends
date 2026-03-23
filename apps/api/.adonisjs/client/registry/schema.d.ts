/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.new_account.store': {
    methods: ["POST"]
    pattern: '/api/auth/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_token.store': {
    methods: ["POST"]
    pattern: '/api/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_token_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_token_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_token.destroy': {
    methods: ["POST"]
    pattern: '/api/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_token_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_token_controller').default['destroy']>>>
    }
  }
  'auth.google_auth.redirect': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/google/redirect'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/google_auth_controller').default['redirect']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/google_auth_controller').default['redirect']>>>
    }
  }
  'auth.google_auth.callback': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/google/callback'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/google_auth_controller').default['callback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/google_auth_controller').default['callback']>>>
    }
  }
  'auth.password_reset.request': {
    methods: ["POST"]
    pattern: '/api/auth/password-reset/request'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').passwordResetRequestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').passwordResetRequestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['request']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['request']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.password_reset.confirm': {
    methods: ["POST"]
    pattern: '/api/auth/password-reset/confirm'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').passwordResetConfirmValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').passwordResetConfirmValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['confirm']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['confirm']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.profile.update': {
    methods: ["PUT"]
    pattern: '/api/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['update']>>>
    }
  }
  'profile.profile.leagues': {
    methods: ["GET","HEAD"]
    pattern: '/api/account/leagues'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['leagues']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['leagues']>>>
    }
  }
  'profile.push_subscription.store': {
    methods: ["POST"]
    pattern: '/api/account/push-subscription'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_subscription_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/push_subscription_controller').default['store']>>>
    }
  }
  'profile.push_subscription.destroy': {
    methods: ["DELETE"]
    pattern: '/api/account/push-subscription'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_subscription_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/push_subscription_controller').default['destroy']>>>
    }
  }
  'push_subscription.vapid_public_key': {
    methods: ["GET","HEAD"]
    pattern: '/api/push/vapid-public-key'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_subscription_controller').default['vapidPublicKey']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/push_subscription_controller').default['vapidPublicKey']>>>
    }
  }
  'league.store': {
    methods: ["POST"]
    pattern: '/api/leagues'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/league').createLeagueValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/league').createLeagueValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'league.preview_join': {
    methods: ["GET","HEAD"]
    pattern: '/api/leagues/join/:code'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_controller').default['previewJoin']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_controller').default['previewJoin']>>>
    }
  }
  'league.join': {
    methods: ["POST"]
    pattern: '/api/leagues/join/:code'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { code: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_controller').default['join']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_controller').default['join']>>>
    }
  }
  'league.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/leagues/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_controller').default['show']>>>
    }
  }
  'league.leave': {
    methods: ["DELETE"]
    pattern: '/api/leagues/:id/leave'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_controller').default['leave']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_controller').default['leave']>>>
    }
  }
  'league.destroy': {
    methods: ["DELETE"]
    pattern: '/api/leagues/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_controller').default['destroy']>>>
    }
  }
  'league_member.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/leagues/:id/members'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_member_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_member_controller').default['index']>>>
    }
  }
  'league_member.update': {
    methods: ["PATCH"]
    pattern: '/api/leagues/:id/members/:userId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/league').updateMemberValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; userId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/league').updateMemberValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_member_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_member_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'league_member.destroy': {
    methods: ["DELETE"]
    pattern: '/api/leagues/:id/members/:userId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; userId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_member_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_member_controller').default['destroy']>>>
    }
  }
  'league_race.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/leagues/:id/races'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_race_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_race_controller').default['index']>>>
    }
  }
  'league_race.store': {
    methods: ["POST"]
    pattern: '/api/leagues/:id/races'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/race').addRaceValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/race').addRaceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_race_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_race_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'league_race.destroy': {
    methods: ["DELETE"]
    pattern: '/api/leagues/:id/races/:raceId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; raceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/league_race_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/league_race_controller').default['destroy']>>>
    }
  }
  'race.preview': {
    methods: ["GET","HEAD"]
    pattern: '/api/races/preview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/race_controller').default['preview']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/race_controller').default['preview']>>>
    }
  }
  'race.startlist': {
    methods: ["GET","HEAD"]
    pattern: '/api/races/:id/startlist'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/race_controller').default['startlist']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/race_controller').default['startlist']>>>
    }
  }
  'race.stages': {
    methods: ["GET","HEAD"]
    pattern: '/api/races/:id/stages'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/race_controller').default['stages']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/race_controller').default['stages']>>>
    }
  }
  'race.results': {
    methods: ["GET","HEAD"]
    pattern: '/api/races/:id/results'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/race_controller').default['results']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/race_controller').default['results']>>>
    }
  }
  'bet.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/races/:id/bet'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bet_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bet_controller').default['show']>>>
    }
  }
  'bet.store_classic': {
    methods: ["POST"]
    pattern: '/api/races/:id/bet'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bet').betClassicValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bet').betClassicValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bet_controller').default['storeClassic']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bet_controller').default['storeClassic']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'bet.store_grand_tour': {
    methods: ["POST"]
    pattern: '/api/races/:id/bet/grandtour'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/bet').betGrandTourValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/bet').betGrandTourValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bet_controller').default['storeGrandTour']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bet_controller').default['storeGrandTour']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'bet.league_bets': {
    methods: ["GET","HEAD"]
    pattern: '/api/leagues/:id/races/:raceId/bets'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; raceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/bet_controller').default['leagueBets']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/bet_controller').default['leagueBets']>>>
    }
  }
  'standings.league_standings': {
    methods: ["GET","HEAD"]
    pattern: '/api/leagues/:id/standings'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/standings_controller').default['leagueStandings']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/standings_controller').default['leagueStandings']>>>
    }
  }
  'standings.race_standings': {
    methods: ["GET","HEAD"]
    pattern: '/api/leagues/:id/races/:raceId/standings'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; raceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/standings_controller').default['raceStandings']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/standings_controller').default['raceStandings']>>>
    }
  }
  'standings.stage_standings': {
    methods: ["GET","HEAD"]
    pattern: '/api/leagues/:id/races/:raceId/stage/:n/standings'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue, ParamValue]
      params: { id: ParamValue; raceId: ParamValue; n: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/standings_controller').default['stageStandings']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/standings_controller').default['stageStandings']>>>
    }
  }
  'standings.global_standings': {
    methods: ["GET","HEAD"]
    pattern: '/api/standings/global'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/standings_controller').default['globalStandings']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/standings_controller').default['globalStandings']>>>
    }
  }
  'race_sync.sync': {
    methods: ["POST"]
    pattern: '/api/admin/races/:id/sync'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/race_sync_controller').default['sync']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/race_sync_controller').default['sync']>>>
    }
  }
}
