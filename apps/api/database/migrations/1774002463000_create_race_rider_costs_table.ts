import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'race_rider_costs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('race_id').notNullable().references('id').inTable('races').onDelete('CASCADE')
      table.uuid('rider_id').notNullable().references('id').inTable('riders').onDelete('CASCADE')
      table.integer('pcs_rank').nullable()
      table.integer('cost').notNullable()
      table.timestamp('snapshotted_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.unique(['race_id', 'rider_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
