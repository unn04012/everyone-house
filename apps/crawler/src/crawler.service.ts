import type { INoticeRepository, NoticeEntity, SourceId } from '@everyone-house/domain';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IAttachmentResolver, ISourceAdapter } from './sources/source.adapter.interface.js';
import { Symbols } from './symbols.js';

export interface SourceOutcome {
  sourceId: SourceId;
  fetched: number;
  newNotices: NoticeEntity[];
  error: string | null;
}

export interface CrawlResult {
  outcomes: SourceOutcome[];
  totalNew: number;
}

/**
 * 수집 파이프라인: 수집 → 정규화(어댑터) → dedupe → 저장 (SPEC §4)
 *
 * 엔트리(CLI / Lambda handler)는 이 클래스를 호출하기만 한다.
 * 상주 프로세스를 가정하지 않는다 — 스케줄러도, 재사용 커넥션도 갖지 않는다.
 */
@Injectable()
export class CrawlerService {
  /** 상세 페이지 연속 요청 간격 */
  private static readonly DETAIL_REQUEST_INTERVAL_MS = 500;

  private readonly _logger = new Logger(CrawlerService.name);

  constructor(
    @Inject(Symbols.sourceAdapters) private readonly _sourceAdapters: ISourceAdapter[],
    @Inject(Symbols.noticeRepository) private readonly _noticeRepository: INoticeRepository,
  ) {}

  public async runCrawl(): Promise<CrawlResult> {
    this._logger.log(`수집 시작 — 소스 ${this._sourceAdapters.length}개`);

    // 한 소스가 실패해도 나머지는 계속 진행한다 (SPEC §9).
    const settled = await Promise.allSettled(this._sourceAdapters.map((adapter) => this._collectFrom(adapter)));

    const outcomes = settled.map((result, index) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            sourceId: this._sourceAdapters[index].sourceId,
            fetched: 0,
            newNotices: [],
            error: String(result.reason),
          },
    );

    const totalNew = outcomes.reduce((sum, outcome) => sum + outcome.newNotices.length, 0);
    this._logger.log(`수집 완료 — 신규 ${totalNew}건`);

    return { outcomes, totalNew };
  }

  private async _collectFrom(adapter: ISourceAdapter): Promise<SourceOutcome> {
    try {
      const notices = await adapter.fetchNotices();
      const newNotices = await this._selectNew(adapter.sourceId, notices);

      // 공고문 첨부는 상세 페이지에 있어 요청이 추가로 든다 — 신규 공고에만 수행한다.
      await this._attachDocuments(adapter, newNotices);

      // 기존 공고도 다시 저장한다 — 모집상태가 바뀌었을 수 있다 (upsert).
      await this._noticeRepository.saveAll(notices);

      this._logger.log(`${adapter.sourceId}: 수집 ${notices.length}건, 신규 ${newNotices.length}건`);
      return { sourceId: adapter.sourceId, fetched: notices.length, newNotices, error: null };
    } catch (error) {
      this._logger.error(`${adapter.sourceId} 수집 실패: ${String(error)}`);
      return { sourceId: adapter.sourceId, fetched: 0, newNotices: [], error: String(error) };
    }
  }

  private async _attachDocuments(adapter: ISourceAdapter, newNotices: NoticeEntity[]): Promise<void> {
    if (!this._supportsAttachments(adapter)) {
      return;
    }

    for (const notice of newNotices) {
      try {
        const attachments = await adapter.resolveAttachments(notice.externalId);
        notice.attachDocuments(attachments);
        this._logger.log(`${notice.externalId}: 첨부 ${attachments.length}건`);
      } catch (error) {
        // 첨부를 못 가져와도 공고 자체는 알릴 가치가 있다.
        this._logger.warn(`${notice.externalId} 첨부 수집 실패: ${String(error)}`);
      }

      await this._sleep(CrawlerService.DETAIL_REQUEST_INTERVAL_MS);
    }
  }

  private _supportsAttachments(adapter: ISourceAdapter): adapter is ISourceAdapter & IAttachmentResolver {
    return typeof (adapter as Partial<IAttachmentResolver>).resolveAttachments === 'function';
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async _selectNew(sourceId: SourceId, notices: NoticeEntity[]): Promise<NoticeEntity[]> {
    const seen = await this._noticeRepository.findSeenExternalIds(sourceId);
    return notices.filter((notice) => !seen.has(notice.externalId));
  }
}
