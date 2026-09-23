import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplyUnits1790173221600 implements MigrationInterface {
    name = 'AddSupplyUnits1790173221600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notice_criteria" ADD "supply_units" jsonb NOT NULL DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notice_criteria" DROP COLUMN "supply_units"`);
    }

}
