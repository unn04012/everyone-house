import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNoticeAttachments1790077548007 implements MigrationInterface {
    name = 'AddNoticeAttachments1790077548007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notices" ADD "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "attachments"`);
    }

}
