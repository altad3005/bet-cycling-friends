# Activity Feed Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add infinite-scroll pagination (batches of 20) to the activity feed page, backed by offset-based pagination in the feed API.

**Architecture:** The `FeedService` keeps aggregating all events in memory and sorting them once. A new pure `paginate` helper slices the sorted array by `offset`/`limit` and reports `hasMore`. The controller exposes `offset` and returns `{ events, hasMore }`. The web `FeedPage` uses React Query's `useInfiniteQuery` plus an `IntersectionObserver` sentinel to load the next batch on scroll.

**Tech Stack:** AdonisJS v6 + Lucid (API), Japa (tests), React + Vite + `@tanstack/react-query` v5 (web).

---

### Task 1: Pure `paginate` helper

**Files:**
- Create: `apps/api/app/services/pagination.ts`
- Test: `apps/api/tests/unit/pagination.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/unit/pagination.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && node ace test unit --files="pagination"`
Expected: FAIL — cannot resolve `#services/pagination`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/api/app/services/pagination.ts`:

```ts
export interface Page<T> {
  items: T[]
  hasMore: boolean
}

export function paginate<T>(items: T[], limit: number, offset: number): Page<T> {
  return {
    items: items.slice(offset, offset + limit),
    hasMore: offset + limit < items.length,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && node ace test unit --files="pagination"`
Expected: PASS (5 passing).

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services/pagination.ts apps/api/tests/unit/pagination.spec.ts
git commit -m "feat(api): add pure paginate helper"
```

---

### Task 2: Paginate the feed service

**Files:**
- Modify: `apps/api/app/services/feed_service.ts`

The current method has two `return` points (the no-races/no-members guard at line 54-56, and the final return at line 123-125) that each sort and `slice(0, limit)`. Restructure to a single return that sorts once and delegates to `paginate`.

- [ ] **Step 1: Change the signature and return type**

In `apps/api/app/services/feed_service.ts`, add the import at the top (after the existing `db` import):

```ts
import { paginate } from '#services/pagination'
```

Change the method signature (line 22) from:

```ts
  async getLeagueFeed(leagueId: string, limit = 20): Promise<FeedEvent[]> {
```

to:

```ts
  async getLeagueFeed(
    leagueId: string,
    limit = 20,
    offset = 0
  ): Promise<{ events: FeedEvent[]; hasMore: boolean }> {
```

- [ ] **Step 2: Replace the early-return guard with a conditional block**

Replace the guard (current lines 54-56):

```ts
    if (raceIds.length === 0 || memberIds.length === 0) {
      return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit)
    }
```

with an opening `if` that wraps the bet + results computation:

```ts
    if (raceIds.length > 0 && memberIds.length > 0) {
```

- [ ] **Step 3: Close the conditional block and replace the final return**

The bet-placed and results-published sections (current lines 58-121) now live inside that `if` block. Close the block, then replace the final return (current lines 123-125):

```ts
    return events
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, limit)
```

with:

```ts
    }

    const sorted = events.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    )
    const page = paginate(sorted, limit, offset)
    return { events: page.items, hasMore: page.hasMore }
```

(The `}` closes the `if (raceIds.length > 0 && memberIds.length > 0)` block opened in Step 2.)

- [ ] **Step 4: Verify the file typechecks**

Run: `cd apps/api && node ace test unit --files="pagination"`
Expected: PASS (the existing unit suite still compiles and passes; the service now imports `paginate`).

Then sanity-check the whole API typechecks:

Run: `cd apps/api && npx tsc --noEmit`
Expected: no errors related to `feed_service.ts`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services/feed_service.ts
git commit -m "feat(api): paginate league feed with offset and hasMore"
```

---

### Task 3: Expose offset + hasMore in the controller

**Files:**
- Modify: `apps/api/app/controllers/feed_controller.ts`

- [ ] **Step 1: Parse offset and return hasMore**

Replace the entire body of `apps/api/app/controllers/feed_controller.ts` with:

```ts
import type { HttpContext } from '@adonisjs/core/http'

export default class FeedController {
  async leagueFeed({ params, request, response }: HttpContext) {
    const limit = Math.min(Number(request.qs().limit) || 20, 50)
    const offset = Math.max(Number(request.qs().offset) || 0, 0)
    const { default: FeedService } = await import('#services/feed_service')
    const { events, hasMore } = await new FeedService().getLeagueFeed(params.id, limit, offset)
    return response.ok({ data: { events, hasMore } })
  }
}
```

- [ ] **Step 2: Verify the API typechecks**

Run: `cd apps/api && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/controllers/feed_controller.ts
git commit -m "feat(api): accept feed offset and return hasMore"
```

---

### Task 4: Update the web feed API client

**Files:**
- Modify: `apps/web/src/api/feed.ts`

- [ ] **Step 1: Change the request signature and response type**

Replace the `feedApi` export at the bottom of `apps/web/src/api/feed.ts` (current lines 18-23) with:

```ts
export interface FeedPage {
  events: FeedEvent[]
  hasMore: boolean
}

export const feedApi = {
  league: (leagueId: string, params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.limit != null) qs.set('limit', String(params.limit))
    if (params?.offset != null) qs.set('offset', String(params.offset))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return api.get<{ data: FeedPage }>(`/leagues/${leagueId}/feed${suffix}`)
  },
}
```

(Keep the existing `FeedEvent` interface and `FeedEventType` type above unchanged.)

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/api/feed.ts
git commit -m "feat(web): feedApi supports limit/offset and returns hasMore"
```

(Typecheck happens in Tasks 5-6 once the call sites are updated — updating the signature alone breaks the two existing callers, which the next tasks fix.)

---

### Task 5: Infinite scroll on the feed page

**Files:**
- Modify: `apps/web/src/pages/FeedPage.tsx`

- [ ] **Step 1: Update the imports**

In `apps/web/src/pages/FeedPage.tsx`, change line 1 from:

```ts
import { useQuery } from '@tanstack/react-query'
```

to:

```ts
import { useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
```

- [ ] **Step 2: Replace the query and add the scroll sentinel logic**

Replace the component body (current lines 100-126, the whole `export default function FeedPage() { ... }`) with:

```tsx
const PAGE_SIZE = 20

export default function FeedPage() {
  const { activeLeague } = useLeague()

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed', 'league', activeLeague?.id],
    queryFn: ({ pageParam }) =>
      feedApi
        .league(activeLeague!.id, { limit: PAGE_SIZE, offset: pageParam })
        .then((r) => r.data.data),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * PAGE_SIZE : undefined,
    enabled: !!activeLeague,
  })

  const events = data?.pages.flatMap((p) => p.events) ?? []

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <AppShell activePage="dashboard" pageTitle="Activité" backPath="-1">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 1rem 2rem' }}>
        <div style={{ background: '#131318', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', fontSize: 13, color: 'rgba(240,237,232,0.3)' }}>Chargement…</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', fontSize: 13, color: 'rgba(240,237,232,0.3)' }}>Aucune activité pour l'instant.</div>
          ) : (
            <>
              {events.map((event, i) => (
                <FeedEventCard key={`${event.type}-${event.at}-${i}`} event={event} isLast={i === events.length - 1} />
              ))}
              <div ref={sentinelRef} style={{ height: 1 }} />
              {isFetchingNextPage && (
                <div style={{ textAlign: 'center', padding: '1rem', fontSize: 12, color: 'rgba(240,237,232,0.3)' }}>Chargement…</div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 3: Verify the web app typechecks and builds**

Run: `cd apps/web && pnpm build`
Expected: build succeeds with no TypeScript errors. (HomePage still uses the old signature here and will error — proceed to Task 6, then re-run; OR do Task 6 before building. If building now fails only on `HomePage.tsx`, that is expected and fixed in Task 6.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/FeedPage.tsx
git commit -m "feat(web): infinite scroll on the activity feed page"
```

---

### Task 6: Update the dashboard feed preview

**Files:**
- Modify: `apps/web/src/pages/HomePage.tsx`

- [ ] **Step 1: Update the feed query and the panel props**

In `apps/web/src/pages/HomePage.tsx`, replace the feed query (current lines 39-43):

```tsx
  const { data: feedEvents = [] } = useQuery({
    queryKey: ['feed', 'league', activeLeague?.id, 5],
    queryFn: () => feedApi.league(activeLeague!.id, 5).then((r) => r.data.data.events),
    enabled: !!activeLeague,
  })
```

with:

```tsx
  const { data: feed } = useQuery({
    queryKey: ['feed', 'league', activeLeague?.id, 'preview'],
    queryFn: () => feedApi.league(activeLeague!.id, { limit: 5 }).then((r) => r.data.data),
    enabled: !!activeLeague,
  })
  const feedEvents = feed?.events ?? []
```

Then update the `ActivityFeedPanel` usage (current line 110):

```tsx
      <ActivityFeedPanel events={feedEvents} hasMore={feedEvents.length >= 5} />
```

to use the real flag from the API:

```tsx
      <ActivityFeedPanel events={feedEvents} hasMore={feed?.hasMore ?? false} />
```

- [ ] **Step 2: Verify the web app typechecks and builds**

Run: `cd apps/web && pnpm build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/HomePage.tsx
git commit -m "feat(web): use real hasMore flag for dashboard feed preview"
```

---

### Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the API test suite**

Run: `cd apps/api && node ace test`
Expected: all tests pass (including the new `pagination` unit tests).

- [ ] **Step 2: Build the web app**

Run: `cd apps/web && pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Manual smoke test (optional but recommended)**

Start the stack (`pnpm dev` from the repo root), open `/feed` for a league with more than 20 events, and confirm that scrolling to the bottom loads the next batch and that scrolling stops loading once all events are shown. Confirm the dashboard "Activité récente" panel still shows a 5-event preview with the "Voir tout" link.

---

## Notes

- **Pagination strategy:** offset-based. The service recomputes the full event set per request, which is cheap for a league (≤ 20 members, limited races). See the design doc `docs/superpowers/specs/2026-06-02-activity-feed-pagination-design.md`.
- **Out of scope:** moving the duplicated `FeedEvent` type into `@bcf/shared`; changing `ActivityFeedPanel` behaviour (stays a preview).
- **Why no DB-seeded feed test:** the slicing/`hasMore` logic (the only new behaviour) is unit-tested in isolation via `paginate` (Task 1). The service/controller changes are pure wiring, verified by typecheck and the existing API test run.
