import env from '#start/env'
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

export interface PcsStageResult {
  rider_name: string
  rider_url: string
  rank: number
  nationality?: string | null
  time?: string | null
}

export default class PcsService {
  private readonly baseUrl = env.get('PCS_SERVICE_URL')

  async getRacePreview(slug: string, year = DateTime.now().year): Promise<PcsRaceInfo | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/internal/races/preview?slug=${slug}&year=${year}`
      )
      if (!response.ok) return null
      return response.json() as Promise<PcsRaceInfo>
    } catch {
      return null
    }
  }

  async getStartlist(slug: string, year = DateTime.now().year): Promise<PcsRider[]> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/races/${slug}/startlist?year=${year}`)
      if (!response.ok) return []
      return response.json() as Promise<PcsRider[]>
    } catch {
      return []
    }
  }

  async getStageResults(
    slug: string,
    year: number,
    stageNumber: number
  ): Promise<PcsStageResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/internal/races/${slug}/stage/${stageNumber}?year=${year}`
      )
      if (!response.ok) return []
      return response.json() as Promise<PcsStageResult[]>
    } catch {
      return []
    }
  }

  async getRaceResults(slug: string, year = DateTime.now().year): Promise<PcsStageResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/races/${slug}/results?year=${year}`)
      if (!response.ok) return []
      return response.json() as Promise<PcsStageResult[]>
    } catch {
      return []
    }
  }
}
