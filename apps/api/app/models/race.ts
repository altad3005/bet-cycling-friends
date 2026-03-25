import { RaceSchema } from '#database/schema'
import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import LeagueRace from '#models/league_race'
import StageResult from '#models/stage_result'
import BetClassic from '#models/bet_classic'
import BetGrandTour from '#models/bet_grand_tour'

export default class Race extends RaceSchema {
  // schema.ts est auto-généré et utilise des noms incorrects pour ces colonnes
  @column.dateTime({ columnName: 'reminder5h_sent_at' })
  declare reminder5hSentAt: DateTime | null

  @column.dateTime({ columnName: 'reminder1h_sent_at' })
  declare reminder1hSentAt: DateTime | null

  @column.dateTime({ columnName: 'reminder24h_sent_at' })
  declare reminder24hSentAt: DateTime | null

  @hasMany(() => LeagueRace)
  declare leagueRaces: HasMany<typeof LeagueRace>

  @hasMany(() => StageResult)
  declare stageResults: HasMany<typeof StageResult>

  @hasMany(() => BetClassic)
  declare betsClassic: HasMany<typeof BetClassic>

  @hasMany(() => BetGrandTour)
  declare betsGrandTour: HasMany<typeof BetGrandTour>
}
