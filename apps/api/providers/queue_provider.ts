import { Worker } from 'bullmq'
import type { ApplicationService } from '@adonisjs/core/types'
import env from '#start/env'
import type { ScoringJobData } from '#start/queue'

export default class QueueProvider {
  private worker?: Worker<ScoringJobData>

  constructor(protected app: ApplicationService) {}

  async ready() {
    const { default: Race } = await import('#models/race')
    const { default: ResultSyncService } = await import('#services/result_sync_service')
    const { default: ScoringService } = await import('#services/scoring_service')

    this.worker = new Worker<ScoringJobData>(
      'scoring',
      async (job) => {
        const race = await Race.findOrFail(job.data.raceId)
        const syncService = new ResultSyncService()
        const scoringService = new ScoringService()

        if (job.data.type === 'sync-classic') {
          await syncService.syncClassicRaceResults(race)
          await scoringService.scoreRace(race.id)
        } else if (job.data.type === 'sync-gt-stage') {
          await syncService.syncGrandTourStage(race, job.data.stageNumber)
          await scoringService.scoreRace(race.id)
        } else if (job.data.type === 'sync-gt-gc') {
          await syncService.syncGrandTourGC(race)
          await scoringService.scoreRace(race.id)
        }
      },
      { connection: { host: env.get('REDIS_HOST'), port: env.get('REDIS_PORT') } }
    )

    this.worker.on('failed', (job, err) => {
      console.error(`Scoring job ${job?.id} failed:`, err)
    })
  }

  async shutdown() {
    await this.worker?.close()
  }
}
