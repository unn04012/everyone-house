import { NoticeEntity } from '@everyone-house/domain';
import type { NoticeAttachment, NoticeStatus, SourceId, SupplyType } from '@everyone-house/domain';
import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'node-html-parser';
import { SourceConfigService } from '../config/source/source-config.service.js';
import { HttpClient } from '../http/http-client.js';
import { ShDetailAdapter } from './sh-detail.adapter.js';
import type { IAttachmentResolver, ISourceAdapter } from './source.adapter.interface.js';


/** 목록의 '청약유형' 표기 → 공급 유형. 목록에 실제로 나타나는 값 기준. (SPEC §3.2) */
const SUPPLY_TYPE_BY_LABEL: Record<string, SupplyType> = {
  국민공공임대주택: 'NATIONAL_RENTAL',
  행복주택: 'HAPPY_HOUSE',
  청년안심주택: 'YOUTH_SAFE_HOUSE',
  장기전세주택: 'LONG_TERM_JEONSE',
  매입임대주택: 'PURCHASED_RENTAL',
  전세임대: 'JEONSE_RENTAL',
  장기안심주택: 'JEONSE_RENTAL',
  도시형생활주택: 'OTHER',
  두레주택: 'OTHER',
  희망하우징: 'OTHER',
  재개발임대주택: 'OTHER',
  수요자맞춤형: 'OTHER',
  상가임대: 'OTHER',
  용지분양: 'OTHER',
};

/** 목록의 '모집상태' 표기 → 정규화 상태. 빈 칸인 행이 실제로 존재한다. */
const STATUS_BY_LABEL: Record<string, NoticeStatus> = {
  모집중: 'OPEN',
  모집마감: 'CLOSED',
};

@Injectable()
export class ShPortalAdapter implements ISourceAdapter, IAttachmentResolver {
  public readonly sourceId: SourceId = 'SH_PORTAL';

  private readonly _logger = new Logger(ShPortalAdapter.name);

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _shDetailAdapter: ShDetailAdapter,
    private readonly _sourceConfig: SourceConfigService,
  ) {}

  /** 공고문 PDF 는 상세 페이지에만 있다. 신규 공고에만 호출한다. */
  public async resolveAttachments(externalId: string): Promise<NoticeAttachment[]> {
    return await this._shDetailAdapter.fetchAttachments(externalId);
  }

  public async fetchNotices(): Promise<NoticeEntity[]> {
    const html = await this._httpClient.fetchHtml(this._sourceConfig.shListUrl);
    const notices = this._parseList(html);
    this._logger.log(`SH 목록에서 공고 ${notices.length}건 수집`);
    return notices;
  }

  /** 목록 테이블 파싱. 테스트에서 저장된 HTML 로 직접 호출한다. */
  public parseList(html: string): NoticeEntity[] {
    return this._parseList(html);
  }

  private _parseList(html: string): NoticeEntity[] {
    const root = parse(html);
    const rows = root.querySelectorAll('table tbody tr');
    const notices: NoticeEntity[] = [];

    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 8) {
        continue;
      }

      // 상세 링크의 seq 가 소스 내 고유 ID다.
      // 주의: 공고명 칸에 주석 처리된 앵커(seq=행번호)가 있어 행 전체에서 찾으면 잘못 잡힌다.
      const detailUrl = cells[7].querySelector('a')?.getAttribute('href') ?? null;
      const externalId = detailUrl ? (/[?&]seq=(\d+)/.exec(detailUrl)?.[1] ?? null) : null;

      if (!externalId) {
        this._logger.warn(`상세 링크에서 seq 를 찾지 못해 건너뜁니다: ${row.text.replace(/\s+/g, ' ').trim().slice(0, 60)}`);
        continue;
      }

      const supplyTypeLabel = cells[1].text.trim();
      const title = cells[2].text.replace(/\s+/g, ' ').trim();
      const statusLabel = cells[5].text.trim();

      notices.push(
        NoticeEntity.create({
          sourceId: this.sourceId,
          externalId,
          supplyType: SUPPLY_TYPE_BY_LABEL[supplyTypeLabel] ?? 'OTHER',
          status: STATUS_BY_LABEL[statusLabel] ?? 'UNKNOWN',
          title,
          region: '서울특별시',
          detailUrl,
          postedAt: this._parseDate(cells[3].text),
          rawJson: {
            listNo: cells[0].text.trim(),
            supplyTypeLabel,
            statusLabel,
            announceDate: cells[4].text.trim(),
            department: cells[6].text.trim(),
          },
        }),
      );
    }

    return notices;
  }

  /** '-' 처럼 날짜가 없는 칸이 실제로 존재한다. */
  private _parseDate(text: string): Date | null {
    const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
    return matched ? new Date(`${matched[1]}-${matched[2]}-${matched[3]}T00:00:00Z`) : null;
  }
}
