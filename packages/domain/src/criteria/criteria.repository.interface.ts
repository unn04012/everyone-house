import type { NoticeCriteriaRecord } from './criteria.types.js';

export interface ICriteriaRepository {
  findByNoticeId(noticeId: string): Promise<NoticeCriteriaRecord | null>;
  save(record: NoticeCriteriaRecord): Promise<NoticeCriteriaRecord>;
}
