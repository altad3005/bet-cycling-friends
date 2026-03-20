import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'push_subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.text('endpoint').notNullable()
      table.string('p256dh', 255).notNullable()
      table.string('auth', 255).notNullable()
      table.timestamps(true, true)
      table.unique(['user_id', 'endpoint'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}