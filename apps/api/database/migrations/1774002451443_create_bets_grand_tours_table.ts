import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bets_grand_tour'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('race_id').notNullable().references('id').inTable('races').onDelete('CASCADE')
      table.string('status', 50).notNullable().defaultTo('open')
      table.timestamp('placed_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamps(true, true)
      table.unique(['user_id', 'race_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}