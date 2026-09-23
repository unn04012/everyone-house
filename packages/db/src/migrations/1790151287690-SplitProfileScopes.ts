import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitProfileScopes1790151287690 implements MigrationInterface {
    name = 'SplitProfileScopes1790151287690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "monthly_income"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "total_assets"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "personal_income" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "personal_assets" bigint`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "household_income" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "household_assets" bigint`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "parents_income" bigint`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "parents_assets" bigint`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "lives_with_parents" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "is_basic_living_beneficiary" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "is_second_lowest_income" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "is_supported_single_parent" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "is_supported_single_parent"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "is_second_lowest_income"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "is_basic_living_beneficiary"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "lives_with_parents"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "parents_assets"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "parents_income"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "household_assets"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "household_income"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "personal_assets"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "personal_income"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "total_assets" bigint`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "monthly_income" bigint NOT NULL`);
    }

}
