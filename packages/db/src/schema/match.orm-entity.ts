import { VerdictEnum } from '@everyone-house/domain';
import type { Verdict } from '@everyone-house/domain';
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * 공고 × 프로필 판정 결과.
 *
 * 재판정이 새 행을 쌓지 않도록 matchId 를 (noticeId, profileId) 에서 결정론적으로 만든다.
 * 프로필이 바뀌거나 공고문 추출이 갱신되면 같은 행을 덮어쓴다.
 */
@Entity({ name: 'matches' })
@Index(['noticeId', 'profileId'], { unique: true })
export class MatchOrmEntity {
  @PrimaryColumn({ type: 'uuid', name: 'match_id' })
  matchId!: string;

  @Column({ type: 'uuid', name: 'notice_id' })
  noticeId!: string;

  @Column({ type: 'uuid', name: 'profile_id' })
  profileId!: string;

  /** 계층별 결과 중 가장 유리한 것 */
  @Column({ type: 'enum', enum: VerdictEnum })
  verdict!: Verdict;

  /** 그 결과를 낸 계층 */
  @Column({ type: 'varchar', length: 120, name: 'category_label', nullable: true })
  categoryLabel!: string | null;

  /** JudgeReason[] */
  @Column({ type: 'jsonb' })
  reasons!: unknown;

  /** 판정 근거의 출처. 과거 판정 재현용 */
  @Column({ type: 'varchar', length: 120 })
  ruleset!: string;

  /** CategoryOutcome[] — 어느 계층으로 신청하면 되는지 보여줄 때 쓴다 */
  @Column({ type: 'jsonb', name: 'category_outcomes' })
  categoryOutcomes!: unknown;

  @Column({ type: 'int', name: 'best_rank', nullable: true })
  bestRank!: number | null;

  @Column({ type: 'int', name: 'best_priority_rank', nullable: true })
  bestPriorityRank!: number | null;

  /** RankEvaluation[] */
  @Column({ type: 'jsonb', name: 'rank_evaluations' })
  rankEvaluations!: unknown;

  @Column({ type: 'timestamptz', name: 'judged_at' })
  judgedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
