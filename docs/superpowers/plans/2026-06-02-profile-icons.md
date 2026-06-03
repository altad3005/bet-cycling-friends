# Profile Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each user pick a cycling-themed profile icon that replaces their initials everywhere their avatar is shown, with initials as the fallback when no icon is chosen.

**Architecture:** The catalog of valid icon ids lives in `@bcf/shared` (single source of truth, consumed by both API validation and the web app). SVG assets live in the web app. The chosen icon id is stored in the existing `users.icon` column. A single `Avatar` React component centralizes the icon-or-initials rendering and replaces the ~12 ad-hoc avatar renders.

**Tech Stack:** AdonisJS v6 + VineJS + Lucid (API), Japa (`@japa/api-client` + `authApiClient`) for backend tests, React + Vite (web), `@bcf/shared` (TS, compiled to `dist/` via `tsc`).

**Spec:** `docs/superpowers/specs/2026-06-02-profile-icons-design.md`

**Note on frontend tests:** `apps/web` has no test harness. Frontend tasks are verified manually (the spec accepts this). Backend gets automated Japa functional tests.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `packages/shared/src/constants.ts` (modify) | `PROFILE_ICONS` catalog + `ProfileIcon` type |
| `apps/api/database/migrations/<ts>_alter_users_icon_default.ts` (create) | Default `icon` → `''`, reset existing `'cyclist'` rows |
| `apps/api/app/controllers/profile_controller.ts` (modify) | Accept + validate + persist `icon` |
| `apps/api/tests/functional/profile_icon.spec.ts` (create) | Functional tests for icon update |
| `apps/web/src/api/auth.ts` (modify) | `updateProfile` sends `icon` |
| `apps/web/src/components/profileIcons.tsx` (create) | `Record<ProfileIcon, ReactNode>` SVG registry |
| `apps/web/src/components/Avatar.tsx` (create) | Centralized icon-or-initials avatar |
| `apps/web/src/components/ProfileIconPicker.tsx` (create) | Clickable selection grid |
| `apps/web/src/pages/ProfilePage.tsx` (modify) | Icon section: preview + picker + save |
| ~12 avatar render sites (modify) | Use `<Avatar>` |

---

## Task 1: Add the shared icon catalog

**Files:**
- Modify: `packages/shared/src/constants.ts`

- [ ] **Step 1: Append the catalog to constants.ts**

Add at the end of `packages/shared/src/constants.ts`:

```ts
export const PROFILE_ICONS = [
  'bike-road',
  'bike-mtb',
  'helmet',
  'wheel',
  'jersey-yellow',
  'jersey-polka',
  'jersey-green',
  'cyclist',
  'mountain',
  'trophy',
  'medal',
  'stopwatch',
] as const

export type ProfileIcon = (typeof PROFILE_ICONS)[number]
```

- [ ] **Step 2: Rebuild the shared package**

Run: `pnpm --filter @bcf/shared build`
Expected: succeeds, `packages/shared/dist/constants.js` now contains `PROFILE_ICONS`.

- [ ] **Step 3: Verify the export is visible**

Run: `grep -c "PROFILE_ICONS" packages/shared/dist/constants.js`
Expected: `1` or more.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/constants.ts packages/shared/dist
git commit -m "feat(shared): add PROFILE_ICONS catalog"
```

---

## Task 2: Migration — default icon to empty, reset existing defaults

**Files:**
- Create: `apps/api/database/migrations/<timestamp>_alter_users_icon_default.ts`

- [ ] **Step 1: Generate the migration file**

Run: `cd apps/api && node ace make:migration alter_users_icon_default --table=users`
Expected: creates a new file under `apps/api/database/migrations/`.

- [ ] **Step 2: Write the migration**

Replace the generated file contents with:

```ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('icon', 50).notNullable().defaultTo('').alter()
    })
    this.defer(async (db) => {
      await db.from(this.tableName).where('icon', 'cyclist').update({ icon: '' })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('icon', 50).notNullable().defaultTo('cyclist').alter()
    })
  }
}
```

- [ ] **Step 3: Run the migration**

Run: `cd apps/api && node ace migration:run`
Expected: migration `alter_users_icon_default` completed.

- [ ] **Step 4: Verify the data reset**

Run (from repo root): `docker compose -f docker-compose.dev.yml exec -T postgres psql -U bcf -d bcf_dev -c "SELECT count(*) FROM users WHERE icon = 'cyclist';"`
Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/database/migrations
git commit -m "feat(api): default user icon to empty (initials fallback)"
```

