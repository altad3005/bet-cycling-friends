# Sous-projet A — Barrière de qualité & déploiement sûr

Date : 2026-06-19
Statut : validé (design), prêt pour le plan d'implémentation

## Contexte

BetCyclingFriends est un monorepo Turborepo/pnpm avec trois apps : `api` (AdonisJS),
`web` (React/Vite) et `pcs-service` (FastAPI). Le déploiement de production passe par
**Dokploy**, configuré en **auto-deploy sur push** vers `main` (webhook).

Problème actuel : **chaque push redéploie la prod sans aucune vérification** — ni tests,
ni build, ni lint. Déployer est donc stressant, et il est facile de casser la prod sans
s'en rendre compte. Il n'existe aucune CI (`.github/` absent) et la couverture de tests est
quasi nulle (3 tests côté `api`, 0 côté `web` et `pcs`).

## Objectif

Insérer une **barrière de qualité automatisée entre le code et la prod**, sans coupler la
CI à la plateforme de déploiement. À l'issue de ce sous-projet, rien n'atteint `main` sans
avoir passé lint + build + tests, et donc rien n'est déployé sans avoir été vérifié.

Ce sous-projet est le premier d'une série. La montée en couverture de tests par domaine
(scoring, paris, ligues, pages web, parseurs PCS) fera l'objet de sous-projets ultérieurs
(B, C, D…), chacun avec son propre cycle spec → plan → implémentation.

### Hors périmètre

- Refactoring d'architecture du code applicatif.
- Monitoring / logging / alerting de production.
- Couverture de tests large (sous-projets ultérieurs).
- Migration vers une autre plateforme de déploiement (rendue plus simple, mais non réalisée ici).

## Principes de design

1. **`main` est sacrée** : protégée, atteignable uniquement via une PR dont la CI est verte.
2. **CI ≠ CD** : GitHub Actions *vérifie* ; Dokploy *déploie* en réagissant à `main`. Les
   deux sont découplés. La CI ne pousse jamais vers Dokploy → changer de plateforme de
   déploiement n'impacte pas la CI (portabilité).
3. **Environnement reproductible** : versions d'outils pinnées, lockfile gelé.

## Architecture du pipeline

```
   feature branch ──push──> PR vers main
                              │
                              ▼
                   GitHub Actions (CI)   ← barrière
              ┌───────────────┬───────────────────┐
           job js          (parallèle)          job python
        lint+build+test                          pytest
        (api+web+shared)                        (pcs-service)
                              │
                    toutes vertes ? ──non──> merge bloqué
                              │ oui
                              ▼
                     merge dans main
                              │
                       push sur main
                              ▼
                  Dokploy (webhook) ──> déploie
```

## Composants

### 1. CI — `.github/workflows/ci.yml`

Déclencheur : `pull_request` ciblant `main`. `concurrency` activée pour annuler les runs
obsolètes d'une même PR.

**Job `js`** (api + web + shared)
- Setup pnpm `9.15.9` + Node `22 LTS` (pinné via `.nvmrc`) + cache du store pnpm.
- `pnpm install --frozen-lockfile` (échoue si le lockfile est désynchronisé).
- `pnpm lint` → `turbo lint`.
- `pnpm build` → `turbo build` (ordre : `shared` → `api`/`web`, compile TS).
- `pnpm test` → `turbo test` (Japa pour `api`, Vitest pour `web`).
- Fournir les variables d'env nécessaires aux tests `api` (ex. `APP_KEY`, config DB de test).

**Job `python`** (pcs-service)
- Setup Python `3.11` (même version que le Dockerfile) + cache pip.
- `pip install -r requirements.txt` + `pytest`.
- `pytest`.

Notes :
- Les tests `api` doivent tourner sur **SQLite** (`better-sqlite3` déjà présent) pour éviter
  de provisionner un Postgres dans la CI. **À vérifier dans la config de test `api`** lors de
  l'implémentation ; si ce n'est pas le cas, ajuster la config de test ou ajouter un service
  Postgres au job.
- Cache Turbo non mis en place au départ (cache pnpm/pip suffisant) ; optimisation possible
  plus tard si la CI devient lente.

### 2. Harnais & socle de tests

| App | Outil | Action | Test socle |
|-----|-------|--------|------------|
| `api` | Japa | déjà en place ; vérifier qu'ils tournent en CI | tests existants |
| `web` | **Vitest** + React Testing Library + script `test` dans `package.json` | installer | rendu d'un composant clé (ex. `RankDelta`) |
| `pcs` | **pytest** + `TestClient` FastAPI (`httpx` déjà présent) | installer | un endpoint de scraping renvoie la forme attendue |

Objectif : socle **minimal mais réel** — chaque harnais a au moins un vrai test qui passe,
afin que la CI ait quelque chose de significatif à exécuter dès le départ.

### 3. Protection de `main` (GitHub)

- PR obligatoire (pas de push direct sur `main`).
- **Status checks requis** : jobs `js` et `python` verts pour pouvoir merger.
- Branche à jour avant merge (conseillé).
- Pas de review obligatoire (utilisateur solo ; activable plus tard).

Réalisé via l'UI GitHub ou `gh`. À documenter pas à pas ; **peut nécessiter une intervention
manuelle de l'utilisateur** (droits admin du repo).

### 4. Nettoyage `Dockerfile`

`apps/api` contient à la fois `Dockerfile` et `DockerFile` (doublon dangereux) ;
`apps/web` et `apps/pcs-service` utilisent `DockerFile`. Standardiser **tout en `Dockerfile`**
et mettre à jour les références dans `docker-compose.yml`. Vérifier au préalable lequel des
deux fichiers de `apps/api` est le bon (référencé par le compose : `apps/api/Dockerfile`).

### 5. Documentation

Documenter le flux dans le `README` : `PR → CI verte → merge → Dokploy déploie`, et les
réglages de protection de `main`.

## Critères de succès

- Une PR avec du code cassé (lint, build ou test KO) **ne peut pas être mergée**.
- `web` et `pcs-service` disposent d'un harnais de test fonctionnel avec au moins un test réel.
- `apps/api` ne contient plus qu'un seul `Dockerfile` ; le compose pointe vers des chemins corrects.
- La CI tourne en parallèle (js / python) et se termine en un temps raisonnable.
- Le `README` décrit le flux de déploiement et la protection de branche.

## Risques & points à vérifier

- **Config DB de test `api`** : confirmer SQLite, sinon adapter le job CI.
- **Build natif `better-sqlite3`** sous Node 22 en CI (module natif) : vérifier qu'il compile.
- **Protection de branche** : peut requérir une action manuelle de l'utilisateur (droits admin).
- **Cohérence Node** : `.nvmrc` à 22 alors que la machine locale est en 25 — acceptable, mais
  à garder en tête pour reproduire la CI en local.
