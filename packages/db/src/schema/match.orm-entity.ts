import { VerdictEnum } from '@everyone-house/domain';
import type { Verdict } from '@everyone-house/domain';
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'matches' })
@Index(['noticeId', 'profileId'], { unique: true })
export class MatchOrmEntity {
  @PrimaryColumn({ type: 'uuid', name: 'match_id' })
  matchId!: string;

  @Column({ type: 'uuid', name: 'notice_id' })
  noticeId!: string;

  @Column({ type: 'uuid', name: 'profile_id' })
  profileId!: string;

  @Column({ type: 'enum', enum: VerdictEnum })
  verdict!: Verdict;

  /** JudgeReason[]. jsonb 는 ORM 경계에서 unknown (notice.orm-entity 주석 참조). */
  @Column({ type: 'jsonb' })
  reasons!: unknown;

  /** 판정에 사용한 기준표 버전. 과거 판정 재현용. (SPEC D5) */
  @Column({ type: 'varchar', length: 40 })
  ruleset!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
