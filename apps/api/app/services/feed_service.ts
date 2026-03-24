import db from '@adonisjs/lucid/services/db'

export type FeedEventType = 'bet_placed' | 'results_published' | 'member_joined'

export interface FeedEvent {
  type: FeedEventType
  at: string
  // bet_placed + member_joined
  userId?: string
  pseudo?: string
  icon?: string
  // bet_placed + results_published
  raceId?: string
  raceName?: string
  // results_published
  winnerPseudo?: string
  winnerIcon?: string
  winnerPoints?: number
}

export default class FeedService {
  async getLeagueFeed(leagueId: string, limit = 20): Promise<FeedEvent[]> {
    // League races
    const leagueRaceRows: { id: string; name: string }[] = await db
      .from('league_races')
      .join('races', 'races.id', 'league_races.race_id')
      .where('league_races.league_id', leagueId)
      .select('races.id', 'races.name')

    const raceIds = leagueRaceRows.map((r) => r.id)
    const raceMap = new Map(leagueRaceRows.map((r) => [r.id, r.name]))

    // League members
    const members: { user_id: string; joined_at: string; pseudo: string; icon: string }[] = await db
      .from('league_members')
      .join('users', 'users.id', 'league_members.user_id')
      .where('league_members.league_id', leagueId)
      .select('league_members.user_id', 'league_members.joined_at', 'users.pseudo', 'users.icon')

    const memberIds = members.map((m) => m.user_id)
    const events: FeedEvent[] = []

    // ── Member joined events ────────────────────────────────────────────────
    for (const m of members) {
      events.push({
        type: 'member_joined',
        at: m.joined_at,
        userId: m.user_id,
        pseudo: m.pseudo,
        icon: m.icon,
      })
    }

    if (raceIds.length === 0 || memberIds.length === 0) {
      return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit)
    }

    // ── Bet placed events ───────────────────────────────────────────────────
    const [classicBets, gtBets]: any[][] = await Promise.all([
      db.from('bets_classic')
        .join('users', 'users.id', 'bets_classic.user_id')
        .whereIn('bets_classic.race_id', raceIds)
        .whereIn('bets_classic.user_id', memberIds)
        .select('bets_classic.user_id', 'bets_classic.race_id', 'bets_classic.placed_at', 'users.pseudo', 'users.icon'),
      db.from('bets_grand_tour')
        .join('users', 'users.id', 'bets_grand_tour.user_id')
        .whereIn('bets_grand_tour.race_id', raceIds)
        .whereIn('bets_grand_tour.user_id', memberIds)
        .select('bets_grand_tour.user_id', 'bets_grand_tour.race_id', 'bets_grand_tour.placed_at', 'users.pseudo', 'users.icon'),
    ])

    for (const b of [...classicBets, ...gtBets]) {
      const raceName = raceMap.get(b.race_id)
      if (!raceName) continue
      events.push({
        type: 'bet_placed',
        at: b.placed_at,
        userId: b.user_id,
        pseudo: b.pseudo,
        icon: b.icon,
        raceId: b.race_id,
        raceName,
      })
    }

    // ── Results published events ────────────────────────────────────────────
    // One event per race : top scorer + date of last score update
    const scores: { race_id: string; user_id: string; points: number; updated_at: string; pseudo: string; icon: string }[] = await db
      .from('scores')
      .join('users', 'users.id', 'scores.user_id')
      .where('scores.league_id', leagueId)
      .whereIn('scores.race_id', raceIds)
      .select('scores.race_id', 'scores.user_id', 'scores.points', 'scores.updated_at', 'users.pseudo', 'users.icon')
      .orderBy('scores.points', 'desc')

    // Group by race: keep max updated_at + first (= top scorer, already sorted desc)
    const raceResultMap = new Map<string, { publishedAt: string; pseudo: string; icon: string; points: number }>()
    for (const s of scores) {
      if (!raceResultMap.has(s.race_id)) {
        raceResultMap.set(s.race_id, { publishedAt: s.updated_at, pseudo: s.pseudo, icon: s.icon, points: Number(s.points) })
      } else {
        const existing = raceResultMap.get(s.race_id)!
        if (new Date(s.updated_at) > new Date(existing.publishedAt)) {
          existing.publishedAt = s.updated_at
        }
      }
    }

    for (const [raceId, result] of raceResultMap.entries()) {
      const raceName = raceMap.get(raceId)
      if (!raceName) continue
      events.push({
        type: 'results_published',
        at: result.publishedAt,
        raceId,
        raceName,
        winnerPseudo: result.pseudo,
        winnerIcon: result.icon,
        winnerPoints: result.points,
      })
    }

    return events
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, limit)
  }
}