---

## Task 3: Backend — validate and persist the icon

**Files:**
- Modify: `apps/api/app/controllers/profile_controller.ts`
- Create: `apps/api/tests/functional/profile_icon.spec.ts`

- [ ] **Step 1: Write the failing functional test**

Create `apps/api/tests/functional/profile_icon.spec.ts`:

```ts
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'

test.group('Profile icon update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createUser() {
    return User.create({
      email: `u${Date.now()}@test.dev`,
      pseudo: 'Tester',
      passwordHash: await hash.make('password123'),
    })
  }

  test('updates the icon with a valid value', async ({ client, assert }) => {
    const user = await createUser()

    const response = await client
      .put('/api/account/profile')
      .json({ pseudo: 'Tester', icon: 'jersey-yellow' })
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: { icon: 'jersey-yellow' } })

    await user.refresh()
    assert.equal(user.icon, 'jersey-yellow')
  })

  test('rejects an unknown icon value', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .put('/api/account/profile')
      .json({ pseudo: 'Tester', icon: 'not-a-real-icon' })
      .loginAs(user)

    response.assertStatus(422)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/api && node ace test functional --files=profile_icon`
Expected: the "valid value" test FAILS (icon not persisted / not echoed) and/or the "unknown" test FAILS with status 200 instead of 422.

- [ ] **Step 3: Implement validation + persistence**

In `apps/api/app/controllers/profile_controller.ts`:

Add the import near the top (with the other imports):

```ts
import { PROFILE_ICONS } from '@bcf/shared'
```

Replace the validator:

```ts
const updateProfileValidator = vine.compile(
  vine.object({
    pseudo: vine.string().trim().minLength(2).maxLength(50),
    icon: vine.enum(PROFILE_ICONS).optional(),
  })
)
```

Replace the body of `update`:

```ts
  async update({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { pseudo, icon } = await request.validateUsing(updateProfileValidator)
    user.pseudo = pseudo
    if (icon !== undefined) {
      user.icon = icon
    }
    await user.save()
    return serialize(UserTransformer.transform(user))
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/api && node ace test functional --files=profile_icon`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/controllers/profile_controller.ts apps/api/tests/functional/profile_icon.spec.ts
git commit -m "feat(api): validate and persist profile icon"
```

---

## Task 4: Frontend API — send the icon

**Files:**
- Modify: `apps/web/src/api/auth.ts`

- [ ] **Step 1: Update `updateProfile` signature**

In `apps/web/src/api/auth.ts`, replace the `updateProfile` method:

```ts
  updateProfile: (pseudo: string, icon?: string) =>
    api.put<{ data: User }>('/account/profile', icon === undefined ? { pseudo } : { pseudo, icon }),
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd apps/web && pnpm build`
Expected: build succeeds (no TS errors from this file).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/api/auth.ts
git commit -m "feat(web): updateProfile accepts an icon"
```

---

## Task 5: Frontend — SVG icon registry

**Files:**
- Create: `apps/web/src/components/profileIcons.tsx`

- [ ] **Step 1: Create the registry**

Create `apps/web/src/components/profileIcons.tsx`. Each value is the inner SVG markup; the `Avatar` component wraps it in an `<svg>` with `stroke="currentColor"`.

