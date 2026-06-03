import { test } from '@japa/runner'
import { computeRankDeltas } from '#services/rank_movement'

test.group('computeRankDeltas', () => {
  test('positive delta when a member moved up', ({ assert }) => {
    const current = new Map([['u1', 3]])
    const previous = new Map([['u1', 5]])
    assert.equal(computeRankDeltas(current, previous).get('u1'), 2)
  })

  test('negative delta when a member moved down', ({ assert }) => {
    const current = new Map([['u1', 4]])
    const previous = new Map([['u1', 2]])
    assert.equal(computeRankDeltas(current, previous).get('u1'), -2)
  })

  test('zero delta when the rank is unchanged', ({ assert }) => {
    const current = new Map([['u1', 3]])
    const previous = new Map([['u1', 3]])
    assert.equal(computeRankDeltas(current, previous).get('u1'), 0)
  })

  test('null when the member has no previous rank', ({ assert }) => {
    const current = new Map([['u1', 3]])
    const previous = new Map<string, number>()
    assert.isNull(computeRankDeltas(current, previous).get('u1'))
  })
})
