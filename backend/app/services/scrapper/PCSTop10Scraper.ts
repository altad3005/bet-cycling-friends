import axios from 'axios'
import { parse } from 'node-html-parser'

interface Top10Rider {
  position: number
  name: string
  nationality: string
  team: string
  time: string
}

export default class PCSTop10Scraper {
  public static async getTop10(url: string): Promise<Top10Rider[]> {
    const top10: Top10Rider[] = []

    try {
      const response = await axios.get(url)
      const root = parse(response.data)

      // Sélectionne toutes les lignes du top 10
      const rows = root.querySelectorAll('tr[data-team][data-nation]')

      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i]

        const position = parseInt(row.querySelector('td')?.text || '0')
        const nationality = row.getAttribute('data-nation')?.toUpperCase() || 'N/A'

        const nameElement = row.querySelector('a[href^="rider/"]')
        const name = nameElement?.text.trim() || 'Unknown'

        const teamElement = row.querySelector('a[href^="team/"]')
        const team = teamElement?.text.trim() || 'Unknown'

        const time = row.querySelector('.time')?.text.trim() || ''

        top10.push({
          position,
          name,
          nationality,
          team,
          time,
        })
      }

      return top10
    } catch (error) {
      console.error('[PCS SCRAPER] Erreur lors du scraping du top 10:', error)
      throw new Error('Impossible de récupérer le top 10')
    }
  }
}
