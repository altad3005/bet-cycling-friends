export interface FormEntry {
  raceId: string
  raceName: string
  points: number
  rank: number
}

interface RaceRef {
  id: string
  name: string
}

interface ScoreRow {
  raceId: string
  userId: string
  points: number
}

export function computeFormHistory(
  races: RaceRef[],
  scores: ScoreRow[],
  memberIds: string[],
  userId: string
): FormEntry[] {
  const cumulative = new Map<string, number>()
  for (const id of memberIds) cumulative.set(id, 0)

  const history: FormEntry[] = []
  for (const race of races) {
    const raceScores = scores.filter((s) => s.raceId === race.id)
    for (const s of raceScores) {
      cumulative.set(s.userId, (cumulative.get(s.userId) ?? 0) + s.points)
    }

    const userTotal = cumulative.get(userId) ?? 0
    let rank = 1
    for (const id of memberIds) {
      if ((cumulative.get(id) ?? 0) > userTotal) rank++
    }

    const userPoints = raceScores.find((s) => s.userId === userId)?.points ?? 0
    history.push({ raceId: race.id, raceName: race.name, points: userPoints, rank })
  }

  return history
}
