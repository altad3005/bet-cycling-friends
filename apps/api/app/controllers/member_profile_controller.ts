import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class MemberProfileController {
  async show({ params, response }: HttpContext) {
    const { id: leagueId, userId } = params

    // User info + membership
    const member = await db
      .from('league_members')
      .join('users', 'users.id', 'league_members.user_id')
      .where('league_members.league_id', leagueId)
      .where('league_members.user_id', userId)
      .select('users.id', 'users.pseudo', 'users.icon', 'league_members.joined_at', 'league_members.is_admin')
      .first()

    if (!member) {
      return response.notFound({ message: 'Membre introuvable.' })
    }

    // All league race IDs (ordered by start_at)
    const leagueRaceRows: { id: string; name: string; start_at: string }[] = await db
      .from('league_races')
      .join('races', 'races.id', 'league_races.race_id')
      .where('league_races.league_id', leagueId)
      .orderBy('races.start_at', 'asc')
      .select('races.id', 'races.name', 'races.start_at')

    const raceIds = leagueRaceRows.map((r) => r.id)

    // This user's scores
    const userScores: { race_id: string; points: number }[] = raceIds.length
      ? await db.from('scores')
          .where('league_id', leagueId)
          .where('user_id', userId)
          .whereIn('race_id', raceIds)
          .select('race_id', 'points')
      : []

    // All scores per race (to compute league rank per race)
    const allScores: { race_id: string; user_id: string; points: number }[] = raceIds.length
      ? await db.from('scores')
          .where('league_id', leagueId)
          .whereIn('race_id', raceIds)
          .select('race_id', 'user_id', 'points')
      : []

    // Bets placed (for participation)
    const [classicBets, gtBets]: { race_id: string }[][] = raceIds.length
      ? await Promise.all([
          db.from('bets_classic').where('user_id', userId).whereIn('race_id', raceIds).select('race_id'),
          db.from('bets_grand_tour').where('user_id', userId).whereIn('race_id', raceIds).select('race_id'),
        ])
      : [[], []]

    const bettedRaceIds = new Set([...classicBets, ...gtBets].map((b) => b.race_id))

    // Build per-race history
    const userScoreMap = new Map(userScores.map((s) => [s.race_id, Number(s.points)]))

    const races = leagueRaceRows
      .filter((r) => {
        // Only include races that have at least one score in the league
        return allScores.some((s) => s.race_id === r.id)
      })
      .map((race) => {
        const points = userScoreMap.get(race.id) ?? null

        // Rank in league for this race
        let leagueRank: number | null = null
        if (points !== null) {
          const raceScores = allScores
            .filter((s) => s.race_id === race.id)
            .sort((a, b) => b.points - a.points)
          leagueRank = raceScores.findIndex((s) => s.user_id === userId) + 1
        }

        return {
          raceId: race.id,
          raceName: race.name,
          startAt: race.start_at,
          points,
          leagueRank,
          participated: bettedRaceIds.has(race.id),
        }
      })

    // Aggregate stats
    const scoredRaces = races.filter((r) => r.points !== null)
    const totalPoints = scoredRaces.reduce((acc, r) => acc + (r.points ?? 0), 0)
    const racesPlayed = scoredRaces.length
    const avgPoints = racesPlayed > 0 ? Math.round(totalPoints / racesPlayed) : 0
    const bestRace = scoredRaces.reduce<{ raceName: string; points: number } | null>((best, r) => {
      if (r.points === null) return best
      if (!best || r.points > best.points) return { raceName: r.raceName, points: r.points }
      return best
    }, null)
    const participationRate = raceIds.length > 0 ? Math.round((bettedRaceIds.size / raceIds.length) * 100) : 0

    // League rank (overall)
    const leagueStandings = await db
      .from('scores')
      .where('league_id', leagueId)
      .groupBy('user_id')
      .select('user_id')
      .sum('points as total')
      .orderBy('total', 'desc')

    const leagueRank = leagueStandings.findIndex((s: any) => s.user_id === userId) + 1

    return response.ok({
      data: {
        user: {
          id: member.id,
          pseudo: member.pseudo,
          icon: member.icon,
          joinedAt: member.joined_at,
          isAdmin: member.is_admin,
        },
        standing: {
          rank: leagueRank || null,
          totalPoints,
          racesPlayed,
          avgPoints,
          participationRate,
          bestRace,
        },
        races,
      },
    })
  }
}
