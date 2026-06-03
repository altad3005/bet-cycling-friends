import { test } from '@japa/runner'
import { paginate } from '#services/pagination'

const items = [1, 2, 3, 4, 5]

test.group('paginate', () => {
  test('returns the first page and flags more', ({ assert }) => {
    const page = paginate(items, 2, 0)
    assert.deepEqual(page.items, [1, 2])
    assert.isTrue(page.hasMore)
  })

  test('returns a middle page and flags more', ({ assert }) => {
    const page = paginate(items, 2, 2)
    assert.deepEqual(page.items, [3, 4])
    assert.isTrue(page.hasMore)
  })

  test('flags no more on the last partial page', ({ assert }) => {
    const page = paginate(items, 2, 4)
    assert.deepEqual(page.items, [5])
    assert.isFalse(page.hasMore)
  })

  test('flags no more when offset + limit equals length', ({ assert }) => {
    const page = paginate(items, 5, 0)
    assert.deepEqual(page.items, [1, 2, 3, 4, 5])
    assert.isFalse(page.hasMore)
  })

  test('returns empty page past the end', ({ assert }) => {
    const page = paginate(items, 2, 10)
    assert.deepEqual(page.items, [])
    assert.isFalse(page.hasMore)
  })
})
