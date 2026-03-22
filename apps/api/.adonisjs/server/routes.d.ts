import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_token.store': { paramsTuple?: []; params?: {} }
    'auth.access_token.destroy': { paramsTuple?: []; params?: {} }
    'auth.google_auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.google_auth.callback': { paramsTuple?: []; params?: {} }
    'auth.password_reset.request': { paramsTuple?: []; params?: {} }
    'auth.password_reset.confirm': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.profile.leagues': { paramsTuple?: []; params?: {} }
    'league.store': { paramsTuple?: []; params?: {} }
    'league.preview_join': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'league.join': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'league.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league_member.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league_member.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'league_member.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'league_race.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league_race.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league_race.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue} }
    'race.preview': { paramsTuple?: []; params?: {} }
    'race.startlist': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.store_classic': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.store_grand_tour': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.league_bets': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue} }
    'standings.league_standings': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'standings.race_standings': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue} }
    'standings.stage_standings': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue,'n': ParamValue} }
    'standings.global_standings': { paramsTuple?: []; params?: {} }
    'race_sync.sync': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'auth.google_auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.google_auth.callback': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.profile.leagues': { paramsTuple?: []; params?: {} }
    'league.preview_join': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'league.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league_member.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league_race.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'race.preview': { paramsTuple?: []; params?: {} }
    'race.startlist': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.league_bets': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue} }
    'standings.league_standings': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'standings.race_standings': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue} }
    'standings.stage_standings': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue,'n': ParamValue} }
    'standings.global_standings': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.google_auth.redirect': { paramsTuple?: []; params?: {} }
    'auth.google_auth.callback': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.profile.leagues': { paramsTuple?: []; params?: {} }
    'league.preview_join': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'league.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league_member.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league_race.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'race.preview': { paramsTuple?: []; params?: {} }
    'race.startlist': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.league_bets': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue} }
    'standings.league_standings': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'standings.race_standings': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue} }
    'standings.stage_standings': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue,'n': ParamValue} }
    'standings.global_standings': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_token.store': { paramsTuple?: []; params?: {} }
    'auth.access_token.destroy': { paramsTuple?: []; params?: {} }
    'auth.password_reset.request': { paramsTuple?: []; params?: {} }
    'auth.password_reset.confirm': { paramsTuple?: []; params?: {} }
    'league.store': { paramsTuple?: []; params?: {} }
    'league.join': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'league_race.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.store_classic': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'bet.store_grand_tour': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'race_sync.sync': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'league.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'league_member.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'league_race.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'raceId': ParamValue} }
  }
  PATCH: {
    'league_member.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}