```tsx
import type { ReactNode } from 'react'
import type { ProfileIcon } from '@bcf/shared'

export const PROFILE_ICON_PATHS: Record<ProfileIcon, ReactNode> = {
  'bike-road': (
    <>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </>
  ),
  'bike-mtb': (
    <>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M5.5 17.5 9 9h6l3 8.5M9 9 7.5 6H5.5M15 9l1.5-3h2.5" />
    </>
  ),
  helmet: (
    <>
      <path d="M3 13a9 9 0 0 1 18 0" />
      <path d="M3 13h18v1.5a1.5 1.5 0 0 1-1.5 1.5H16l-1-2H9l-1 2H4.5A1.5 1.5 0 0 1 3 14.5z" />
    </>
  ),
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    </>
  ),
  'jersey-yellow': (
    <path d="M8 3 4 5l1.5 4L8 8v13h8V8l2.5 1L20 5l-4-2a4 4 0 0 1-8 0z" />
  ),
  'jersey-polka': (
    <>
      <path d="M8 3 4 5l1.5 4L8 8v13h8V8l2.5 1L20 5l-4-2a4 4 0 0 1-8 0z" />
      <circle cx="12" cy="12" r=".6" />
      <circle cx="10" cy="15" r=".6" />
      <circle cx="14" cy="15" r=".6" />
      <circle cx="12" cy="17.5" r=".6" />
    </>
  ),
  'jersey-green': (
    <>
      <path d="M8 3 4 5l1.5 4L8 8v13h8V8l2.5 1L20 5l-4-2a4 4 0 0 1-8 0z" />
      <path d="M8 13h8" />
    </>
  ),
  cyclist: (
    <>
      <circle cx="14" cy="5" r="2" />
      <path d="M14 7v4l3 3M14 11l-4 1 1 5M10 12l-3 1" />
    </>
  ),
  mountain: <path d="m3 20 6-12 4 6 3-4 5 10z" />,
  trophy: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 21h16" />
      <path d="M10 15v2.5c0 .8-.7 1-1 1.5-.7.5-1 1-1 2" />
      <path d="M14 15v2.5c0 .8.7 1 1 1.5.7.5 1 1 1 2" />
      <path d="M18 3H6v6a6 6 0 0 0 12 0z" />
    </>
  ),
  medal: (
    <>
      <path d="M7.5 4 5 9M16.5 4 19 9" />
      <path d="M8 4h8" />
      <circle cx="12" cy="15" r="5" />
      <path d="M12 13v4" />
    </>
  ),
  stopwatch: (
    <>
      <path d="M10 2h4" />
      <path d="M12 6V4" />
      <circle cx="12" cy="14" r="8" />
      <path d="M12 14l2.5-2.5" />
    </>
  ),
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd apps/web && pnpm build`
Expected: build succeeds. If a key is missing/extra, TS errors on the `Record<ProfileIcon, ...>` type — fix to cover exactly the 12 ids.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/profileIcons.tsx
git commit -m "feat(web): add profile icon SVG registry"
```

---

## Task 6: Frontend — centralized Avatar component

**Files:**
- Create: `apps/web/src/components/Avatar.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/Avatar.tsx`:

```tsx
import { PROFILE_ICONS, type ProfileIcon } from '@bcf/shared'
import { initials, avatarColor } from '../utils/ui'
import { PROFILE_ICON_PATHS } from './profileIcons'

interface AvatarProps {
  pseudo: string
  icon?: string
  colorIndex?: number
  size?: number
}

function isProfileIcon(value: string): value is ProfileIcon {
  return (PROFILE_ICONS as readonly string[]).includes(value)
}

