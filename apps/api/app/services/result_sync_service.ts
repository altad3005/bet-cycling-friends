import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import Race from '#models/race'
import Rider from '#models/rider'
import StageResult from '#models/stage_result'
import PcsService, { type PcsStageResult } from '#services/pcs_service'

export default class ResultSyncService {
  private pcs = new PcsService()

  async syncStartlist(race: Race): Promise<void> {
    const riders = await this.pcs.getStartlist(race.slug, race.seasonYear)
    if (riders.length === 0) return

    const pcsUrls = riders.map((r) => r.pcs_url)
    const existing = await Rider.query().whereIn('pcs_url', pcsUrls)
    const existingUrls = new Set(existing.map((r) => r.pcsUrl))

    const toCreate = riders.filter((r) => !existingUrls.has(r.pcs_url))
    if (toCreate.length > 0) {
      await Rider.createMany(
        toCreate.map((r) => ({
          id: randomUUID(),
          name: r.name,
          pcsUrl: r.pcs_url,
          nationality: r.nationality ?? null,
        }))
      )
    }
  }

  async syncClassicRaceResults(race: Race): Promise<void> {
    const results = await this.pcs.getRaceResults(race.slug, race.seasonYear)
    await this.upsertResults(race.id, results, 0, 'result')
    if (results.length >= 10) {
      race.resultsFinal = true
      race.status = 'finished'
    }
    race.lastSyncedAt = DateTime.now()
    await race.save()
  }

  async syncGrandTourStage(race: Race, stageNumber: number): Promise<void> {
    const results = await this.pcs.getStageResults(race.slug, race.seasonYear, stageNumber)
    await this.upsertResults(race.id, results, stageNumber, 'stage')
    race.lastSyncedAt = DateTime.now()
    await race.save()
  }

  async syncGrandTourGC(race: Race): Promise<void> {
    const results = await this.pcs.getRaceResults(race.slug, race.seasonYear)
    await this.upsertResults(race.id, results, 0, 'gc')
    // Ne finaliser que si le classement général a bien été récupéré.
    // Sinon (scrape vide / GC pas encore publié) on laisse resultsFinal=false
    // pour que les crons auto-sync/auto-status retentent le sync GC.
    if (results.length > 0) {
      race.resultsFinal = true
    }
    race.lastSyncedAt = DateTime.now()
    await race.save()
  }

  private async upsertResults(
    raceId: string,
    results: PcsStageResult[],
    stageNumber: number,
    resultType: string
  ): Promise<void> {
    if (results.length === 0) return

    // Batch-fetch existing riders, create missing ones
    const pcsUrls = results.map((r) => r.rider_url)
    const existingRiders = await Rider.query().whereIn('pcs_url', pcsUrls)
    const riderMap = new Map(existingRiders.map((r) => [r.pcsUrl, r]))

    const missingRiders = results.filter((r) => !riderMap.has(r.rider_url))
    if (missingRiders.length > 0) {
      const created = await Rider.createMany(
        missingRiders.map((r) => ({
          id: randomUUID(),
          name: r.rider_name,
          pcsUrl: r.rider_url,
          nationality: r.nationality ?? null,
        }))
      )
      for (const rider of created) {
        riderMap.set(rider.pcsUrl, rider)
      }
    }

    // Batch-fetch existing stage results for this race/stage/type
    const riderIds = results.map((r) => riderMap.get(r.rider_url)!.id)
    const existingStageResults = await StageResult.query()
      .where('race_id', raceId)
      .where('stage_number', stageNumber)
      .where('result_type', resultType)
      .whereIn('rider_id', riderIds)
    const stageResultMap = new Map(existingStageResults.map((sr) => [sr.riderId, sr]))

    // Separate inserts from updates
    const toInsert: {
      id: string
      raceId: string
      riderId: string
      stageNumber: number
      resultType: string
      rank: number
      resultAt: DateTime
    }[] = []
    const toUpdate: StageResult[] = []

    for (const result of results) {
      const rider = riderMap.get(result.rider_url)!
      const existing = stageResultMap.get(rider.id)
      if (existing) {
        existing.rank = result.rank
        toUpdate.push(existing)
      } else {
        toInsert.push({
          id: randomUUID(),
          raceId,
          riderId: rider.id,
          stageNumber,
          resultType,
          rank: result.rank,
          resultAt: DateTime.now(),
        })
      }
    }

    await Promise.all([
      toInsert.length > 0 ? StageResult.createMany(toInsert) : Promise.resolve(),
      ...toUpdate.map((sr) => sr.save()),
    ])
  }
}
