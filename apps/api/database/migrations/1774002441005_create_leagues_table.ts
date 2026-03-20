import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leagues'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('name', 100).notNullable()
      table.string('code', 20).notNullable().unique()
      table.integer('season').notNullable().references('year').inTable('seasons').onDelete('RESTRICT')
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}