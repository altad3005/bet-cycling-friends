import { SCORING_TABLE, MULTIPLIERS, MultiplierType } from '@bcf/shared'
import db from '@adonisjs/lucid/services/db'
import StageResult from '#models/stage_result'
import BetGrandTour from '#models/bet_grand_tour'
import LeagueMember from '#models/league_member'

export default class StandingsService {
  async getLeagueStandings(leagueId: string) {
    const result = await db.rawQuery<{
      rows: { user_id: string; pseudo: string; icon: string; total_points: number; races_played: number }[]
    }>(
      `SELECT
        lm.user_id,
        u.pseudo,
        u.icon,
        COALESCE(SUM(s.points), 0) AS total_points,
        (SELECT COUNT(*)
         FROM league_races lr
         WHERE lr.league_id = ?
           AND (
             EXISTS (SELECT 1 FROM bets_classic bc WHERE bc.user_id = lm.user_id AND bc.race_id = lr.race_id)
             OR EXISTS (SELECT 1 FROM bets_grand_tour bgt WHERE bgt.user_id = lm.user_id AND bgt.race_id = lr.race_id)
           )
        ) AS races_played
      FROM league_members lm
      JOIN users u ON u.id = lm.user_id
      LEFT JOIN scores s ON s.user_id = lm.user_id AND s.league_id = ?
      WHERE lm.league_id = ?
      GROUP BY lm.user_id, u.pseudo, u.icon
      ORDER BY total_points DESC`,
      [leagueId, leagueId, leagueId]
    )

    return this.withSharedRanks(
      result.rows.map((row) => ({
        userId: row.user_id,
        pseudo: row.pseudo,
        icon: row.icon,
        totalPoints: Number(row.total_points),
        racesPlayed: Number(row.races_played),
      })),
      (a, b) => a.totalPoints === b.totalPoints && a.racesPlayed === b.racesPlayed
    )
  }

  async getRaceStandings(leagueId: string, raceId: string) {
    const rows = await db
      .from('scores')
      .join('users', 'users.id', 'scores.user_id')
      .leftJoin('bets_classic', (q) => {
        q.on('bets_classic.user_id', '=', 'scores.user_id').andOn(
          'bets_classic.race_id',
          '=',
          'scores.race_id'
        )
      })
      .leftJoin('bets_grand_tour', (q) => {
        q.on('bets_grand_tour.user_id', '=', 'scores.user_id').andOn(
          'bets_grand_tour.race_id',
          '=',
          'scores.race_id'
        )
      })
      .where('scores.league_id', leagueId)
      .where('scores.race_id', raceId)
      .select([
        'scores.user_id as user_id',
        'users.pseudo',
        'users.icon',
        'scores.points',
        db.raw('COALESCE(bets_classic.placed_at, bets_grand_tour.placed_at) as placed_at'),
      ])
      .orderBy('scores.points', 'desc')
      .orderByRaw('COALESCE(bets_classic.placed_at, bets_grand_tour.placed_at) ASC')

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      pseudo: row.pseudo,
      icon: row.icon,
      points: Number(row.points),
      placedAt: row.placed_at,
    }))
  }

  async getStageStandings(leagueId: string, raceId: string, stageNumber: number) {
    const stageResults = await StageResult.query()
      .where('race_id', raceId)
      .where('stage_number', stageNumber)
      .where('result_type', 'stage')
      .where('rank', '<=', 10)

    const rankMap = new Map(stageResults.map((r) => [r.riderId, r.rank]))

    const memberIds = (await LeagueMember.query().where('league_id', leagueId).select('user_id')).map(
      (m) => m.userId
    )

    const bets = await BetGrandTour.query()
      .whereIn('user_id', memberIds)
      .where('race_id', raceId)
      .preload('user')
      .preload('betRiders')

    const standings = bets
      .map((bet) => {
        let points = 0
        for (const betRider of bet.betRiders) {
          const rank = rankMap.get(betRider.riderId)
          if (rank && SCORING_TABLE[rank]) {
            points += SCORING_TABLE[rank] * MULTIPLIERS[MultiplierType.GT_STAGE]
          }
        }
        return {
          userId: bet.userId,
          pseudo: bet.user?.pseudo,
          icon: bet.user?.icon,
          points,
          placedAt: bet.placedAt,
        }
      })
      .sort((a, b) => b.points - a.points || a.placedAt.toMillis() - b.placedAt.toMillis())

    return standings.map((row, index) => ({ rank: index + 1, ...row }))
  }

  async getGlobalStandings() {
    const result = await db.rawQuery<{
      rows: { user_id: string; pseudo: string; icon: string; total_points: number; total_max: number; races_played: number }[]
    }>(`
      SELECT
        u.id                          AS user_id,
        u.pseudo,
        u.icon,
        COALESCE(SUM(s.points), 0)       AS total_points,
        COALESCE(SUM(s.max_possible), 0) AS total_max,
        COUNT(DISTINCT s.race_id)        AS races_played
      FROM users u
      LEFT JOIN LATERAL (
        SELECT DISTINCT ON (race_id) race_id, points, max_possible
        FROM scores
        WHERE user_id = u.id
        ORDER BY race_id
      ) s ON true
      WHERE EXISTS (SELECT 1 FROM league_members lm WHERE lm.user_id = u.id)
      GROUP BY u.id, u.pseudo, u.icon
      ORDER BY
        (COALESCE(SUM(s.points), 0) / NULLIF(COALESCE(SUM(s.max_possible), 0), 0)) DESC NULLS LAST,
        COUNT(DISTINCT s.race_id) DESC,
        u.pseudo ASC
    `)

    return this.withSharedRanks(
      result.rows.map((row) => ({
        userId: row.user_id,
        pseudo: row.pseudo,
        icon: row.icon,
        percentage:
          row.total_max > 0 ? Math.round((row.total_points / row.total_max) * 1000) / 10 : 0,
        racesPlayed: Number(row.races_played),
      })),
      (a, b) => a.percentage === b.percentage && a.racesPlayed === b.racesPlayed
    )
  }

  private withSharedRanks<T>(items: T[], isTied: (a: T, b: T) => boolean): (T & { rank: number })[] {
    let rank = 1
    return items.map((item, index) => {
      if (index > 0 && !isTied(items[index - 1], item)) {
        rank = index + 1
      }
      return { ...item, rank }
    })
  }
}
