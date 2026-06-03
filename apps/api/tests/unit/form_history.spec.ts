import { test } from '@japa/runner'
import { computeFormHistory } from '#services/form_history'

const races = [
  { id: 'r1', name: 'Race 1' },
  { id: 'r2', name: 'Race 2' },
  { id: 'r3', name: 'Race 3' },
]
const members = ['u1', 'u2', 'u3']

test.group('computeFormHistory', () => {
  test('returns points and cumulative rank per race for the user', ({ assert }) => {
    const scores = [
      { raceId: 'r1', userId: 'u1', points: 10 },
      { raceId: 'r1', userId: 'u2', points: 20 },
      { raceId: 'r2', userId: 'u1', points: 30 },
      { raceId: 'r2', userId: 'u2', points: 5 },
    ]
    const history = computeFormHistory(races.slice(0, 2), scores, members, 'u1')
    assert.deepEqual(history, [
      { raceId: 'r1', raceName: 'Race 1', points: 10, rank: 2 },
      { raceId: 'r2', raceName: 'Race 2', points: 30, rank: 1 },
    ])
  })

  test('treats a user absent from a race as 0 points but still ranks them', ({ assert }) => {
    const scores = [
      { raceId: 'r1', userId: 'u2', points: 15 },
      { raceId: 'r1', userId: 'u3', points: 5 },
    ]
    const history = computeFormHistory(races.slice(0, 1), scores, members, 'u1')
    assert.deepEqual(history, [{ raceId: 'r1', raceName: 'Race 1', points: 0, rank: 3 }])
  })

  test('gives tied cumulative totals the same rank', ({ assert }) => {
    const scores = [
      { raceId: 'r1', userId: 'u1', points: 10 },
      { raceId: 'r1', userId: 'u2', points: 10 },
      { raceId: 'r1', userId: 'u3', points: 5 },
    ]
    const history = computeFormHistory(races.slice(0, 1), scores, members, 'u1')
    assert.equal(history[0].rank, 1)
  })

  test('returns an empty array when there are no races', ({ assert }) => {
    assert.deepEqual(computeFormHistory([], [], members, 'u1'), [])
  })
})
