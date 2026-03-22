import { Worker } from 'bullmq'
import { DateTime } from 'luxon'
import type { ApplicationService } from '@adonisjs/core/types'
import env from '#start/env'
import { scoringQueue, type ScoringJobData } from '#start/queue'

export default class QueueProvider {
  private worker?: Worker<ScoringJobData>

  constructor(protected app: ApplicationService) {}

  async ready() {
    const { default: Race } = await import('#models/race')
    const { default: Stage } = await import('#models/stage')
    const { default: StageResult } = await import('#models/stage_result')
    const { default: ResultSyncService } = await import('#services/result_sync_service')
    const { default: ScoringService } = await import('#services/scoring_service')

    this.worker = new Worker<ScoringJobData>(
      'scoring',
      async (job) => {
        // ── Auto-sync cron ──────────────────────────────────────────────────
        if (job.data.type === 'auto-sync') {
          const today = DateTime.now().toISODate()!

          const races = await Race.query().where((q) => {
            q.where('status', 'live').orWhere((q2) => {
              q2.where('status', 'finished').where('results_final', false)
            })
          })

          for (const race of races) {
            if (race.isGrandTour) {
              // Sync GT stages whose date has passed and have no results yet
              const stages = await Stage.query()
                .where('race_id', race.id)
                .whereNotNull('date')

              const syncedRows = await StageResult.query()
                .where('race_id', race.id)
                .where('result_type', 'stage')
                .distinct('stage_number')
                .select('stage_number')

              const syncedSet = new Set(syncedRows.map((r) => r.stageNumber))

              for (const stage of stages) {
                if (stage.date && stage.date <= today && !syncedSet.has(stage.number)) {
                  await scoringQueue.add('sync', {
                    type: 'sync-gt-stage',
                    raceId: race.id,
                    stageNumber: stage.number,
                  })
                }
              }

              // Sync GC when race is finished and not yet final
              if (race.status === 'finished' && !race.resultsFinal) {
                await scoringQueue.add('sync', { type: 'sync-gt-gc', raceId: race.id })
              }
            } else {
              if (!race.resultsFinal) {
                await scoringQueue.add('sync', { type: 'sync-classic', raceId: race.id })
              }
            }
          }

          return
        }

        // ── Manual / enqueued syncs ─────────────────────────────────────────
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

    // Register the hourly auto-sync repeatable job (idempotent)
    await scoringQueue.add(
      'auto-sync',
      { type: 'auto-sync' },
      { repeat: { pattern: '0 * * * *' }, jobId: 'auto-sync-cron' }
    )
  }

  async shutdown() {
    await this.worker?.close()
  }
}
