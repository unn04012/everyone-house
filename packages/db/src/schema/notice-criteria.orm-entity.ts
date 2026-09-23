import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * 공고문에서 추출한 자격·순위 기준.
 *
 * 공고당 1행. 추출은 비싸고 느리므로(공고당 약 1분, LLM 호출) 한 번 뽑아 저장하고
 * 판정은 이 행을 읽어 코드로 한다. model·extractedAt 을 남겨 두면
 * 추출 스키마나 모델을 바꿨을 때 재추출 대상을 고를 수 있다.
 */
@Entity({ name: 'notice_criteria' })
@Index(['noticeId'], { unique: true })
export class NoticeCriteriaOrmEntity {
  @PrimaryColumn({ type: 'uuid', name: 'notice_id' })
  noticeId!: string;

  @Column({ type: 'date', name: 'application_start_date', nullable: true })
  applicationStartDate!: string | null;

  /** SH 공고는 목록에 마감일이 없어 이 값이 유일한 출처다 */
  @Column({ type: 'date', name: 'application_end_date', nullable: true })
  applicationEndDate!: string | null;

  /** 입주자모집공고일 — 자격 판단 기준일 */
  @Column({ type: 'date', name: 'announcement_date', nullable: true })
  announcementDate!: string | null;

  /** CategoryRule[] */
  @Column({ type: 'jsonb' })
  categories!: unknown;

  /** RankRule[] */
  @Column({ type: 'jsonb' })
  ranks!: unknown;

  /** IncomeTableRow[] — 이게 있어야 판정을 자동화할 수 있다 */
  @Column({ type: 'jsonb', name: 'income_table' })
  incomeTable!: unknown;

  /** string[] */
  @Column({ type: 'jsonb', name: 'manual_check_notes' })
  manualCheckNotes!: unknown;

  /** string[] — 비어있지 않으면 판정을 NEEDS_REVIEW 로 떨어뜨린다 */
  @Column({ type: 'jsonb', name: 'uncertain_notes' })
  uncertainNotes!: unknown;

  @Column({ type: 'varchar', length: 60 })
  model!: string;

  @Column({ type: 'varchar', length: 300, name: 'source_file_name' })
  sourceFileName!: string;

  @Column({ type: 'timestamptz', name: 'extracted_at' })
  extractedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
