import { Queue } from 'bullmq'
import env from '#start/env'

export type ScoringJobData =
  | { type: 'sync-classic'; raceId: string }
  | { type: 'sync-gt-stage'; raceId: string; stageNumber: number }
  | { type: 'sync-gt-gc'; raceId: string }

const connection = {
  host: env.get('REDIS_HOST'),
  port: env.get('REDIS_PORT'),
}

export const scoringQueue = new Queue<ScoringJobData>('scoring', { connection })
