import { test } from '@japa/runner'
import PcsService from '#services/pcs_service'

const originalFetch = globalThis.fetch

function stubFetch(response: Partial<Response> | Error) {
  globalThis.fetch = (async () => {
    if (response instanceof Error) throw response
    return response as Response
  }) as typeof fetch
}

test.group('PcsService', (group) => {
  group.each.teardown(() => {
    globalThis.fetch = originalFetch
  })

  test('returns the parsed payload on a successful response', async ({ assert }) => {
    stubFetch({ ok: true, json: async () => [{ rider_name: 'Pogačar Tadej', rank: 1 }] })

    const results = await new PcsService().getStageResults('vuelta-a-espana', 2026, 1)

    assert.lengthOf(results, 1)
    assert.equal(results[0].rank, 1)
  })

  test('falls back to an empty list when the service answers an error status', async ({
    assert,
  }) => {
    stubFetch({ ok: false, status: 502 })

    assert.deepEqual(await new PcsService().getStageResults('vuelta-a-espana', 2026, 1), [])
  })

  test('falls back to an empty list when the service is unreachable', async ({ assert }) => {
    stubFetch(new Error('ECONNREFUSED'))

    assert.deepEqual(await new PcsService().getStartlist('vuelta-a-espana', 2026), [])
  })

  test('falls back to null for the race preview', async ({ assert }) => {
    stubFetch(new Error('ECONNREFUSED'))

    assert.isNull(await new PcsService().getRacePreview('vuelta-a-espana', 2026))
  })

  test('maps stage info to camelCase', async ({ assert }) => {
    stubFetch({
      ok: true,
      json: async () => [{ number: 1, name: 'Stage 1', date: '2026-08-22', profile_icon: 'p2' }],
    })

    const stages = await new PcsService().getStagesInfo('vuelta-a-espana', 2026)

    assert.deepEqual(stages, [
      { number: 1, name: 'Stage 1', date: '2026-08-22', profileIcon: 'p2' },
    ])
  })
})
