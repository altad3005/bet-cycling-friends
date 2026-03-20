# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BetCyclingFriends (BCF) — application web de pronostics cyclistes entre amis. Monorepo Turborepo + pnpm workspaces.

Specs complètes : `docs/BetCyclingFriends_CDC.pdf` | API : `docs/BetCyclingFriends_API_Design.pdf`

## Commands

```bash
# Dev (lance infra Docker + toutes les apps via Turbo)
pnpm dev

# Infra seule (postgres, redis, mailpit)
pnpm dev:infra

# Migrations
pnpm migrate

# Build tout
pnpm build

# Production Docker
pnpm docker:up
```

### API (AdonisJS)
```bash
cd apps/api
node ace serve --hmr          # dev
node ace test                 # tests
node ace migration:run        # migrations
node ace migration:rollback   # rollback
node ace make:controller Foo  # générer un controller
node ace make:model Foo       # générer un model
```

### Web (Vite)
```bash
cd apps/web
pnpm dev     # port 5173
pnpm build
```

### PCS Service (FastAPI)
```bash
cd apps/pcs-service
uvicorn app.main:app --reload --port 8000
```

## Architecture

```
apps/
  api/          ← AdonisJS v6 (backend principal, port 3333)
  web/          ← React + Vite (frontend, port 5173 en dev)
  pcs-service/  ← FastAPI Python (scraping procyclingstats, port 8000, interne uniquement)
packages/
  shared/       ← Types TypeScript partagés entre api et web
docs/           ← Cahier des charges + design API (PDF)
```

En dev : nginx non utilisé — Vite sert le front sur `:5173` et proxifie `/api` → `:3333`.
En prod : Caddy comme reverse proxy (HTTPS auto), Docker Compose.

## API — conventions

- Préfixe : `/api/`
- Auth : Bearer token (AdonisJS Access Tokens, pas JWT session)
- Réponses sérialisées via des **Transformers** (`app/transformers/`)
- Validation via **VineJS** (`app/validators/`)
- Routes définies dans `apps/api/start/routes.ts`

## Package shared

Importé par `api` et `web` via `@bcf/shared`. Contient :
- `src/enums.ts` — `RaceType`, `MultiplierType`, `RaceStatus`, `BetStatus`
- `src/constants.ts` — `SCORING_TABLE`, `MULTIPLIERS`, `BONUS_COEFFICIENT`, `FAVORITE_COEFFICIENT`, `MAX_LEAGUE_MEMBERS` (20), `GRAND_TOUR_TEAM_SIZE` (8)
- `src/types/` — interfaces de réponse API et payloads de requête

Toujours utiliser ces constantes/enums plutôt que des valeurs en dur.

## Modèle de données (migrations existantes)

`seasons` → `users`, `access_tokens`, `leagues`, `league_members`, `riders`, `races`, `league_races`, `bets_classics`, `bets_grand_tours`, `bets_grand_tour_riders`, `scores`, `stage_results`, `push_subscriptions`

## Infra dev

`docker-compose.dev.yml` lance : PostgreSQL (5432), Redis (6379), Mailpit (SMTP 1025, UI 8025).
Credentials DB dev : `bcf` / `bcf_password` / `bcf_dev`.
