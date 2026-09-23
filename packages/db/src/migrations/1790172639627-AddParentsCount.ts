import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentsCount1790172639627 implements MigrationInterface {
    name = 'AddParentsCount1790172639627'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "parents_count" integer NOT NULL DEFAULT '2'`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "children_birth_dates" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notices" ALTER COLUMN "attachments" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "parents_count"`);
    }

}
