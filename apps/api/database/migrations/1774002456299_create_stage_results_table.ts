import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stage_results'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('race_id').notNullable().references('id').inTable('races').onDelete('CASCADE')
      table.uuid('rider_id').notNullable().references('id').inTable('riders').onDelete('RESTRICT')
      table.integer('stage_number').notNullable()
      table.integer('rank').notNullable()
      table.string('result_type', 20).notNullable().defaultTo('stage')
      table.timestamp('result_at', { useTz: true }).nullable()
      table.timestamps(true, true)
      table.unique(['race_id', 'rider_id', 'stage_number', 'result_type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}