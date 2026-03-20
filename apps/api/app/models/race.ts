import { RaceSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import LeagueRace from '#models/league_race'
import StageResult from '#models/stage_result'
import BetClassic from '#models/bet_classic'
import BetGrandTour from '#models/bet_grand_tour'

export default class Race extends RaceSchema {
  @hasMany(() => LeagueRace)
  declare leagueRaces: HasMany<typeof LeagueRace>

  @hasMany(() => StageResult)
  declare stageResults: HasMany<typeof StageResult>

  @hasMany(() => BetClassic)
  declare betsClassic: HasMany<typeof BetClassic>

  @hasMany(() => BetGrandTour)
  declare betsGrandTour: HasMany<typeof BetGrandTour>
}
