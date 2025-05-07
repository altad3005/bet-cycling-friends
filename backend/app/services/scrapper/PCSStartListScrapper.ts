import axios from 'axios'
import { parse } from 'node-html-parser'

interface Rider {
  name: string
  team: string
  nationality: string
}

export default class PCSStartListScraper {
  public static async getStartList(url: string): Promise<Rider[]> {
    const riders: Rider[] = []

    try {
      const response = await axios.get(url)
      const root = parse(response.data)

      const teamBlocks = root.querySelectorAll('.startlist_v4 > li')

      for (const teamBlock of teamBlocks) {
        const teamElement = teamBlock.querySelector('.team')
        if (!teamElement) continue

        const teamName = teamElement.text.trim()
        const riderRows = teamBlock.querySelectorAll('ul > li')

        for (const riderRow of riderRows) {
          const nameElement = riderRow.querySelector('a')
          const flagElement = riderRow.querySelector('.flag')

          if (nameElement && flagElement) {
            const name = nameElement.text.trim()
            const nationality = flagElement.text.trim() || 'N/A';

            riders.push({ name, team: teamName, nationality: nationality.toUpperCase() })
          }
        }
      }

      return riders
    } catch (error) {
      console.error('[PCS SCRAPER] Erreur lors du scraping:', error)
      throw new Error('Impossible de récupérer la startlist')
    }
  }
}
