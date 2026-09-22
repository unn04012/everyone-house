import type { NoticeAttachment, NoticeEntity, SourceId } from '@everyone-house/domain';

/**
 * 소스 어댑터. 소스별 원시 형태(HTML, JSON)는 어댑터 밖으로 새지 않는다 —
 * 정규화된 NoticeEntity 만 돌려준다. 원본은 rawJson 에 보존한다.
 */
export interface ISourceAdapter {
  readonly sourceId: SourceId;

  /** 목록 1페이지를 수집한다. 새 공고는 맨 위에 오므로 신규 감지에는 1페이지로 충분하다. */
  fetchNotices(): Promise<NoticeEntity[]>;
}

/**
 * 공고문 첨부까지 뽑을 수 있는 어댑터. 상세 페이지 요청이 추가로 들기 때문에
 * 신규 공고에만 수행한다. 모든 소스가 구현할 필요는 없다.
 */
export interface IAttachmentResolver {
  resolveAttachments(externalId: string): Promise<NoticeAttachment[]>;
}
