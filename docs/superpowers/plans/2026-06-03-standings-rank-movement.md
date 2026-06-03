# Standings Rank Movement + Form Trim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trim the "Ma forme" panel to points-only, and add a per-player rank-movement arrow (▲▼ since the last scored race) to the dashboard league standings.

**Architecture:** `getLeagueStandings` gains each member's previous rank (ranking on totals minus their points in the latest scored race) and exposes `rankDelta` via a pure, unit-tested `computeRankDeltas` helper. The web `LeagueStandingsPanel` renders an arrow from `rankDelta`. `FormPanel` drops its rank sparkline.

**Tech Stack:** AdonisJS v6 + Lucid (API), Japa (tests), React + Vite + TanStack Query v5 (web).

---

### Task 1: Pure `computeRankDeltas` helper

**Files:**
- Create: `apps/api/app/services/rank_movement.ts`
- Test: `apps/api/tests/unit/rank_movement.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/unit/rank_movement.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && node ace test unit --files="rank_movement"`
Expected: FAIL — cannot resolve `#services/rank_movement`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/api/app/services/rank_movement.ts`:

```ts
export function computeRankDeltas(
  currentRankByUser: Map<string, number>,
  previousRankByUser: Map<string, number>
): Map<string, number | null> {
  const deltas = new Map<string, number | null>()
  for (const [userId, currentRank] of currentRankByUser) {
    const previousRank = previousRankByUser.get(userId)
    deltas.set(userId, previousRank === undefined ? null : previousRank - currentRank)
  }
  return deltas
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && node ace test unit --files="rank_movement"`
Expected: PASS (4 passing).

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services/rank_movement.ts apps/api/tests/unit/rank_movement.spec.ts
git commit -m "feat(api): add computeRankDeltas helper"
```

---

### Task 2: Compute rankDelta in getLeagueStandings

**Files:**
- Modify: `apps/api/app/services/standings_service.ts`

`getLeagueStandings(leagueId)` currently returns `withSharedRanks([...current totals...], isTied)`. Add the previous rank (totals minus each member's points in the latest scored race) and attach `rankDelta`. Category standings methods are left unchanged (they will not carry `rankDelta`; the web type makes it optional — see Task 3).

- [ ] **Step 1: Import the helper**

At the top of `apps/api/app/services/standings_service.ts`, after the existing `import db from '@adonisjs/lucid/services/db'` line, add:

```ts
import { computeRankDeltas } from '#services/rank_movement'
```

- [ ] **Step 2: Attach rankDelta in getLeagueStandings**

In `getLeagueStandings`, replace the final `return this.withSharedRanks(...)` block:

```ts
    return this.withSharedRanks(
      result.rows.map((row) => ({
        userId: row.user_id,
        pseudo: row.pseudo,
        icon: row.icon,
        totalPoints: Number(row.total_points),
        racesPlayed: Number(row.races_played),
      })),
      (a, b) => a.totalPoints === b.totalPoints && a.racesPlayed === b.racesPlayed
    )
  }
```

with:

```ts
    const standings = this.withSharedRanks(
      result.rows.map((row) => ({
        userId: row.user_id,
        pseudo: row.pseudo,
        icon: row.icon,
        totalPoints: Number(row.total_points),
        racesPlayed: Number(row.races_played),
      })),
      (a, b) => a.totalPoints === b.totalPoints && a.racesPlayed === b.racesPlayed
    )

    const previousRankByUser = await this.getPreviousRankByUser(leagueId, standings)
    const currentRankByUser = new Map(standings.map((s) => [s.userId, s.rank]))
    const deltas = computeRankDeltas(currentRankByUser, previousRankByUser)

    return standings.map((s) => ({ ...s, rankDelta: deltas.get(s.userId) ?? null }))
  }

  private async getPreviousRankByUser(
    leagueId: string,
    standings: { userId: string; totalPoints: number }[]
  ): Promise<Map<string, number>> {
    const scoredRaces = await db
      .from('scores')
      .join('races', 'races.id', 'scores.race_id')
      .where('scores.league_id', leagueId)
      .distinct('scores.race_id')
      .select('scores.race_id', 'races.start_at')
      .orderBy('races.start_at', 'desc')

    if (scoredRaces.length < 2) return new Map()

    const latestRaceId = scoredRaces[0].race_id as string

    const latestScores = await db
      .from('scores')
      .where('league_id', leagueId)
      .where('race_id', latestRaceId)
      .select('user_id', 'points')

    const latestPointsByUser = new Map<string, number>(
      latestScores.map((s: any) => [s.user_id as string, Number(s.points)])
    )

    const previousTotals = standings
      .map((s) => ({
        userId: s.userId,
        totalPoints: s.totalPoints - (latestPointsByUser.get(s.userId) ?? 0),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)

    const ranked = this.withSharedRanks(previousTotals, (a, b) => a.totalPoints === b.totalPoints)
    return new Map(ranked.map((r) => [r.userId, r.rank]))
  }
```

(Note: `getPreviousRankByUser` is inserted as a new private method immediately after `getLeagueStandings`. It reuses the existing `withSharedRanks` private method.)

- [ ] **Step 3: Verify it compiles via the unit suite boot**

Run: `cd apps/api && node ace test unit --files="rank_movement"`
Expected: PASS (app boots and compiles `standings_service.ts`; the 4 helper tests still pass).

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/services/standings_service.ts
git commit -m "feat(api): compute league standings rank movement"
```

---

### Task 3: Web type + rank-movement arrow in the standings panel

**Files:**
- Modify: `apps/web/src/api/standings.ts`
- Modify: `apps/web/src/components/dashboard/LeagueStandingsPanel.tsx`

- [ ] **Step 1: Add rankDelta to the LeagueStanding type**

In `apps/web/src/api/standings.ts`, the `LeagueStanding` interface currently is:

```ts
export interface LeagueStanding {
  rank: number
  userId: string
  pseudo: string
  icon: string
  totalPoints: number
  racesPlayed: number
}
```

Add the optional field (optional so category standings without it still typecheck):

```ts
export interface LeagueStanding {
  rank: number
  userId: string
  pseudo: string
  icon: string
  totalPoints: number
  racesPlayed: number
  rankDelta?: number | null
}
```

- [ ] **Step 2: Render the arrow in LeagueStandingsPanel**

In `apps/web/src/components/dashboard/LeagueStandingsPanel.tsx`, add a small `RankArrow` component just above the `export default function LeagueStandingsPanel(...)` line:

```tsx
function RankArrow({ delta }: { delta?: number | null }) {
  if (!delta) return null
  const up = delta > 0
  return (
    <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: up ? '#82c99a' : '#f0816a' }}>
      {up ? '▲' : '▼'}
      {Math.abs(delta)}
    </span>
  )
}
```

Then, inside the row's `.s-name` block, render the arrow after the "Moi" badge. The current block is:

```tsx
                <div className="s-name">
                  {row.pseudo}
                  {isMe && <span className="me-badge">Moi</span>}
                </div>
