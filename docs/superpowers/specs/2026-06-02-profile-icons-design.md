# Profile Icons — Design

**Date:** 2026-06-02
**Status:** Approved (design)

## Goal

Allow each user to pick a cycling-themed profile icon from a predefined set. The
chosen icon replaces the user's initials everywhere their avatar is shown. Until
a user picks one, their initials remain the fallback.

## Decisions

| Topic | Decision |
| --- | --- |
| Mechanism | Predefined set, chosen by the user. The icon id is stored in the existing `users.icon` column. |
| Visual style | Outline (thin monochrome stroke), consistent with the app's existing inline SVG icons. |
| Set size | ~12 curated cycling icons. |
| Where to choose | Profile page only. Setup stays minimal (pseudo only). |
| Default / fallback | Initials on a colored pill when no icon is chosen (`icon === ''`). |
| Display scope | Everywhere — via a single shared `Avatar` component. |

## Current state (already in place)

- `users.icon` column exists (`string(50)`, currently defaults to `'cyclist'`).
- `UserTransformer` already returns `icon` and `initials`.
- All frontend types already carry the `icon` field.
- No icon picker and no icon rendering exist yet — avatars currently render
  initials on a colored pill (`initials()` + `avatarColor(colorIndex)` in
  `apps/web/src/utils/ui.ts`).

## Architecture

The icon **catalog** (list of valid ids) is the single source of truth in
`@bcf/shared`, used by the backend for validation and by the web app to map each
id to its SVG. The **SVG assets** live in the web app only (rendering concern).

### 1. Shared catalog (`packages/shared/src/constants.ts`)

```ts
export const PROFILE_ICONS = [
  'bike-road', 'bike-mtb', 'helmet', 'wheel',
  'jersey-yellow', 'jersey-polka', 'jersey-green',
  'cyclist', 'mountain', 'trophy', 'medal', 'stopwatch',
] as const
export type ProfileIcon = (typeof PROFILE_ICONS)[number]
```

### 2. Backend (AdonisJS)

- **Migration** `alter_users_icon_default`:
  - Change `icon` column default from `'cyclist'` to `''`.
  - `UPDATE users SET icon = '' WHERE icon = 'cyclist'` — safe, since no UI ever
    allowed choosing an icon, so every existing `'cyclist'` is an untouched
    default.
  - `down()`: restore default `'cyclist'`.
- **Validator** (`app/controllers/profile_controller.ts`, `updateProfileValidator`):
  add `icon: vine.enum(PROFILE_ICONS).optional()` (importing `PROFILE_ICONS`
  from `@bcf/shared`).
- **Controller** `ProfileController.update`: when `icon` is provided, set
  `user.icon = icon` before save. `UserTransformer` already exposes `icon`.

### 3. Frontend (React)

- **`components/Avatar.tsx`** — centralized avatar. Props:
  `{ icon?: string; pseudo: string; colorIndex?: number; size?: number }`.
  Renders the icon SVG when `icon` is a known catalog id, otherwise renders
  `initials(pseudo)` on `avatarColor(colorIndex)`. Single place for fallback
  logic.
- **`components/profileIcons.tsx`** — `Record<ProfileIcon, ReactNode>` of clean
  outline SVGs (curated open-license cycling set).
- **`components/ProfileIconPicker.tsx`** — clickable grid (validated mockup):
  large current-icon preview + 4-column grid, selected cell highlighted in the
  accent color.
- **Profile page** (`pages/ProfilePage.tsx`) — new "Icône de profil" section with
  the picker; selecting an icon calls `updateProfile({ pseudo, icon })`, then
  `authStore.setUser` refreshes all avatars.
- **`api/auth.ts`** — `updateProfile` accepts `{ pseudo, icon? }`.

### 4. Avatar refactor (display scope = everywhere)

Replace the existing inline avatar rendering with `<Avatar>` in every site that
shows a user avatar:

- `pages/MembersPage.tsx`
- `pages/AdminPage.tsx`
- `pages/MemberProfilePage.tsx`
- `pages/GcResultPage.tsx`
- `pages/StageResultPage.tsx`
- `pages/StandingsPage.tsx`
- `pages/StatsPage.tsx`
- `components/landing/GlobalLeaderboard.tsx`
- `components/dashboard/Top4Panel.tsx`
- `components/dashboard/LeagueStandingsPanel.tsx`
- `components/dashboard/ActivityFeedPanel.tsx`
- `components/race/RaceLeagueStandings.tsx`

(`AppShell.tsx` uses `icon` for nav items, not avatars — out of scope. Exact list
to be confirmed during implementation.)

## Data flow

```
click icon → ProfileIconPicker → PUT /account/profile { icon }
  → validate (enum) + save → User returned → authStore.setUser
  → every <Avatar> re-renders with the new icon
```

## Error handling

- Invalid icon id → 422, surfaced via the existing error-display pattern.
- Unknown icon id on the frontend (e.g. an id later removed from the catalog) →
  `Avatar` falls back to initials.

## Testing

- **Backend** (`node ace test`): `PUT /account/profile` with a valid icon →
  persisted; with an invalid icon → 422.
- **Frontend**: confirm whether a test harness exists. If yes, test `Avatar`
  (known id → SVG, empty/unknown → initials). If not, manual verification of the
  picker + avatar fallback.

## Out of scope

- Custom image upload.
- Auto-generated icons.
- Choosing the icon during the setup/first-login flow.
