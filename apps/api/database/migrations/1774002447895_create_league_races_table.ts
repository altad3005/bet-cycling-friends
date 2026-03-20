import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'league_races'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('league_id').notNullable().references('id').inTable('leagues').onDelete('CASCADE')
      table.uuid('race_id').notNullable().references('id').inTable('races').onDelete('CASCADE')
      table.timestamp('added_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.unique(['league_id', 'race_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}