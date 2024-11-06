import { Migration } from "@mikro-orm/migrations"

export class Migration20241106090002 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "capture" add column if not exists "data" jsonb not null;'
    )
    this.addSql(
      'alter table if exists "refund" add column if not exists "data" jsonb not null;'
    )
    this.addSql(
      'alter table if exists "payment_collection" drop constraint if exists "payment_collection_status_check";'
    )
    this.addSql(
      'alter table if exists "payment_session" drop constraint if exists "payment_session_status_check";'
    )
    this.addSql(
      'alter table if exists "payment_session" alter column "provider_id" drop not null;'
    )
  }

  async down(): Promise<void> {
    // TODO
  }
}
