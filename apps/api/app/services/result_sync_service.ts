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
    for (const r of riders) {
      await Rider.firstOrCreate(
        { pcsUrl: r.pcs_url },
        { id: randomUUID(), name: r.name, pcsUrl: r.pcs_url, nationality: r.nationality ?? null }
      )
    }
  }

  async syncClassicRaceResults(race: Race): Promise<void> {
    const results = await this.pcs.getRaceResults(race.slug, race.seasonYear)
    await this.upsertResults(race.id, results, 0, 'result')
    race.resultsFinal = true
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
    race.resultsFinal = true
    race.lastSyncedAt = DateTime.now()
    await race.save()
  }

  private async upsertResults(
    raceId: string,
    results: PcsStageResult[],
    stageNumber: number,
    resultType: string
  ): Promise<void> {
    for (const result of results) {
      const rider = await Rider.firstOrCreate(
        { pcsUrl: result.rider_url },
        {
          id: randomUUID(),
          name: result.rider_name,
          pcsUrl: result.rider_url,
          nationality: result.nationality ?? null,
        }
      )

      const existing = await StageResult.query()
        .where('race_id', raceId)
        .where('rider_id', rider.id)
        .where('stage_number', stageNumber)
        .where('result_type', resultType)
        .first()

      if (existing) {
        existing.rank = result.rank
        await existing.save()
      } else {
        await StageResult.create({
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
  }
}
