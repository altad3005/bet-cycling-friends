import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'races'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('reminder24h_sent_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('reminder24h_sent_at')
    })
  }
}
