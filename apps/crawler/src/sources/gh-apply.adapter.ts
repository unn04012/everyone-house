import { NoticeAttachment, NoticeEntity } from '@everyone-house/domain';
import type { NoticeStatus, SourceId, SupplyType } from '@everyone-house/domain';
import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'node-html-parser';
import { SourceConfigService } from '../config/source/source-config.service.js';
import { HttpClient } from '../http/http-client.js';
import type { IAttachmentResolver, ISourceAdapter } from './source.adapter.interface.js';

/** 목록의 '유형' 표기 → 공급 유형. */
const SUPPLY_TYPE_BY_LABEL: Record<string, SupplyType> = {
  행복주택: 'HAPPY_HOUSE',
  국민임대: 'NATIONAL_RENTAL',
  장기전세: 'LONG_TERM_JEONSE',
  통합공공임대: 'INTEGRATED_PUBLIC',
  공공임대: 'PUBLIC_RENTAL',
  영구임대: 'PERMANENT_RENTAL',
  매입임대: 'PURCHASED_RENTAL',
  전세임대: 'JEONSE_RENTAL',
};

/** 목록의 '상태' 표기 → 정규화 상태. 빈 칸('-')인 행이 실제로 있다. */
const STATUS_BY_LABEL: Record<string, NoticeStatus> = {
  공고중: 'OPEN',
  접수중: 'OPEN',
  접수마감: 'CLOSED',
};

/**
 * 경기주택도시공사(GH) 청약 공고.
 *
 * 목록·상세가 모두 POST 지만 파라미터가 목록 HTML 에 그대로 드러나 있다:
 *   목록 행의 <a> 에 data-pbancNo / data-pbancKndCd / data-bizTyNm
 *   → POST selectPbancDetailView.do { pbancNo, pbancKndCd, bizTyNm, previewYn }
 *
 * 공고문 첨부는 상세 페이지에 **직접 GET URL** 로 실려 있다 — 세 소스 중 가장 단순하다
 * (SH 는 리다이렉트 역산, LH 는 POST 전용).
 */
@Injectable()
export class GhApplyAdapter implements ISourceAdapter, IAttachmentResolver {
  public readonly sourceId: SourceId = 'GH_APPLY';

  private readonly _logger = new Logger(GhApplyAdapter.name);

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _sourceConfig: SourceConfigService,
  ) {}

  public async fetchNotices(): Promise<NoticeEntity[]> {
    const html = await this._httpClient.fetchHtml(this._sourceConfig.ghListUrl);
    const notices = this.parseList(html);
    this._logger.log(`GH 목록에서 공고 ${notices.length}건 수집`);
    return notices;
  }

  public async resolveAttachments(externalId: string): Promise<NoticeAttachment[]> {
    // 상세 요청에 필요한 부가 파라미터는 목록에서 얻어 rawJson 에 넣어 두지만,
    // 서버가 pbancNo 만으로도 응답하므로 최소 파라미터로 요청한다.
    const html = await this._httpClient.postHtml(this._sourceConfig.ghDetailUrl, {
      pbancNo: externalId,
      pbancKndCd: '01',
      previewYn: 'N',
    });

    return this.parseAttachments(html);
  }

  /** 목록 테이블 파싱. 테스트에서 저장된 HTML 로 직접 호출한다. */
  public parseList(html: string): NoticeEntity[] {
    const root = parse(html);
    const notices: NoticeEntity[] = [];

    for (const row of root.querySelectorAll('table tbody tr')) {
      const anchor = row.querySelector('a[data-pbancNo]');
      const externalId = anchor?.getAttribute('data-pbancNo');

      if (!anchor || !externalId) {
        continue;
      }

      const cells = row.querySelectorAll('td').map((cell) => cell.text.replace(/\s+/g, ' ').trim());
      const supplyTypeLabel = anchor.getAttribute('data-bizTyNm') ?? cells[1] ?? '';
      const statusLabel = cells[7] ?? '';

      notices.push(
        NoticeEntity.create({
          sourceId: this.sourceId,
          externalId,
          supplyType: SUPPLY_TYPE_BY_LABEL[supplyTypeLabel] ?? 'OTHER',
          status: STATUS_BY_LABEL[statusLabel] ?? 'UNKNOWN',
          title: anchor.text.replace(/\s+/g, ' ').trim(),
          region: cells[3] ? `경기도 ${cells[3]}` : '경기도',
          detailUrl: this._sourceConfig.ghDetailUrl,
          postedAt: this._parseDate(cells[5] ?? ''),
          closesAt: this._parseDate(cells[6] ?? ''),
          rawJson: {
            listNo: cells[0],
            supplyTypeLabel,
            statusLabel,
            pbancKndCd: anchor.getAttribute('data-pbancKndCd'),
            regionLabel: cells[3],
            competition: cells[8],
            views: cells[9],
          },
        }),
      );
    }

    return notices;
  }

  /** 상세 HTML 의 공고문 첨부. GH 는 GET URL 이 그대로 노출된다. */
  public parseAttachments(html: string): NoticeAttachment[] {
    const root = parse(html);
    const attachments: NoticeAttachment[] = [];

    for (const anchor of root.querySelectorAll('a[href*="selectFileDown.do"]')) {
      const fileUrl = anchor.getAttribute('href');
      if (!fileUrl) {
        continue;
      }

      // 파일명 뒤에 "(827950 Byte)" 가 붙어 있어 떼어낸다.
      const fileName = anchor.text
        .replace(/\s+/g, ' ')
        .replace(/\s*\(\d+\s*Byte\)\s*$/i, '')
        .trim();

      attachments.push(
        NoticeAttachment.create({
          fileSeq: attachments.length + 1,
          fileName,
          previewUrl: fileUrl,
          fileUrl,
          downloadRef: null,
        }),
      );
    }

    return attachments;
  }

  private _parseDate(text: string): Date | null {
    const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
    return matched ? new Date(`${matched[1]}-${matched[2]}-${matched[3]}T00:00:00Z`) : null;
  }
}
