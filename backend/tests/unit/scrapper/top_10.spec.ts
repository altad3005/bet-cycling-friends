import { test } from '@japa/runner'
import PCSTop10Scraper from '#services/scrapper/PCSTop10Scraper'

test.group('PCSTop10Scraper', () => {
  test('should scrape the top 10 riders from a PCS result page', async ({ assert }) => {
    const url = 'https://www.procyclingstats.com/race/ronde-van-vlaanderen/2024/result'

    const result = await PCSTop10Scraper.getTop10(url)

    assert.isArray(result)
    assert.lengthOf(result, 10)

    for (const rider of result) {
      console.log(rider.name)
      assert.isNumber(rider.position)
      assert.isString(rider.name)
      assert.isString(rider.nationality)
      assert.isString(rider.team)
      assert.isString(rider.time)
    }
  })

  test('should throw an error for an invalid PCS result page URL', async ({ assert }) => {
    await assert.rejects(() =>
      PCSTop10Scraper.getTop10('https://pcs.invalid.com/fake/result')
    )
  })
})
