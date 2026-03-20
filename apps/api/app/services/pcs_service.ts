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
}
