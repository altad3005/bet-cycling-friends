# Dashboard "Ma forme" Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dashboard "Ma forme" panel showing the connected player's points per race and league-rank evolution over their last 5 scored races.

**Architecture:** A new lightweight endpoint `GET /leagues/:id/form` returns the user's last-5 scored races with `{ raceId, raceName, points, rank }`. A pure `computeFormHistory` helper (unit-tested) computes cumulative league rank after each race; `FormService` fetches the data and calls it. The dashboard renders a `FormPanel` with hand-rolled SVG sparklines.

**Tech Stack:** AdonisJS v6 + Lucid (API), Japa (tests), React + Vite + `@tanstack/react-query` v5 (web).

---

### Task 1: Pure `computeFormHistory` helper

**Files:**
- Create: `apps/api/app/services/form_history.ts`
- Test: `apps/api/tests/unit/form_history.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/unit/form_history.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && node ace test unit --files="form_history"`
Expected: FAIL — cannot resolve `#services/form_history`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/api/app/services/form_history.ts`:

```ts
export interface FormEntry {
  raceId: string
  raceName: string
  points: number
  rank: number
}

interface RaceRef {
  id: string
  name: string
}

interface ScoreRow {
  raceId: string
  userId: string
  points: number
}

export function computeFormHistory(
  races: RaceRef[],
  scores: ScoreRow[],
  memberIds: string[],
  userId: string
): FormEntry[] {
  const cumulative = new Map<string, number>()
  for (const id of memberIds) cumulative.set(id, 0)

  const history: FormEntry[] = []
  for (const race of races) {
    const raceScores = scores.filter((s) => s.raceId === race.id)
    for (const s of raceScores) {
      cumulative.set(s.userId, (cumulative.get(s.userId) ?? 0) + s.points)
    }

    const userTotal = cumulative.get(userId) ?? 0
    let rank = 1
    for (const id of memberIds) {
      if ((cumulative.get(id) ?? 0) > userTotal) rank++
    }

    const userPoints = raceScores.find((s) => s.userId === userId)?.points ?? 0
    history.push({ raceId: race.id, raceName: race.name, points: userPoints, rank })
  }

  return history
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && node ace test unit --files="form_history"`
Expected: PASS (4 passing).

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services/form_history.ts apps/api/tests/unit/form_history.spec.ts
git commit -m "feat(api): add computeFormHistory helper"
```

---

### Task 2: FormService

**Files:**
- Create: `apps/api/app/services/form_service.ts`

This mirrors the data-access pattern of `apps/api/app/services/stats_service.ts` (members from `league_members`, league races joined to `races` ordered by `races.start_at`, scores from `scores` with `points` cast via `Number()`).

- [ ] **Step 1: Write the service**

Create `apps/api/app/services/form_service.ts`:

```ts
import db from '@adonisjs/lucid/services/db'
import { computeFormHistory, type FormEntry } from '#services/form_history'

export default class FormService {
  async getUserForm(leagueId: string, userId: string, limit = 5): Promise<FormEntry[]> {
    const members = await db.from('league_members').where('league_id', leagueId).select('user_id')
    const memberIds = members.map((m: any) => m.user_id as string)
    if (memberIds.length === 0) return []

    const raceRows = await db
      .from('league_races')
      .join('races', 'races.id', 'league_races.race_id')
      .where('league_races.league_id', leagueId)
      .orderBy('races.start_at', 'asc')
      .select('races.id', 'races.name')

    const raceIds = raceRows.map((r: any) => r.id as string)
    if (raceIds.length === 0) return []

    const scoreRows = await db
      .from('scores')
      .where('scores.league_id', leagueId)
      .whereIn('scores.race_id', raceIds)
      .select('scores.race_id', 'scores.user_id', 'scores.points')

    const scores = scoreRows.map((s: any) => ({
      raceId: s.race_id as string,
      userId: s.user_id as string,
      points: Number(s.points),
    }))

    const scoredRaceIds = new Set(scores.map((s) => s.raceId))
    const races = raceRows
      .filter((r: any) => scoredRaceIds.has(r.id as string))
      .map((r: any) => ({ id: r.id as string, name: r.name as string }))

    const history = computeFormHistory(races, scores, memberIds, userId)
    return history.slice(-limit)
  }
}
```

- [ ] **Step 2: Verify it compiles via the unit suite boot**

Run: `cd apps/api && node ace test unit --files="form_history"`
Expected: PASS (the app boots and compiles `form_service.ts` through the `#services` graph; the 4 helper tests still pass).

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/services/form_service.ts
git commit -m "feat(api): add FormService for user race form"
```

---

### Task 3: FormController + route

**Files:**
- Create: `apps/api/app/controllers/form_controller.ts`
- Modify: `apps/api/start/routes.ts`

- [ ] **Step 1: Write the controller**

Create `apps/api/app/controllers/form_controller.ts`:

```ts
import type { HttpContext } from '@adonisjs/core/http'

export default class FormController {
  async leagueForm({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { default: FormService } = await import('#services/form_service')
    const races = await new FormService().getUserForm(params.id, user.id)
    return response.ok({ data: { races } })
  }
}
```

- [ ] **Step 2: Register the route**

In `apps/api/start/routes.ts`, locate the existing feed route:

```ts
    router
      .get('/leagues/:id/feed', [controllers.Feed, 'leagueFeed'])
      .use(middleware.auth())
```

Add immediately after it:

```ts
    router
      .get('/leagues/:id/form', [controllers.Form, 'leagueForm'])
      .use(middleware.auth())
```

- [ ] **Step 3: Regenerate codegen and verify the route resolves**

`controllers.Form` comes from the generated `#generated/controllers` registry. Running the test command triggers AdonisJS codegen, which picks up the new `form_controller.ts`.

Run: `cd apps/api && node ace test unit --files="form_history"`
Expected: app boots (log shows `codegen: created ... file(s)`), 4 tests PASS, no error about `controllers.Form`.

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/controllers/form_controller.ts apps/api/start/routes.ts
git commit -m "feat(api): expose GET /leagues/:id/form"
```

---

### Task 4: Web feed API client for form

**Files:**
- Create: `apps/web/src/api/form.ts`

- [ ] **Step 1: Write the client**

Create `apps/web/src/api/form.ts`:

```ts
import { api } from './client'

export interface FormEntry {
  raceId: string
  raceName: string
  points: number
  rank: number
}

export const formApi = {
  league: (leagueId: string) =>
    api.get<{ data: { races: FormEntry[] } }>(`/leagues/${leagueId}/form`),
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/api/form.ts
git commit -m "feat(web): add form API client"
```

---

### Task 5: FormPanel component

**Files:**
- Create: `apps/web/src/components/dashboard/FormPanel.tsx`

Reuses the existing `.panel` / `.panel-head` / `.panel-title` CSS classes (same as `ActivityFeedPanel.tsx`). Sparklines are hand-rolled SVG — no chart library.

- [ ] **Step 1: Write the component**

Create `apps/web/src/components/dashboard/FormPanel.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query'
import { formApi } from '../../api/form'
import { useLeague } from '../../hooks/useLeague'

const UP = '#82c99a'
const DOWN = '#f0816a'
const POINTS_COLOR = '#5b9cf6'
const RANK_COLOR = '#e8c96d'
const MUTED = 'rgba(240,237,232,0.4)'

function ordinal(rank: number): string {
  return rank === 1 ? '1er' : `${rank}e`
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <span style={{ color: MUTED, fontSize: 12 }}>=</span>
  const good = value > 0
  return (
    <span style={{ color: good ? UP : DOWN, fontSize: 12, fontWeight: 600 }}>
      {good ? '▲+' : '▼'}
      {value}
    </span>
  )
}

function PointsBars({ points }: { points: number[] }) {
  const W = 120
  const H = 36
  const gap = 4
  const n = points.length
  const barW = (W - gap * (n - 1)) / n
  const max = Math.max(...points, 1)
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {points.map((p, i) => {
        const h = Math.max(2, (p / max) * H)
        return <rect key={i} x={i * (barW + gap)} y={H - h} width={barW} height={h} rx={2} fill={POINTS_COLOR} />
      })}
    </svg>
  )
}

function RankLine({ ranks }: { ranks: number[] }) {
  const W = 120
  const H = 36
  const pad = 4
  const n = ranks.length
  const min = Math.min(...ranks)
  const max = Math.max(...ranks)
  const span = max - min || 1
  const x = (i: number) => (n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1))
  const y = (r: number) => pad + ((r - min) / span) * (H - 2 * pad)
  const pts = ranks.map((r, i) => `${x(i)},${y(r)}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {n > 1 && (
        <polyline points={pts} fill="none" stroke={RANK_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {ranks.map((r, i) => (
        <circle key={i} cx={x(i)} cy={y(r)} r={3} fill={RANK_COLOR} />
      ))}
    </svg>
  )
}

export default function FormPanel() {
  const { activeLeague } = useLeague()

  const { data: races = [], isLoading } = useQuery({
    queryKey: ['form', 'league', activeLeague?.id],
    queryFn: () => formApi.league(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })

  const points = races.map((e) => e.points)
  const ranks = races.map((e) => e.rank)
  const last = races[races.length - 1]
  const prev = races[races.length - 2]
  const pointsDelta = last && prev ? last.points - prev.points : 0
  const rankDelta = last && prev ? prev.rank - last.rank : 0

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Ma forme</div>
      </div>

      {isLoading ? (
        <div style={{ padding: '1.5rem 1.25rem', textAlign: 'center', fontSize: 13, color: MUTED }}>Chargement…</div>
      ) : races.length === 0 ? (
        <div style={{ padding: '1.5rem 1.25rem', textAlign: 'center', fontSize: 13, color: MUTED }}>
          Pas encore de résultats cette saison.
        </div>
      ) : (
        <div style={{ padding: '0.5rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Points · {races.length} dernières courses</div>
              <PointsBars points={points} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8' }}>{last.points} pts</div>
              <Delta value={pointsDelta} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Rang ligue · plus haut = mieux</div>
              <RankLine ranks={ranks} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0ede8' }}>{ordinal(last.rank)}</div>
              <Delta value={rankDelta} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the web app typechecks and builds**

Run: `cd apps/web && pnpm build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/FormPanel.tsx
git commit -m "feat(web): add FormPanel dashboard component"
```

---

### Task 6: Wire FormPanel into the dashboard

**Files:**
- Modify: `apps/web/src/pages/HomePage.tsx`

- [ ] **Step 1: Add the import**

In `apps/web/src/pages/HomePage.tsx`, after the existing dashboard component imports (next to the line `import StatGrid from '../components/dashboard/StatGrid'`), add:

```tsx
import FormPanel from '../components/dashboard/FormPanel'
```

- [ ] **Step 2: Render the panel after StatGrid**

In the returned JSX, locate:

```tsx
      <StatGrid
        myStanding={myStanding}
        leaderStanding={leaderStanding}
        memberCount={activeLeague.memberCount ?? 0}
        userId={user?.id ?? ''}
      />
```

Add immediately after the closing `/>`:

```tsx
      <FormPanel />
```

- [ ] **Step 3: Verify the web app typechecks and builds**

Run: `cd apps/web && pnpm build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/HomePage.tsx
git commit -m "feat(web): show FormPanel on the dashboard"
```

---

### Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the API test suite**

Run: `cd apps/api && node ace test`
Expected: all tests pass (including the new `form_history` unit tests).

- [ ] **Step 2: Build the web app**

Run: `cd apps/web && pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke test (recommended)**

Start the stack (`pnpm dev` from the repo root), open the dashboard for a league with scored races, and confirm the "Ma forme" panel shows the points bars and rank line for the last 5 scored races with correct current value + delta. Confirm the empty state appears for a league with no scored races yet.

---

## Notes

- **Rank semantics:** rank after a race = `1 + (members with strictly greater cumulative points)`; ties share the better rank. See `docs/superpowers/specs/2026-06-03-dashboard-form-panel-design.md`.
- **Deltas** (front-side): points = last − previous race; rank = previous − last (positive = places gained, shown ▲).
- **Why no DB-seeded API test:** the only non-trivial logic (cumulative points + rank) is unit-tested in isolation via `computeFormHistory` (Task 1). The service/controller are thin wiring, verified by typecheck and the API test run.
- **Out of scope:** cross-league global ranking; chart library; changes to other dashboard panels.
