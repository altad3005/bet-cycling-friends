import { test } from '@japa/runner'
import PCSStartListScraper from '#services/scrapper/PCSStartListScrapper'

test.group('PCSStartListScraper', () => {
  test('should scrape riders from a PCS startlist page', async ({ assert }) => {
    const url = 'https://www.procyclingstats.com/race/giro-d-italia/2024/startlist'
    const result = await PCSStartListScraper.getStartList(url)

    assert.isArray(result)
    assert.isAbove(result.length, 0)
  })

  test('should throw an error for an invalid URL', async ({ assert }) => {
    await assert.rejects(() =>
      PCSStartListScraper.getStartList('https://pcs.invalid.com/fake/startlist')
    )
  })
})
