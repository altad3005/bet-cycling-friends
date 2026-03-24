import db from '@adonisjs/lucid/services/db'

export default class StatsService {
  async getLeagueStats(leagueId: string) {
    // Members
    const members = await db.from('league_members').where('league_id', leagueId).select('user_id')
    const memberIds = members.map((m: any) => m.user_id as string)
    const totalMembers = memberIds.length

    if (totalMembers === 0) {
      return { overview: { totalRaces: 0, activePlayers: 0, totalPoints: 0, avgParticipation: 0 }, races: [], players: [] }
    }

    // League races with race info, ordered chronologically
    const leagueRaceRows = await db
      .from('league_races')
      .join('races', 'races.id', 'league_races.race_id')
      .where('league_races.league_id', leagueId)
      .orderBy('races.start_at', 'asc')
      .select('races.id', 'races.name', 'races.start_at', 'races.status')

    const raceIds = leagueRaceRows.map((r: any) => r.id as string)

    if (raceIds.length === 0) {
      return { overview: { totalRaces: 0, activePlayers: 0, totalPoints: 0, avgParticipation: 0 }, races: [], players: [] }
    }

    // Scores
    const scores: { user_id: string; race_id: string; points: string; pseudo: string; icon: string }[] = await db
      .from('scores')
      .join('users', 'users.id', 'scores.user_id')
      .where('scores.league_id', leagueId)
      .whereIn('scores.race_id', raceIds)
      .select('scores.user_id', 'scores.race_id', 'scores.points', 'users.pseudo', 'users.icon')

    // Bets (for participation)
    const [classicBets, gtBets] = await Promise.all([
      db.from('bets_classic').whereIn('race_id', raceIds).whereIn('user_id', memberIds).select('user_id', 'race_id'),
      db.from('bets_grand_tour').whereIn('race_id', raceIds).whereIn('user_id', memberIds).select('user_id', 'race_id'),
    ])

    const bettedSet = new Set<string>()
    for (const b of [...classicBets, ...gtBets] as any[]) {
      bettedSet.add(`${b.user_id}:${b.race_id}`)
    }

    // Per-race
    const perRace = leagueRaceRows.map((race: any) => {
      const raceScores = scores
        .filter((s) => s.race_id === race.id)
        .map((s) => ({ userId: s.user_id, pseudo: s.pseudo, icon: s.icon, points: Number(s.points) }))

      const bettorCount = memberIds.filter((uid) => bettedSet.has(`${uid}:${race.id}`)).length

      return {
        id: race.id as string,
        name: race.name as string,
        startAt: race.start_at as string | null,
        status: race.status as string,
        scores: raceScores,
        bettorCount,
        participation: totalMembers > 0 ? bettorCount / totalMembers : 0,
      }
    })

    // Per-player
    const playerMap = new Map<string, { userId: string; pseudo: string; icon: string; scoresByRace: Map<string, number> }>()

    for (const s of scores) {
      if (!playerMap.has(s.user_id)) {
        playerMap.set(s.user_id, { userId: s.user_id, pseudo: s.pseudo, icon: s.icon, scoresByRace: new Map() })
      }
      playerMap.get(s.user_id)!.scoresByRace.set(s.race_id, Number(s.points))
    }

    const players = Array.from(playerMap.values())
      .map((p) => {
        const entries = Array.from(p.scoresByRace.entries())
        const totalPoints = entries.reduce((acc, [, pts]) => acc + pts, 0)
        const racesPlayed = entries.length
        const avgPoints = racesPlayed > 0 ? Math.round(totalPoints / racesPlayed) : 0

        let bestRace: { name: string; points: number } | null = null
        let bestPts = -1
        for (const [rid, pts] of entries) {
          if (pts > bestPts) {
            bestPts = pts
            const raceRow = leagueRaceRows.find((r: any) => r.id === rid)
            bestRace = raceRow ? { name: raceRow.name, points: pts } : null
          }
        }

        const betsCount = raceIds.filter((rid) => bettedSet.has(`${p.userId}:${rid}`)).length

        return {
          userId: p.userId,
          pseudo: p.pseudo,
          icon: p.icon,
          totalPoints,
          racesPlayed,
          avgPoints,
          bestRace,
          participationRate: raceIds.length > 0 ? Math.round((betsCount / raceIds.length) * 100) : 0,
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)

    // KPIs
    const racesWithScores = raceIds.filter((rid) => scores.some((s) => s.race_id === rid)).length
    const activePlayers = new Set(scores.map((s) => s.user_id)).size
    const totalPoints = scores.reduce((acc, s) => acc + Number(s.points), 0)
    const avgParticipation =
      perRace.length > 0
        ? Math.round((perRace.reduce((acc, r) => acc + r.participation, 0) / perRace.length) * 100)
        : 0

    return {
      overview: { totalRaces: racesWithScores, activePlayers, totalPoints, avgParticipation, totalMembers },
      races: perRace,
      players,
    }
  }
}
