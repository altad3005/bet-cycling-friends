import { RaceType, MultiplierType } from '@bcf/shared'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import Race from '#models/race'
import LeagueRace from '#models/league_race'
import LeagueMember from '#models/league_member'
import Season from '#models/season'
import PcsService, { type PcsRaceInfo } from '#services/pcs_service'
import type User from '#models/user'

const MONUMENT_SLUGS = [
  'paris-roubaix',
  'ronde-van-vlaanderen',
  'milan-sanremo',
  'liege-bastogne-liege',
  'il-lombardia',
]

const GRAND_TOUR_SLUGS = ['tour-de-france', 'giro-d-italia', 'vuelta-a-espana']

const WORLDS_SLUGS = ['world-championship', 'campeonato-del-mundo', 'championnats-du-monde']

function determineRaceAttrs(
  slug: string,
  info: PcsRaceInfo
): { raceType: RaceType; multiplierType: MultiplierType; isGrandTour: boolean } {
  if (GRAND_TOUR_SLUGS.some((s) => slug.includes(s))) {
    return {
      raceType: RaceType.GRAND_TOUR,
      multiplierType: MultiplierType.GT_STAGE,
      isGrandTour: true,
    }
  }

  if (WORLDS_SLUGS.some((s) => slug.includes(s))) {
    return { raceType: RaceType.WORLDS, multiplierType: MultiplierType.MONUMENT, isGrandTour: false }
  }

  if (MONUMENT_SLUGS.some((s) => slug.includes(s))) {
    return {
      raceType: RaceType.CLASSIC,
      multiplierType: MultiplierType.MONUMENT,
      isGrandTour: false,
    }
  }

  if (info.is_one_day_race && info.category === '1.UWT') {
    return {
      raceType: RaceType.CLASSIC,
      multiplierType: MultiplierType.WT_CLASSIC,
      isGrandTour: false,
    }
  }

  if (info.category?.startsWith('CN') || slug.includes('national')) {
    return {
      raceType: RaceType.NATIONAL,
      multiplierType: MultiplierType.STAGE_RACE,
      isGrandTour: false,
    }
  }

  return {
    raceType: RaceType.STAGE_RACE,
    multiplierType: MultiplierType.STAGE_RACE,
    isGrandTour: false,
  }
}

export default class RaceService {
  private pcs = new PcsService()

  async preview(slug: string): Promise<PcsRaceInfo & ReturnType<typeof determineRaceAttrs>> {
    const info = await this.pcs.getRacePreview(slug)
    if (!info) {
      throw new Exception(`Course introuvable pour le slug "${slug}"`, { status: 422 })
    }
    return { ...info, ...determineRaceAttrs(slug, info) }
  }

  async addToLeague(user: User, leagueId: string, slug: string): Promise<Race> {
    await this.requireAdmin(user.id, leagueId)

    const info = await this.pcs.getRacePreview(slug)
    if (!info) {
      throw new Exception(`Course introuvable pour le slug "${slug}"`, { status: 422 })
    }

    await Season.firstOrCreate({ year: info.year }, { year: info.year })

    const attrs = determineRaceAttrs(slug, info)
    const race = await Race.firstOrCreate(
      { slug, seasonYear: info.year },
      {
        slug,
        name: info.name,
        seasonYear: info.year,
        raceType: attrs.raceType,
        multiplierType: attrs.multiplierType,
        isGrandTour: attrs.isGrandTour,
        status: 'upcoming',
        resultsFinal: false,
        startAt: info.start_date ? DateTime.fromISO(info.start_date) : null,
        endAt: info.end_date ? DateTime.fromISO(info.end_date) : null,
      }
    )

    const existing = await LeagueRace.query()
      .where('league_id', leagueId)
      .where('race_id', race.id)
      .first()

    if (existing) {
      throw new Exception('Cette course est déjà dans la ligue.', { status: 409 })
    }

    await LeagueRace.create({
      leagueId,
      raceId: race.id,
      addedAt: DateTime.now(),
    })

    return race
  }

  async removeFromLeague(user: User, leagueId: string, raceId: string): Promise<void> {
    await this.requireAdmin(user.id, leagueId)

    const leagueRace = await LeagueRace.query()
      .where('league_id', leagueId)
      .where('race_id', raceId)
      .firstOrFail()

    await leagueRace.delete()
  }

  private async requireAdmin(userId: string, leagueId: string): Promise<void> {
    const member = await LeagueMember.query()
      .where('league_id', leagueId)
      .where('user_id', userId)
      .first()

    if (!member?.isAdmin) {
      throw new Exception('Accès réservé aux administrateurs.', { status: 403 })
    }
  }
}