export default function Avatar({ pseudo, icon, colorIndex = 0, size = 36 }: AvatarProps) {
  const col = avatarColor(colorIndex)
  const hasIcon = !!icon && isProfileIcon(icon)

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: col.bg,
        color: col.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: size * 0.4,
        fontWeight: 600,
      }}
    >
      {hasIcon ? (
        <svg
          viewBox="0 0 24 24"
          width={size * 0.55}
          height={size * 0.55}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {PROFILE_ICON_PATHS[icon as ProfileIcon]}
        </svg>
      ) : (
        initials(pseudo)
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd apps/web && pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/Avatar.tsx
git commit -m "feat(web): add centralized Avatar component"
```

---

## Task 7: Frontend — icon picker component

**Files:**
- Create: `apps/web/src/components/ProfileIconPicker.tsx`

- [ ] **Step 1: Create the picker**

Create `apps/web/src/components/ProfileIconPicker.tsx`:

```tsx
import { PROFILE_ICONS } from '@bcf/shared'
import { PROFILE_ICON_PATHS } from './profileIcons'

interface ProfileIconPickerProps {
  value: string
  onSelect: (icon: string) => void
}

export default function ProfileIconPicker({ value, onSelect }: ProfileIconPickerProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {PROFILE_ICONS.map((id) => {
        const selected = id === value
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            style={{
              aspectRatio: '1',
              borderRadius: 14,
              background: selected ? 'rgba(232,201,109,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${selected ? '#e8c96d' : 'transparent'}`,
              color: selected ? '#e8c96d' : '#b0b8c8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={26}
              height={26}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {PROFILE_ICON_PATHS[id]}
            </svg>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd apps/web && pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ProfileIconPicker.tsx
git commit -m "feat(web): add profile icon picker"
```

---

## Task 8: Frontend — wire picker into the Profile page

**Files:**
- Modify: `apps/web/src/pages/ProfilePage.tsx`

- [ ] **Step 1: Add imports**

At the top of `apps/web/src/pages/ProfilePage.tsx`, add:

```tsx
import Avatar from '../components/Avatar'
import ProfileIconPicker from '../components/ProfileIconPicker'
```

- [ ] **Step 2: Track the selected icon in state**

Just after the existing `const [pseudo, setPseudo] = useState(user?.pseudo ?? '')` line, add:

```tsx
  const [icon, setIcon] = useState(user?.icon ?? '')
```

- [ ] **Step 3: Send the icon on save**

In `handleSubmit`, replace the call:

```tsx
      const res = await authApi.updateProfile(pseudo, icon)
```

- [ ] **Step 4: Render the preview + picker**

Inside the "Informations du profil" card `<form>`, immediately after the Email block (before the Pseudo block), add:

```tsx
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(240,237,232,0.5)', marginBottom: 6 }}>
                Icône de profil
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <Avatar pseudo={pseudo || (user?.pseudo ?? '?')} icon={icon} size={64} />
                <span style={{ fontSize: 13, color: 'rgba(240,237,232,0.45)' }}>
                  {icon ? 'Ton icône' : 'Tes initiales (par défaut)'}
                </span>
              </div>
              <ProfileIconPicker value={icon} onSelect={(i) => { setIcon(i); setSuccess(false) }} />
            </div>
```

- [ ] **Step 5: Verify it builds**

Run: `cd apps/web && pnpm build`
Expected: build succeeds.

- [ ] **Step 6: Manual verification**

Run the app (`pnpm dev` from repo root). Log in, go to "Mon profil":
- The icon section shows the 64px preview (initials by default) and the 4-column grid.
- Click an icon → preview updates to that icon → click "Enregistrer" → "Profil mis à jour." appears.
- Reload the page → the chosen icon persists in the preview.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/ProfilePage.tsx
git commit -m "feat(web): choose profile icon from the profile page"
```

---

## Task 9: Frontend — use Avatar everywhere

Replace the ad-hoc `initials()` + `avatarColor()` avatar renders with `<Avatar>` so the chosen icon shows everywhere. Each row/record already carries `icon` (the API serializes it via `UserTransformer` and the response types include it).

**The canonical transformation** — replace markup of this shape:

```tsx
<div className="m-avatar" style={{ background: col.bg, color: col.color }}>
  {initials(m.pseudo ?? '?')}
</div>
```

with:

```tsx
<Avatar pseudo={m.pseudo ?? '?'} icon={m.icon} colorIndex={m.colorIndex} size={36} />
```

Notes per call site:
- `colorIndex` source differs: use the record's `colorIndex` when present, otherwise the loop index (e.g. `Top4Panel` uses `i`).
- `size` should match the existing CSS circle size for that site (inspect the current class, e.g. `m-avatar`, and pass the equivalent pixel size; default 36 if unsure).
- Remove now-unused `initials` / `avatarColor` imports and the local `col = avatarColor(...)` line **only if** no longer referenced in that file.
- If a record type is missing `icon` in its local TS interface, add `icon: string` to it (the API already returns it).

**Files (modify):**

- Modify: `apps/web/src/pages/MembersPage.tsx`
- Modify: `apps/web/src/pages/AdminPage.tsx`
- Modify: `apps/web/src/pages/MemberProfilePage.tsx`
- Modify: `apps/web/src/pages/GcResultPage.tsx`
- Modify: `apps/web/src/pages/StageResultPage.tsx`
- Modify: `apps/web/src/pages/StandingsPage.tsx`
- Modify: `apps/web/src/pages/StatsPage.tsx`
- Modify: `apps/web/src/components/landing/GlobalLeaderboard.tsx`
- Modify: `apps/web/src/components/dashboard/Top4Panel.tsx`
- Modify: `apps/web/src/components/dashboard/LeagueStandingsPanel.tsx`
- Modify: `apps/web/src/components/dashboard/ActivityFeedPanel.tsx`
- Modify: `apps/web/src/components/race/RaceLeagueStandings.tsx`

- [ ] **Step 1: MembersPage**

In `apps/web/src/pages/MembersPage.tsx`, replace the `m-avatar` block (inside `mcol-avatar`) with:

```tsx
<Avatar pseudo={m.pseudo ?? '?'} icon={m.icon} colorIndex={m.colorIndex} size={36} />
```

Add `import Avatar from '../components/Avatar'`. Remove the `const col = avatarColor(m.colorIndex)` line and the `initials`/`avatarColor` imports if no longer used.

- [ ] **Step 2: Top4Panel**

In `apps/web/src/components/dashboard/Top4Panel.tsx`, replace the avatar markup with:

```tsx
<Avatar pseudo={row.pseudo ?? '?'} icon={row.icon} colorIndex={i} size={36} />
```

Add `import Avatar from '../../components/Avatar'`. Clean up unused `initials`/`avatarColor` imports and the `const col = avatarColor(i)` line if unused. If `row` has no `icon` field in its type, add `icon: string`.

- [ ] **Step 3: Apply the same transformation to the remaining sites**

For each of: `AdminPage.tsx`, `MemberProfilePage.tsx`, `GcResultPage.tsx`, `StageResultPage.tsx`, `StandingsPage.tsx`, `StatsPage.tsx`, `GlobalLeaderboard.tsx`, `LeagueStandingsPanel.tsx`, `ActivityFeedPanel.tsx`, `RaceLeagueStandings.tsx`:

1. Find the avatar markup (`initials(...)` inside a circle styled with `avatarColor(...)`).
2. Replace it with `<Avatar pseudo={<pseudoExpr>} icon={<record>.icon} colorIndex={<colorIndexExpr>} size={<existingSize>} />`, using that file's local variable names.
3. Add the `Avatar` import (`../components/Avatar` from `pages/`, `../../components/Avatar` from `components/<sub>/`).
4. Remove now-unused `initials`/`avatarColor` imports and local `col` lines.
5. Add `icon: string` to the local record interface if TS complains it's missing.

- [ ] **Step 4: Verify the whole web app builds**

Run: `cd apps/web && pnpm build`
Expected: build succeeds with no TS errors and no unused-import errors.

- [ ] **Step 5: Manual verification**

Run the app. Set an icon on your profile, then check it appears on: members list, dashboard Top4 + league standings panels, activity feed, standings page, a race's league standings, a stage/GC result page, member profile page, and the landing global leaderboard. Users without an icon still show initials.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src
git commit -m "feat(web): render profile icons in all avatar locations"
```

---

## Task 10: Final verification

- [ ] **Step 1: Backend tests pass**

Run: `cd apps/api && node ace test`
Expected: all suites pass, including `profile_icon` functional tests.

- [ ] **Step 2: Full build passes**

Run: `pnpm build` (repo root)
Expected: all packages/apps build successfully.

- [ ] **Step 3: Spec coverage sanity check**

Confirm against `docs/superpowers/specs/2026-06-02-profile-icons-design.md`: catalog in shared ✓, migration ✓, validation+persistence ✓, Avatar fallback to initials ✓, picker on Profile page ✓, icons shown everywhere ✓.
