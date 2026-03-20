import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('pseudo', 50).notNullable().unique()
      table.string('email', 255).notNullable().unique()
      table.string('password_hash', 255).nullable()
      table.string('icon', 50).notNullable().defaultTo('cyclist')
      table.string('google_id', 255).nullable().unique()
      table.boolean('notifications_enabled').notNullable().defaultTo(true)
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}