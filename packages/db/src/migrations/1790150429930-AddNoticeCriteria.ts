import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNoticeCriteria1790150429930 implements MigrationInterface {
    name = 'AddNoticeCriteria1790150429930'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notice_criteria" ("notice_id" uuid NOT NULL, "application_start_date" date, "application_end_date" date, "announcement_date" date, "categories" jsonb NOT NULL, "ranks" jsonb NOT NULL, "income_table" jsonb NOT NULL, "manual_check_notes" jsonb NOT NULL, "uncertain_notes" jsonb NOT NULL, "model" character varying(60) NOT NULL, "source_file_name" character varying(300) NOT NULL, "extracted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e0769df7b3a2eede3d850bf0269" PRIMARY KEY ("notice_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e0769df7b3a2eede3d850bf026" ON "notice_criteria"  ("notice_id") `);
        await queryRunner.query(`CREATE TYPE "public"."notices_analysis_status_enum" AS ENUM('PENDING', 'ANALYZED', 'FAILED', 'SKIPPED')`);
        await queryRunner.query(`ALTER TABLE "notices" ADD "analysis_status" "public"."notices_analysis_status_enum" NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE "notices" ADD "analysis_attempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "analysis_attempts"`);
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "analysis_status"`);
        await queryRunner.query(`DROP TYPE "public"."notices_analysis_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e0769df7b3a2eede3d850bf026"`);
        await queryRunner.query(`DROP TABLE "notice_criteria"`);
    }

}
