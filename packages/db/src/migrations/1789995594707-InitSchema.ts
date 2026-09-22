import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1789995594707 implements MigrationInterface {
    name = 'InitSchema1789995594707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."matches_verdict_enum" AS ENUM('LIKELY_ELIGIBLE', 'NEEDS_REVIEW', 'NOT_ELIGIBLE')`);
        await queryRunner.query(`CREATE TABLE "matches" ("match_id" uuid NOT NULL, "notice_id" uuid NOT NULL, "profile_id" uuid NOT NULL, "verdict" "public"."matches_verdict_enum" NOT NULL, "reasons" jsonb NOT NULL, "ruleset" character varying(40) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_fc1e0ceed974649e53f113ca67e" PRIMARY KEY ("match_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9bd19670a32e88811b1093be23" ON "matches"  ("notice_id", "profile_id") `);
        await queryRunner.query(`CREATE TYPE "public"."notices_source_id_enum" AS ENUM('MYHOME_API', 'SH_PORTAL', 'GH_APPLY')`);
        await queryRunner.query(`CREATE TYPE "public"."notices_supply_type_enum" AS ENUM('INTEGRATED_PUBLIC', 'HAPPY_HOUSE', 'NATIONAL_RENTAL', 'PUBLIC_RENTAL', 'PERMANENT_RENTAL', 'PURCHASED_RENTAL', 'LONG_TERM_JEONSE', 'YOUTH_SAFE_HOUSE', 'JEONSE_RENTAL', 'NEWLYWED_HOPE_TOWN', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."notices_status_enum" AS ENUM('OPEN', 'CLOSED', 'UNKNOWN')`);
        await queryRunner.query(`CREATE TABLE "notices" ("notice_id" uuid NOT NULL, "source_id" "public"."notices_source_id_enum" NOT NULL, "external_id" character varying(200) NOT NULL, "supply_type" "public"."notices_supply_type_enum" NOT NULL, "status" "public"."notices_status_enum" NOT NULL, "title" text NOT NULL, "region" character varying(100), "detail_url" text, "posted_at" TIMESTAMP WITH TIME ZONE, "closes_at" TIMESTAMP WITH TIME ZONE, "raw_json" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2559826c25fa5caebd5863a25bb" PRIMARY KEY ("notice_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f69cde328608b9529b159401bc" ON "notices"  ("source_id", "external_id") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_channel_enum" AS ENUM('TELEGRAM', 'EMAIL')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('SENT', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("notification_id" uuid NOT NULL, "match_id" uuid NOT NULL, "channel" "public"."notifications_channel_enum" NOT NULL, "status" "public"."notifications_status_enum" NOT NULL, "error" text, "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_eaedfe19f0f765d26afafa85956" PRIMARY KEY ("notification_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_80cbbbdc8f5b6d57a57648ff65" ON "notifications"  ("match_id", "channel") `);
        await queryRunner.query(`CREATE TYPE "public"."user_profiles_marital_status_enum" AS ENUM('SINGLE', 'NEWLYWED', 'MARRIED')`);
        await queryRunner.query(`CREATE TABLE "user_profiles" ("profile_id" uuid NOT NULL, "household_size" integer NOT NULL, "monthly_income" bigint NOT NULL, "total_assets" bigint NOT NULL, "car_value" bigint NOT NULL, "is_homeless" boolean NOT NULL, "age" integer NOT NULL, "marital_status" "public"."user_profiles_marital_status_enum" NOT NULL, "region" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_acac04b2506d607942b566710e1" PRIMARY KEY ("profile_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_profiles"`);
        await queryRunner.query(`DROP TYPE "public"."user_profiles_marital_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_80cbbbdc8f5b6d57a57648ff65"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_channel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f69cde328608b9529b159401bc"`);
        await queryRunner.query(`DROP TABLE "notices"`);
        await queryRunner.query(`DROP TYPE "public"."notices_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notices_supply_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notices_source_id_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9bd19670a32e88811b1093be23"`);
        await queryRunner.query(`DROP TABLE "matches"`);
        await queryRunner.query(`DROP TYPE "public"."matches_verdict_enum"`);
    }

}
