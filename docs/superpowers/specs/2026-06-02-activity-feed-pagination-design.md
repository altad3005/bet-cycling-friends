# Pagination du feed d'activité

## Contexte

La page Activité (`/feed`, `FeedPage.tsx`) récupère 50 événements d'un coup et les
affiche tous. Le `FeedService` agrège en mémoire trois types d'événements
(`bet_placed`, `results_published`, `member_joined`) depuis plusieurs tables, les
trie par date décroissante, puis applique un `slice(0, limit)` (limite plafonnée à
50). Le dashboard (`HomePage.tsx`) consomme le même endpoint pour un aperçu de 5
événements via `ActivityFeedPanel`.

## Objectif

Mettre en place un scroll infini sur la page Activité, par tranches de 20
événements, sans réécrire la logique d'agrégation existante.

## Approche retenue

Pagination par **offset**. Le service calcule l'ensemble des événements (comme
aujourd'hui), trie une fois, puis découpe la tranche `[offset, offset + limit]` et
indique s'il en reste via `hasMore`. Le front utilise `useInfiniteQuery` de React
Query.

Le jeu de données d'une ligue est petit (max 20 membres, peu de courses), donc
recalculer puis découper à chaque tranche reste peu coûteux. La pagination par
curseur a été écartée : les dates `at` ne sont pas uniques et les événements
viennent de sources hétérogènes, ce qui complexifie la logique pour un bénéfice
nul à ce volume.

## Changements

### 1. Contrat d'API

Route inchangée : `GET /leagues/:id/feed`.

- **Query params** : `limit` (défaut 20, plafonné à 50), `offset` (défaut 0, min 0).
- **Réponse** : passe de `{ data: { events } }` à
  `{ data: { events: FeedEvent[], hasMore: boolean } }`.
- `hasMore` indique s'il reste des événements après la tranche renvoyée.

### 2. Service — `apps/api/app/services/feed_service.ts`

- Signature : `getLeagueFeed(leagueId, limit = 20, offset = 0)` →
  `{ events: FeedEvent[]; hasMore: boolean }`.
- Regrouper les deux points de sortie actuels en un seul : construire le tableau
  complet, trier une fois, puis
  `events = all.slice(offset, offset + limit)` et
  `hasMore = offset + limit < all.length`. Le guard « pas de course/membre » ne
  fait plus que sauter le calcul des paris/résultats.

### 3. Controller — `apps/api/app/controllers/feed_controller.ts`

- Parser `offset` en plus de `limit`, transmettre au service, renvoyer
  `{ data: { events, hasMore } }`.

### 4. Client web — `apps/web/src/api/feed.ts`

- `feedApi.league(leagueId, { limit?, offset? })` typé pour renvoyer
  `{ data: { events: FeedEvent[]; hasMore: boolean } }`.

### 5. Page Activité — `apps/web/src/pages/FeedPage.tsx`

- Remplacer `useQuery` par `useInfiniteQuery` :
  - `initialPageParam: 0`
  - `getNextPageParam: (last, pages) => last.hasMore ? pages.length * 20 : undefined`
  - Aplatir les pages en une seule liste d'événements.
- Déclenchement du scroll : un `IntersectionObserver` sur un `<div>` sentinelle en
  bas de liste qui appelle `fetchNextPage()` quand
  `hasNextPage && !isFetchingNextPage`.
- Indicateur « Chargement… » affiché pendant `isFetchingNextPage`.

### 6. Dashboard — `apps/web/src/pages/HomePage.tsx`

- Adapter l'appel à la nouvelle signature/forme. Le panneau reste un aperçu (5
  événements + bouton « Voir tout »). Utiliser le `hasMore` renvoyé par l'API
  plutôt que `feedEvents.length >= 5`.

### 7. Tests

- Test du `FeedService` : vérifier que `offset`/`limit` découpent correctement et
  que `hasMore` est exact aux limites (dernière page → `false`).

## Hors périmètre

- Pas de refactor du type `FeedEvent` dupliqué entre `api` et `web` vers
  `@bcf/shared`.
- Pas de changement de comportement du `ActivityFeedPanel` (reste un aperçu).