```

Replace it with:

```tsx
                <div className="s-name">
                  {row.pseudo}
                  {isMe && <span className="me-badge">Moi</span>}
                  <RankArrow delta={row.rankDelta} />
                </div>
```

- [ ] **Step 3: Verify the web app typechecks and builds**

Run: `cd apps/web && pnpm build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/api/standings.ts apps/web/src/components/dashboard/LeagueStandingsPanel.tsx
git commit -m "feat(web): show rank movement arrow in league standings"
```

---

### Task 4: Trim FormPanel to points only

**Files:**
- Modify: `apps/web/src/components/dashboard/FormPanel.tsx`

Remove the rank section: the `RankLine` component, the `ordinal` function, the `ranks`/`rankDelta` computations, and the rank row in the JSX. Keep the points bars, points summary + `Delta`, and the loading/empty states.

- [ ] **Step 1: Replace the file with the points-only version**

Replace the entire contents of `apps/web/src/components/dashboard/FormPanel.tsx` with:

```tsx
import { useQuery } from '@tanstack/react-query'
import { formApi } from '../../api/form'
import { useLeague } from '../../hooks/useLeague'

const UP = '#82c99a'
const DOWN = '#f0816a'
const POINTS_COLOR = '#5b9cf6'
const MUTED = 'rgba(240,237,232,0.4)'

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

export default function FormPanel() {
  const { activeLeague } = useLeague()

  const { data: races = [], isLoading } = useQuery({
    queryKey: ['form', 'league', activeLeague?.id],
    queryFn: () => formApi.league(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })

  const points = races.map((e) => e.points)
  const last = races[races.length - 1]
  const prev = races[races.length - 2]
  const pointsDelta = last && prev ? last.points - prev.points : 0

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
        <div style={{ padding: '0.5rem 1.25rem 1rem' }}>
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
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the web app typechecks and builds**

Run: `cd apps/web && pnpm build`
Expected: build succeeds with no TypeScript errors (no unused-variable errors — `RankLine`/`ordinal`/`ranks` are gone).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/FormPanel.tsx
git commit -m "feat(web): trim FormPanel to points only"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the API test suite**

Run: `cd apps/api && node ace test`
Expected: all tests pass (including the new `rank_movement` unit tests).

- [ ] **Step 2: Build the web app**

Run: `cd apps/web && pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke test (recommended)**

Start the stack (`pnpm dev` from the repo root), open the dashboard for a league with at least 2 scored races, and confirm:
- the league standings show ▲/▼ arrows next to players who moved since the last scored race (none for unchanged players),
- the "Ma forme" panel now shows only the points bars (no rank graph).

---

## Notes

- **rankDelta semantics:** `previousRank − currentRank` (positive = gained places, shown ▲). Previous rank = ranking on totals minus each member's points in the latest scored race; `null` when fewer than 2 scored races. See `docs/superpowers/specs/2026-06-03-standings-rank-movement-design.md`.
- **Why optional `rankDelta?`:** keeps the category standings methods (monuments, grand-tours, …) untouched — they simply omit the field, which the panel treats as "no arrow" (`!delta`).
- **Why no DB-seeded API test:** the only non-trivial pure logic (delta computation) is unit-tested via `computeRankDeltas` (Task 1). The previous-rank query in `getPreviousRankByUser` is thin data access, verified by typecheck + the API test run.
- **Out of scope:** `StandingsPage`, category standings (no arrow), other dashboard panels.
