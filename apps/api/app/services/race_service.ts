import { RaceType, MultiplierType, RaceStatus } from '@bcf/shared'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import Race from '#models/race'
import Rider from '#models/rider'
import LeagueRace from '#models/league_race'
import LeagueMember from '#models/league_member'
import Season from '#models/season'
import PcsService, { type PcsRaceInfo } from '#services/pcs_service'
import type User from '#models/user'

const MONUMENT_SLUGS = [
  'paris-roubaix',
  'ronde-van-vlaanderen',
  'milano-sanremo',
  'liege-bastogne-liege',
  'il-lombardia',
]

const GRAND_TOUR_SLUGS = ['tour-de-france', 'giro-d-italia', 'vuelta-a-espana']

const WORLDS_SLUGS = ['world-championship', 'campeonato-del-mundo', 'championnats-du-monde']

function computeStatus(startAt: DateTime | null, endAt: DateTime | null): RaceStatus {
  const now = DateTime.now()
  if (endAt && endAt < now) return RaceStatus.FINISHED
  if (startAt && startAt < now) return RaceStatus.LIVE
  return RaceStatus.UPCOMING
}

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

  if (info.is_one_day_race && info.uci_tour === '1.UWT') {
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
    const startAt = info.start_date ? DateTime.fromISO(info.start_date) : null
    const endAt = info.end_date ? DateTime.fromISO(info.end_date) : null

    const race = await Race.firstOrCreate(
      { slug, seasonYear: info.year },
      {
        slug,
        seasonYear: info.year,
        name: info.name,
        raceType: attrs.raceType,
        multiplierType: attrs.multiplierType,
        isGrandTour: attrs.isGrandTour,
        status: computeStatus(startAt, endAt),
        resultsFinal: false,
        startAt,
        endAt,
      }
    )

    // Always refresh metadata from PCS and recompute status from dates
    race.merge({ name: info.name, raceType: attrs.raceType, multiplierType: attrs.multiplierType, isGrandTour: attrs.isGrandTour, startAt, endAt, status: computeStatus(startAt, endAt) })
    await race.save()

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

  async getStartlist(race: Race): Promise<{ id: string; name: string }[]> {
    const pcsRiders = await this.pcs.getStartlist(race.slug, race.seasonYear)
    const riders = await Promise.all(
      pcsRiders.map((r) =>
        Rider.firstOrCreate(
          { pcsUrl: r.pcs_url },
          { name: r.name, nationality: r.nationality ?? null, pcsUrl: r.pcs_url }
        )
      )
    )
    return riders.map((r) => ({ id: r.id, name: r.name }))
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
