import { DateTime } from 'luxon'
import Race from '#models/race'
import LeagueRace from '#models/league_race'
import LeagueMember from '#models/league_member'
import BetClassic from '#models/bet_classic'
import BetGrandTour from '#models/bet_grand_tour'
import PushNotificationService from '#services/push_notification_service'

export default class ReminderService {
  private push = new PushNotificationService()

  async sendReminders(): Promise<void> {
    const now = DateTime.now()

    const upcoming = await Race.query().where('status', 'upcoming').whereNotNull('start_at')

    for (const race of upcoming) {
      if (!race.startAt) continue
      const hoursUntilStart = race.startAt.diff(now, 'hours').hours

      if (hoursUntilStart >= 4.5 && hoursUntilStart < 5.5 && !race.reminder5hSentAt) {
        await this.notifyUnbetUsers(race, '5h')
        race.reminder5hSentAt = DateTime.now()
        await race.save()
      }

      if (hoursUntilStart >= 0.5 && hoursUntilStart < 1.5 && !race.reminder1hSentAt) {
        await this.notifyUnbetUsers(race, '1h')
        race.reminder1hSentAt = DateTime.now()
        await race.save()
      }
    }
  }

  private async notifyUnbetUsers(race: Race, window: '5h' | '1h'): Promise<void> {
    // All leagues that have this race
    const leagueRaces = await LeagueRace.query().where('race_id', race.id)
    const leagueIds = leagueRaces.map((lr) => lr.leagueId)
    if (leagueIds.length === 0) return

    // All members of those leagues
    const members = await LeagueMember.query().whereIn('league_id', leagueIds)
    const userIds = [...new Set(members.map((m) => m.userId))]
    if (userIds.length === 0) return

    // Filter out users who already placed a bet
    const [classicBets, gtBets] = await Promise.all([
      BetClassic.query().where('race_id', race.id).whereIn('user_id', userIds).select('user_id'),
      BetGrandTour.query().where('race_id', race.id).whereIn('user_id', userIds).select('user_id'),
    ])

    const bettedUserIds = new Set([
      ...classicBets.map((b) => b.userId),
      ...gtBets.map((b) => b.userId),
    ])

    const unbetUserIds = userIds.filter((id) => !bettedUserIds.has(id))
    if (unbetUserIds.length === 0) return

    const isUrgent = window === '1h'
    const payload = {
      title: isUrgent ? '⚠️ Dernier rappel !' : '🚴 N\'oublie pas de pronostiquer !',
      body: isUrgent
        ? `${race.name} démarre dans 1h — il te reste peu de temps pour placer ton pari.`
        : `${race.name} démarre dans 5h — place ton pronostic avant le départ !`,
      url: `/races/${race.id}`,
    }

    await this.push.sendToUsers(unbetUserIds, payload)
  }
}
