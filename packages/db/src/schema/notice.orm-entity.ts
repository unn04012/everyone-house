import { NoticeStatusEnum, SourceIdEnum, SupplyTypeEnum } from '@everyone-house/domain';
import type { NoticeStatus, SourceId, SupplyType } from '@everyone-house/domain';
import { AnalysisStatusEnum } from '@everyone-house/domain';
import type { AnalysisStatus } from '@everyone-house/domain';
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * 영속 스키마. 도메인 엔티티(NoticeEntity)와 분리한다.
 * 컬럼명은 snake_case 로 명시한다 (TypeORM 기본은 프로퍼티명 그대로).
 */
@Entity({ name: 'notices' })
@Index(['sourceId', 'externalId'], { unique: true }) // dedupe 키
export class NoticeOrmEntity {
  @PrimaryColumn({ type: 'uuid', name: 'notice_id' })
  noticeId!: string;

  @Column({ type: 'enum', enum: SourceIdEnum, name: 'source_id' })
  sourceId!: SourceId;

  @Column({ type: 'varchar', length: 200, name: 'external_id' })
  externalId!: string;

  @Column({ type: 'enum', enum: SupplyTypeEnum, name: 'supply_type' })
  supplyType!: SupplyType;

  @Column({ type: 'enum', enum: NoticeStatusEnum })
  status!: NoticeStatus;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region!: string | null;

  @Column({ type: 'text', name: 'detail_url', nullable: true })
  detailUrl!: string | null;

  @Column({ type: 'timestamptz', name: 'posted_at', nullable: true })
  postedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'closes_at', nullable: true })
  closesAt!: Date | null;

  /**
   * 소스 원본. 정규화가 잘못됐을 때 되돌릴 수 있게 보존한다. (SPEC §8)
   * jsonb 는 ORM 경계에서 unknown 으로 둔다 — TypeORM 의 QueryDeepPartialEntity 가
   * 인덱스 시그니처 타입을 재귀 전개해 upsert 시 타입이 깨진다. 형태는 도메인 타입이 보장한다.
   */
  @Column({ type: 'jsonb', name: 'raw_json', nullable: true })
  rawJson!: unknown;

  /** NoticeAttachmentSchema[]. 공고에 종속된 값 객체라 별도 테이블을 두지 않는다. */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  attachments!: unknown;

  /**
   * 공고문 분석 단계. 수집 잡과 분석 잡을 나누기 위한 상태다.
   * 분석은 공고당 1분 가까이 걸려(43건이면 40분) 수집과 한 잡에 둘 수 없다.
   */
  @Column({ type: 'enum', enum: AnalysisStatusEnum, name: 'analysis_status', default: AnalysisStatusEnum.PENDING })
  analysisStatus!: AnalysisStatus;

  /** 실패 누적. 한도를 넘으면 SKIPPED 로 보내 무한 재시도를 막는다 */
  @Column({ type: 'int', name: 'analysis_attempts', default: 0 })
  analysisAttempts!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
