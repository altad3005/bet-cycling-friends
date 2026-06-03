import db from '@adonisjs/lucid/services/db'
import { computeFormHistory, type FormEntry } from '#services/form_history'

export default class FormService {
  async getUserForm(leagueId: string, userId: string, limit = 5): Promise<FormEntry[]> {
    const members = await db.from('league_members').where('league_id', leagueId).select('user_id')
    const memberIds = members.map((m: any) => m.user_id as string)
    if (memberIds.length === 0) return []

    const raceRows = await db
      .from('league_races')
      .join('races', 'races.id', 'league_races.race_id')
      .where('league_races.league_id', leagueId)
      .orderBy('races.start_at', 'asc')
      .select('races.id', 'races.name')

    const raceIds = raceRows.map((r: any) => r.id as string)
    if (raceIds.length === 0) return []

    const scoreRows = await db
      .from('scores')
      .where('scores.league_id', leagueId)
      .whereIn('scores.race_id', raceIds)
      .select('scores.race_id', 'scores.user_id', 'scores.points')

    const scores = scoreRows.map((s: any) => ({
      raceId: s.race_id as string,
      userId: s.user_id as string,
      points: Number(s.points),
    }))

    const scoredRaceIds = new Set(scores.map((s) => s.raceId))
    const races = raceRows
      .filter((r: any) => scoredRaceIds.has(r.id as string))
      .map((r: any) => ({ id: r.id as string, name: r.name as string }))

    const history = computeFormHistory(races, scores, memberIds, userId)
    return history.slice(-limit)
  }
}
