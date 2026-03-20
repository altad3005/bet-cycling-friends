import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bets_grand_tour_riders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('bet_id').notNullable().references('id').inTable('bets_grand_tour').onDelete('CASCADE')
      table.uuid('rider_id').notNullable().references('id').inTable('riders').onDelete('RESTRICT')
      table.unique(['bet_id', 'rider_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}