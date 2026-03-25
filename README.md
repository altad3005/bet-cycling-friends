# BetCyclingFriends

Application web de pronostics cyclistes entre amis. Créez des ligues, faites vos pronostics sur les classiques et les grands tours, et comparez vos résultats avec vos amis.

## Fonctionnalités

- **Ligues privées** — créez ou rejoignez une ligue via un code d'invitation (max. 20 membres)
- **Pronostics classiques** — choisissez un favori et un bonus pour les courses d'un jour
- **Pronostics grand tour** — composez une équipe de 8 coureurs pour les tours par étapes
- **Classements** — général, par ligue, par course et par étape
- **Statistiques** — profils membres, historique et activité de ligue
- **Notifications push** — alertes en temps réel
- **Connexion Google** — OAuth en plus de l'auth classique email/mot de passe
- **Données coureurs** — startlists et résultats synchronisés depuis ProCyclingStats

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | [AdonisJS v6](https://adonisjs.com/) (Node.js, TypeScript) |
| Frontend | React 19 + Vite + TailwindCSS v4 |
| Scraping | FastAPI (Python) + procyclingstats |
| Base de données | PostgreSQL |
| Cache / Queues | Redis + BullMQ |
| Monorepo | Turborepo + pnpm workspaces |
| Prod | Docker Compose + Caddy (HTTPS auto) |

## Structure du projet

```
apps/
  api/          ← AdonisJS v6 (port 3333)
  web/          ← React + Vite (port 5173)
  pcs-service/  ← FastAPI scraping ProCyclingStats (port 8000, interne)
packages/
  shared/       ← Types et constantes TypeScript partagés
docs/           ← Cahier des charges + design API (PDF)
```

## Prérequis

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) + Docker Compose
- [Python](https://www.python.org/) 3.9+ (pour le service PCS)

## Installation et lancement

### 1. Cloner et installer les dépendances

```bash
git clone https://github.com/altad3005/bet-cycling-friends.git
cd bet-cycling-friends
pnpm install
```

### 2. Configurer les variables d'environnement

```bash
cp apps/api/.env.example apps/api/.env
```

Remplir les valeurs dans `apps/api/.env` (voir section [Variables d'environnement](#variables-denvironnement)).

Générer une `APP_KEY` :

```bash
cd apps/api && node ace generate:key
```

### 3. Démarrer l'infrastructure (PostgreSQL, Redis, Mailpit)

```bash
pnpm dev:infra
```

### 4. Lancer les migrations

```bash
pnpm migrate
```

### 5. Démarrer toutes les applications

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3333 |
| Mailpit (emails dev) | http://localhost:8025 |
| PCS Service | http://localhost:8000 |

## Variables d'environnement

Le fichier `apps/api/.env.example` liste toutes les variables nécessaires.

| Variable | Description | Requis |
|----------|-------------|--------|
| `APP_KEY` | Clé de chiffrement AdonisJS (`node ace generate:key`) | Oui |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_DATABASE` | Connexion PostgreSQL | Oui |
| `REDIS_HOST` / `REDIS_PORT` | Connexion Redis | Oui |
| `SMTP_HOST` / `SMTP_PORT` | Serveur email (Mailpit en dev) | Oui |
| `PCS_SERVICE_URL` | URL du service de scraping | Oui |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push Notifications | Non |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | OAuth Google | Non |

Générer les clés VAPID :

```bash
cd apps/api && node ace generate:vapid-keys
# ou via web-push :
npx web-push generate-vapid-keys
```

## Commandes utiles

```bash
# Dev
pnpm dev              # Lance tout (Turbo)
pnpm dev:infra        # Infra Docker seule
pnpm migrate          # Migrations DB

# Build
pnpm build            # Build tous les packages

# Production Docker
pnpm docker:up
pnpm docker:down

# API (depuis apps/api)
node ace serve --hmr          # Dev avec hot reload
node ace test                 # Tests
node ace migration:run
node ace migration:rollback
node ace make:controller Foo
node ace make:model Foo

# Web (depuis apps/web)
pnpm dev
pnpm build

# PCS Service (depuis apps/pcs-service)
uvicorn app.main:app --reload --port 8000
```

## API

- Préfixe : `/api/`
- Auth : `Authorization: Bearer <token>`
- Docs complètes : `docs/BetCyclingFriends_API_Design.pdf`

## Déploiement en production

Le projet utilise Docker Compose + Caddy comme reverse proxy avec HTTPS automatique.

```bash
# Créer un fichier .env à la racine avec les variables de prod
pnpm docker:up
```

Caddy gère automatiquement les certificats TLS via Let's Encrypt.

## Documentation

- `docs/BetCyclingFriends_CDC.pdf` — cahier des charges complet
- `docs/BetCyclingFriends_API_Design.pdf` — design de l'API
