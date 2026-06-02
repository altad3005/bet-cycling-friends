import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('icon', 50).notNullable().defaultTo('').alter()
    })
    this.defer(async (db) => {
      await db.from(this.tableName).where('icon', 'cyclist').update({ icon: '' })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('icon', 50).notNullable().defaultTo('cyclist').alter()
    })
  }
}
