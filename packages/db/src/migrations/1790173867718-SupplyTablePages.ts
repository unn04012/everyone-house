import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SupplyTablePages1790173867718 implements MigrationInterface {
    name = 'SupplyTablePages1790173867718'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notice_criteria" RENAME COLUMN "supply_units" TO "supply_table_pages"`);
        await queryRunner.query(`ALTER TABLE "notice_criteria" ALTER COLUMN "supply_table_pages" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notice_criteria" ALTER COLUMN "supply_table_pages" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notice_criteria" RENAME COLUMN "supply_table_pages" TO "supply_units"`);
    }

}
