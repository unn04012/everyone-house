import type { NoticeEntity } from '../domain/notice.entity.js';
import type { AnalysisStatus, SourceId } from '../domain/notice.types.js';

export interface INoticeRepository {
  /** dedupe 키(소스 + 소스내 공고 ID)로 기존 공고를 찾는다. */
  findByExternalId(sourceId: SourceId, externalId: string): Promise<NoticeEntity | null>;

  /** 한 소스에서 이미 본 externalId 집합. 신규 감지에 쓴다. */
  findSeenExternalIds(sourceId: SourceId): Promise<Set<string>>;

  /** create or update */
  save(entity: NoticeEntity): Promise<NoticeEntity>;

  saveAll(entities: NoticeEntity[]): Promise<NoticeEntity[]>;

  /** 분석 대기 중인 공고를 배치 크기만큼 가져온다. 수집 잡과 분석 잡을 나누기 위한 큐다. */
  findPendingAnalysis(limit: number): Promise<NoticeEntity[]>;

  updateAnalysisStatus(noticeId: string, status: AnalysisStatus, attempts: number): Promise<void>;

  /** 관심 없는 유형을 분석 대상에서 제외한다 (LLM 비용 절감). */
  skipAnalysisExcept(supplyTypes: readonly string[]): Promise<number>;
}
