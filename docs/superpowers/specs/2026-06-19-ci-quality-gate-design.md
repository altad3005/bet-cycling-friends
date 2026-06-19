# Sous-projet A — Barrière de qualité & déploiement sûr

Date : 2026-06-19
Statut : validé (design), prêt pour le plan d'implémentation

## Contexte

BetCyclingFriends est un monorepo Turborepo/pnpm avec trois apps : `api` (AdonisJS),
`web` (React/Vite) et `pcs-service` (FastAPI). Le déploiement de production passe par
**Dokploy**, aujourd'hui configuré en **auto-deploy sur push** vers `main` (webhook).

Problème actuel : **chaque push redéploie la prod sans aucune vérification** — ni tests,
ni build, ni lint. Déployer est donc stressant, et il est facile de casser la prod sans
s'en rendre compte. Il n'existe aucune CI (`.github/` absent) et la couverture de tests est
quasi nulle (3 tests côté `api`, 0 côté `web` et `pcs`).

De plus, l'auto-deploy sur `main` confond « merger » et « déployer ». On veut faire du
déploiement un **acte volontaire et versionné** : on déploie en posant un **tag de release**
(`vX.Y.Z`), pas à chaque merge.

## Objectif

Insérer une **barrière de qualité automatisée entre le code et la prod**, et faire du
déploiement un **acte versionné déclenché par un tag**, sans coupler la *CI* à la plateforme
de déploiement. À l'issue de ce sous-projet, rien n'atteint `main` sans avoir passé
lint + build + tests, et la prod n'est déployée que lorsqu'on pose un tag de release.

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
   `main` n'est **plus** déployée automatiquement.
2. **Merger ≠ déployer** : le déploiement est déclenché par un **tag de release `vX.Y.Z`**,
   acte volontaire et versionné.
3. **CI ≠ CD** : la **CI** (vérification sur PR) est totalement agnostique de la plateforme.
   Seul le **workflow de déploiement** connaît Dokploy ; le couplage est isolé à ce seul
   fichier → changer de plateforme n'impacte que `deploy.yml` (portabilité préservée).
4. **Environnement reproductible** : versions d'outils pinnées, lockfile gelé.

## Architecture du pipeline

```
   feature branch ──push──> PR vers main
                              │
                              ▼
                   GitHub Actions — ci.yml   ← barrière
              ┌───────────────┬───────────────────┐
           job js          (parallèle)          job python
        lint+build+test                          pytest
        (api+web+shared)                        (pcs-service)
                              │
                    toutes vertes ? ──non──> merge bloqué
                              │ oui
                              ▼
                     merge dans main   (verte, NON déployée)
                              │
              quand prêt à release :
              git tag vX.Y.Z && git push --tags
                              │
                              ▼
              GitHub Actions — deploy.yml (sur tag v*)
                  appelle l'API/webhook Dokploy
                              ▼
                        Dokploy ──> déploie
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

### 3. CD — `.github/workflows/deploy.yml`

Déclencheur : `push` de tag correspondant à `v*` (ex. `v1.2.0`).

Étapes :
- Appeler l'**API/webhook de déploiement de Dokploy** pour déclencher le déploiement de la
  prod (Dokploy rebuild les images depuis le repo).
- (Optionnel) Créer une **GitHub Release** associée au tag.

Configuration requise :
- Reconfigurer Dokploy pour **désactiver l'auto-deploy sur push `main`** (le déploiement
  passe désormais par ce workflow).
- Stocker les identifiants Dokploy nécessaires (token d'API, identifiant de l'application /
  URL de webhook) dans les **secrets GitHub** du repo.

Notes :
- C'est le **seul** fichier du repo couplé à Dokploy. Changer de plateforme = ne réécrire
  que ce workflow.
- À vérifier lors de l'implémentation : l'endpoint exact de l'API Dokploy (ou l'URL de
  webhook de déploiement) et le format d'authentification.
- Garde-fou possible (optionnel) : vérifier que le tag pointe sur un commit de `main`.

### 4. Protection de `main` (GitHub)

- PR obligatoire (pas de push direct sur `main`).
- **Status checks requis** : jobs `js` et `python` verts pour pouvoir merger.
- Branche à jour avant merge (conseillé).
- Pas de review obligatoire (utilisateur solo ; activable plus tard).

Réalisé via l'UI GitHub ou `gh`. À documenter pas à pas ; **peut nécessiter une intervention
manuelle de l'utilisateur** (droits admin du repo).

### 5. Nettoyage `Dockerfile`

`apps/api` contient à la fois `Dockerfile` et `DockerFile` (doublon dangereux) ;
`apps/web` et `apps/pcs-service` utilisent `DockerFile`. Standardiser **tout en `Dockerfile`**
et mettre à jour les références dans `docker-compose.yml`. Vérifier au préalable lequel des
deux fichiers de `apps/api` est le bon (référencé par le compose : `apps/api/Dockerfile`).

### 6. Documentation

Documenter dans le `README` :
- Le flux complet : `PR → CI verte → merge dans main → tag vX.Y.Z → deploy.yml → Dokploy`.
- La convention de tags de release (versionnage `vX.Y.Z`).
- Les réglages de protection de `main` et les secrets GitHub requis pour le déploiement.

## Critères de succès

- Une PR avec du code cassé (lint, build ou test KO) **ne peut pas être mergée**.
- Un push sur `main` ne déclenche **plus** de déploiement automatique.
- Pousser un tag `vX.Y.Z` déclenche le déploiement de la prod via `deploy.yml`.
- `web` et `pcs-service` disposent d'un harnais de test fonctionnel avec au moins un test réel.
- `apps/api` ne contient plus qu'un seul `Dockerfile` ; le compose pointe vers des chemins corrects.
- La CI tourne en parallèle (js / python) et se termine en un temps raisonnable.
- Le `README` décrit le flux de déploiement par tag et la protection de branche.

## Risques & points à vérifier

- **Config DB de test `api`** : confirmer SQLite, sinon adapter le job CI.
- **Build natif `better-sqlite3`** sous Node 22 en CI (module natif) : vérifier qu'il compile.
- **Protection de branche** : peut requérir une action manuelle de l'utilisateur (droits admin).
- **Cohérence Node** : `.nvmrc` à 22 alors que la machine locale est en 25 — acceptable, mais
  à garder en tête pour reproduire la CI en local.
- **API/webhook de déploiement Dokploy** : confirmer l'endpoint exact et l'authentification ;
  créer les secrets GitHub correspondants.
- **Désactivation de l'auto-deploy `main`** dans Dokploy : action manuelle dans l'UI Dokploy,
  à ne pas oublier sinon le déploiement se ferait à la fois sur merge et sur tag.
