# Dashboard form trim + league standings rank movement

## Contexte

Le panneau « Ma forme » (`FormPanel`, livré récemment) affiche deux graphes :
points par course **et** évolution du rang. L'évolution du rang en sparkline
isolée s'est révélée peu utile. À la place, on veut un indicateur de mouvement de
rang (flèche ▲▼) **directement dans le classement de la ligue existant**
(`LeagueStandingsPanel`), qui est le bon endroit pour lire une dynamique de
classement.

## Objectif

1. Simplifier `FormPanel` pour ne garder que le graphe des points.
2. Ajouter une flèche de mouvement de rang par joueur dans le classement de la
   ligue du dashboard, indiquant la montée/descente depuis la dernière course
   notée.

## Partie A — FormPanel : points uniquement

`apps/web/src/components/dashboard/FormPanel.tsx` :
- Supprimer la section « Rang » : le sous-composant `RankLine`, la ligne de rang
  dans le rendu, la fonction `ordinal`, et les calculs `ranks` / `rankDelta`.
- Conserver : le graphe `PointsBars`, le résumé `X pts` + `Delta` de points, les
  états chargement / vide.
- Le `queryFn` continue d'appeler `formApi.league` (les entrées contiennent encore
  `rank`, simplement plus affiché — pas de changement backend pour cette partie).

## Partie B — Mouvement de rang dans le classement de la ligue

### Données (backend)

`apps/api/app/services/standings_service.ts`, méthode `leagueStandings` :
- En plus du classement actuel, calculer pour chaque membre son **rang précédent**
  = rang sur le cumul des points **en excluant la dernière course notée** de la
  ligue.
- « Dernière course notée » = la course la plus récente (par `races.start_at`)
  parmi celles ayant au moins un score pour cette ligue.
- `rankDelta = rangPrécédent − rangActuel` (positif = a gagné des places ▲).
- Réutiliser la logique de classement à égalités existante (`withSharedRanks`)
  pour produire les rangs précédents, de façon cohérente avec les rangs actuels.
- Isoler le calcul des deltas dans un **helper pur testable**
  (`apps/api/app/services/rank_movement.ts`) :
  `computeRankDeltas(currentRankByUser, previousRankByUser)` →
  `Map<userId, number | null>`, sans accès base. Pour chaque membre présent dans
  `currentRankByUser` : `previousRank − currentRank` si le membre a un rang
  précédent, sinon `null`. Le service passe une map précédente **vide** quand il y
  a moins de 2 courses notées → tous les deltas valent `null`.
- Cas limite : s'il y a **moins de 2 courses notées**, il n'y a pas de référence
  précédente → `rankDelta = null` pour tous.

### Type partagé

`LeagueStanding` (défini côté API transformer/service et redéclaré côté web dans
`apps/web/src/api/standings.ts`) gagne un champ :
```ts
rankDelta: number | null
```
- `leagueStandings` (classement général) le renseigne.
- Les classements catégoriels (`monuments`, `grand-tours`, `classics`,
  `stage-races`, `championnats`) renvoient `rankDelta: null` (pas de mouvement
  affiché pour ces vues).

### Front

`apps/web/src/components/dashboard/LeagueStandingsPanel.tsx` :
- Afficher une petite flèche près du rang (`s-rank`) selon `rankDelta` :
  - `> 0` → `▲{n}` en vert (`#82c99a`)
  - `< 0` → `▼{n}` en rouge (`#f0816a`) (n = valeur absolue)
  - `0` ou `null` → rien (pas d'indicateur).
- `StandingsPage` (classement complet) reste inchangée — elle ignore simplement le
  nouveau champ.

## Gestion des erreurs / cas limites

- 0 ou 1 course notée → `rankDelta` partout `null` → aucune flèche.
- Nouveau membre absent du classement précédent → traité comme sans référence pour
  cette course (`null`), pour éviter un faux « ▲ » spectaculaire.
- La flèche n'est jamais affichée pour `rankDelta === 0`.

## Tests

- **Unitaire** (`apps/api/tests/unit/rank_movement.spec.ts`) : `computeRankDeltas`
  — montée (delta positif), descente (delta négatif), rang inchangé (0), membre
  sans rang précédent (`null`).
- **Front** : build + vérification manuelle sur le dashboard (flèches cohérentes,
  FormPanel sans graphe de rang).

## Hors périmètre

- `StandingsPage` et les classements catégoriels (juste `rankDelta: null`).
- Tout autre panneau du dashboard.
- Le calcul `rank` par course renvoyé par `formApi` reste tel quel (non supprimé du
  backend), simplement plus affiché dans `FormPanel`.
