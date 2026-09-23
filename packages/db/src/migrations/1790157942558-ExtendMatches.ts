import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendMatches1790157942558 implements MigrationInterface {
    name = 'ExtendMatches1790157942558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" ADD "category_label" character varying(120)`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "category_outcomes" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "best_rank" integer`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "best_priority_rank" integer`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "rank_evaluations" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "judged_at" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "ruleset"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "ruleset" character varying(120) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "ruleset"`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "ruleset" character varying(40) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "judged_at"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "rank_evaluations"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "best_priority_rank"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "best_rank"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "category_outcomes"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "category_label"`);
    }

}
