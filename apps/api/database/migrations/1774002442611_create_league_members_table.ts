import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'league_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('league_id').notNullable().references('id').inTable('leagues').onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.boolean('is_admin').notNullable().defaultTo(false)
      table.timestamp('joined_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamps(true, true)
      table.unique(['league_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}