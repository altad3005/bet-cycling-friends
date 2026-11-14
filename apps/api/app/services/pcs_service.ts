import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

export interface PcsRaceInfo {
  slug: string
  name: string
  year: number
  start_date: string | null
  end_date: string | null
  is_one_day_race: boolean
  uci_tour: string | null
  category: string | null
}

export interface PcsRider {
  name: string
  pcs_url: string
  nationality?: string | null
  team_name?: string | null
}

export interface PcsRiderWithCost extends PcsRider {
  pcs_rank: number | null
  cost: number
}

export interface PcsStageResult {
  rider_name: string
  rider_url: string
  rank: number
  nationality?: string | null
  time?: string | null
}

export default class PcsService {
  private readonly baseUrl = env.get('PCS_SERVICE_URL')

  private async request<T>(path: string): Promise<T | null> {
    const url = `${this.baseUrl}${path}`
    try {
      const response = await fetch(url)
      if (!response.ok) {
        logger.error({ url, status: response.status }, 'PCS service returned an error status')
        return null
      }
      return (await response.json()) as T
    } catch (error) {
      logger.error({ url, err: error }, 'PCS service is unreachable')
      return null
    }
  }

  async getRacePreview(slug: string, year = DateTime.now().year): Promise<PcsRaceInfo | null> {
    return this.request<PcsRaceInfo>(`/internal/races/preview?slug=${slug}&year=${year}`)
  }

  async getStartlist(slug: string, year = DateTime.now().year): Promise<PcsRider[]> {
    const riders = await this.request<PcsRider[]>(`/internal/races/${slug}/startlist?year=${year}`)
    return riders ?? []
  }

  async getStartlistWithCosts(
    slug: string,
    year = DateTime.now().year
  ): Promise<PcsRiderWithCost[]> {
    const riders = await this.request<PcsRiderWithCost[]>(
      `/internal/races/${slug}/startlist-with-costs?year=${year}`
    )
    return riders ?? []
  }

  async getStagesInfo(
    slug: string,
    year = DateTime.now().year
  ): Promise<{ number: number; name: string; date: string | null; profileIcon: string | null }[]> {
    const stages = await this.request<
      { number: number; name: string; date: string | null; profile_icon: string | null }[]
    >(`/internal/races/${slug}/stages?year=${year}`)
    return (stages ?? []).map((s) => ({
      number: s.number,
      name: s.name,
      date: s.date ?? null,
      profileIcon: s.profile_icon ?? null,
    }))
  }

  async getStageResults(
    slug: string,
    year: number,
    stageNumber: number
  ): Promise<PcsStageResult[]> {
    const results = await this.request<PcsStageResult[]>(
      `/internal/races/${slug}/stage/${stageNumber}?year=${year}`
    )
    return results ?? []
  }

  async getRaceResults(slug: string, year = DateTime.now().year): Promise<PcsStageResult[]> {
    const results = await this.request<PcsStageResult[]>(
      `/internal/races/${slug}/results?year=${year}`
    )
    return results ?? []
  }
}
