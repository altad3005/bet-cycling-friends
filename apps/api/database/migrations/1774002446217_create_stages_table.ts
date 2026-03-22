import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('race_id').notNullable().references('id').inTable('races').onDelete('CASCADE')
      table.integer('number').notNullable()
      table.string('name', 200).notNullable()
      table.string('date', 10).nullable()        // MM-DD format from PCS
      table.string('profile_icon', 10).nullable() // p1..p5
      table.timestamps(true, true)
      table.unique(['race_id', 'number'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
