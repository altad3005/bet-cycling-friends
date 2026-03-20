import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'races'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.integer('season_year').notNullable().references('year').inTable('seasons').onDelete('RESTRICT')
      table.string('slug', 150).notNullable()
      table.string('name', 200).notNullable()
      table.string('race_type', 50).notNullable()
      table.string('multiplier_type', 50).notNullable()
      table.string('status', 50).notNullable().defaultTo('upcoming')
      table.boolean('is_grand_tour').notNullable().defaultTo(false)
      table.boolean('results_final').notNullable().defaultTo(false)
      table.timestamp('start_at', { useTz: true }).nullable()
      table.timestamp('end_at', { useTz: true }).nullable()
      table.timestamp('last_synced_at', { useTz: true }).nullable()
      table.timestamps(true, true)
      table.unique(['slug', 'season_year'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}