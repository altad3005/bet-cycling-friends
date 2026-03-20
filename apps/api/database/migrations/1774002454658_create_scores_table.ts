import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'scores'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('race_id').notNullable().references('id').inTable('races').onDelete('CASCADE')
      table.uuid('league_id').notNullable().references('id').inTable('leagues').onDelete('CASCADE')
      table.float('points').notNullable().defaultTo(0)
      table.float('max_possible').notNullable().defaultTo(0)
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.unique(['user_id', 'race_id', 'league_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}