# Dashboard "Ma forme" panel

## Contexte

Le dashboard (`HomePage.tsx`) affiche des panneaux orientés ligue (classement,
prochaines courses, activité) mais rien de centré sur la **trajectoire récente du
joueur connecté**. On ajoute un panneau « Ma forme » montrant, sur les 5 dernières
courses notées : les points marqués par course et l'évolution du rang du joueur
dans le classement général de sa ligue active.

## Objectif

Donner au joueur une vue « tendance en un coup d'œil » de sa forme récente
(performance brute + trajectoire relative), à partir des données déjà existantes.

## Décisions

- **Contenu** : points par course **et** évolution du rang.
- **Rang** : classement **général de la ligue active** (celui du dashboard), pas le
  classement global cross-ligues (pas d'historique par course exploitable).
- **Fenêtre** : 5 dernières courses notées.
- **Source de données** : nouvel endpoint dédié et léger (pas de réutilisation du
  gros payload `/stats`).

## Architecture

### 1. Endpoint API

`GET /leagues/:id/form` — authentifié, même contexte que les autres routes
`/leagues/:id/...`. Scopé à l'utilisateur connecté (`auth.user.id`).

Réponse :
```jsonc
{ "data": { "races": [ { "raceId": "...", "raceName": "...", "points": 28, "rank": 3 }, ... ] } }
```
- Jusqu'à 5 entrées, **ordre chronologique** (ancien → récent) pour alimenter
  directement le graphe.
- `points` = points marqués par l'utilisateur à cette course.
- `rank` = rang de l'utilisateur dans la ligue **après** cette course, calculé sur
  le cumul des points.

### 2. Service + helper pur

- `apps/api/app/services/form_service.ts` — `FormService.getUserForm(leagueId, userId, limit = 5)` :
  récupère les scores de la ligue (table `scores` jointe à `races`, triés par date
  de course croissante) et les membres de la ligue, puis délègue le calcul à un
  helper pur, et garde les `limit` dernières entrées.
- `computeFormHistory(racesWithScores, memberIds, userId)` — fonction pure
  (extraite pour testabilité, comme `paginate`) :
  - parcourt **toutes** les courses notées dans l'ordre chronologique ;
  - cumule les points de chaque membre course après course ;
  - après chaque course, calcule le rang de l'utilisateur :
    `rank = 1 + (nombre de membres dont le cumul est strictement supérieur)`
    (égalités → même rang, classement « competition ranking ») ;
  - produit la liste complète `{ raceId, raceName, points, rank }` (l'utilisateur
    qui n'a pas parié à une course compte 0 point ce jour-là mais reste classé).

Le service tranche ensuite les `limit` dernières entrées. Calculer le rang sur
**tout** l'historique avant de trancher est nécessaire pour que le rang de la
première course affichée soit correct.

### 3. Controller

`apps/api/app/controllers/form_controller.ts` — `FormController.leagueForm` :
lit `auth.user.id`, appelle `getUserForm`, renvoie `{ data: { races } }`.

### 4. Web

- `apps/web/src/api/form.ts` :
  ```ts
  export interface FormEntry { raceId: string; raceName: string; points: number; rank: number }
  formApi.league(leagueId) // GET /leagues/:id/form -> { data: { races: FormEntry[] } }
  ```
- `apps/web/src/components/dashboard/FormPanel.tsx` :
  - `useQuery` keyé par la ligue active.
  - Rend le layout validé :
    - **Points** : 5 mini-barres (SVG fait main, pas de librairie de graphes) +
      résumé `X pts ▲±d`.
    - **Rang** : courbe + points en SVG avec **axe vertical inversé** (1er en haut)
      + résumé `Ne ▲±d`.
  - **Deltas** (calculés côté front depuis le tableau renvoyé) : dernière course vs
    course précédente.
    - Points : `points[dernier] - points[avant-dernier]`.
    - Rang : `rank[avant-dernier] - rank[dernier]` (positif = gagne des places ▲).
  - États : chargement ; vide si aucune course notée
    (« Pas encore de résultats cette saison. ») ; une seule course → pas de delta.
- Câblage `HomePage.tsx` : `<FormPanel />` inséré **juste après `<StatGrid />`**,
  avant la rangée `two-col`.

## Gestion des erreurs / cas limites

- Accès : membre de la ligue (mêmes garanties que les routes `/leagues` existantes).
- 0 course notée → tableau vide → état vide côté front.
- < 5 courses notées → on affiche ce qui existe.
- Membre n'ayant pas parié à certaines courses → 0 point ces courses-là, toujours
  classé.

## Tests

- **Unitaire** (`apps/api/tests/unit/form_history.spec.ts`) : `computeFormHistory`
  — points par course, rang cumulé, égalités, < 5 courses, 0 course, utilisateur
  absent de certaines courses.
- **Front** : build + vérification manuelle sur le dashboard.

## Hors périmètre

- Classement global cross-ligues.
- Librairie de graphes (sparklines faites main en SVG).
- Modification des autres panneaux du dashboard.
