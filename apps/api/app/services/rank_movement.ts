export function computeRankDeltas(
  currentRankByUser: Map<string, number>,
  previousRankByUser: Map<string, number>
): Map<string, number | null> {
  const deltas = new Map<string, number | null>()
  for (const [userId, currentRank] of currentRankByUser) {
    const previousRank = previousRankByUser.get(userId)
    deltas.set(userId, previousRank === undefined ? null : previousRank - currentRank)
  }
  return deltas
}
