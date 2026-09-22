import type { NoticeEntity } from '../domain/notice.entity.js';
import type { SourceId } from '../domain/notice.types.js';

export interface INoticeRepository {
  /** dedupe 키(소스 + 소스내 공고 ID)로 기존 공고를 찾는다. */
  findByExternalId(sourceId: SourceId, externalId: string): Promise<NoticeEntity | null>;

  /** 한 소스에서 이미 본 externalId 집합. 신규 감지에 쓴다. */
  findSeenExternalIds(sourceId: SourceId): Promise<Set<string>>;

  /** create or update */
  save(entity: NoticeEntity): Promise<NoticeEntity>;

  saveAll(entities: NoticeEntity[]): Promise<NoticeEntity[]>;
}
