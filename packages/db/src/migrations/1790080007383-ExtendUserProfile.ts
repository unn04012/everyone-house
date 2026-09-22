import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendUserProfile1790080007383 implements MigrationInterface {
    name = 'ExtendUserProfile1790080007383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "region"`);
        await queryRunner.query(`CREATE TYPE "public"."user_profiles_category_enum" AS ENUM('UNIVERSITY_STUDENT', 'YOUTH', 'NEWLYWED', 'SENIOR', 'ETC')`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "category" "public"."user_profiles_category_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "is_dual_income" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "children_birth_dates" jsonb NOT NULL DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "residence_province" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "residence_district" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "district_moved_in_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "income_source_province" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "income_source_district" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "university_province" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "university_district" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "housing_subscription_payments" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "total_assets" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "car_value" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "car_value" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "total_assets" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "housing_subscription_payments"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "university_district"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "university_province"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "income_source_district"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "income_source_province"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "district_moved_in_at"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "residence_district"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "residence_province"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "children_birth_dates"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "is_dual_income"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."user_profiles_category_enum"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "region" character varying(100) NOT NULL`);
    }

}
