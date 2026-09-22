import { NoticeAttachment } from '@everyone-house/domain';
import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'node-html-parser';
import { SourceConfigService } from '../config/source/source-config.service.js';
import { HttpClient } from '../http/http-client.js';

/**
 * 마이홈 상세 페이지에서 공고문 첨부를 뽑는다.
 *
 * LH 공고문은 LH 청약 사이트가 아니라 마이홈을 통해 받는다:
 * LH 쪽 robots.txt 가 파일 다운로드 엔드포인트를 명시적으로 금지하는 반면
 * 마이홈은 전체 허용(Allow : /)이고 같은 공고문을 제공한다.
 *
 * 다운로드는 POST 전용이라 알림에 실을 GET URL 이 없다 →
 * 링크는 상세 페이지로 걸고, POST 파라미터는 downloadRef 에 보존해
 * 나중에 공고문 분석기가 그대로 재현할 수 있게 한다.
 */
@Injectable()
export class MyhomeDetailAdapter {
  private static readonly DOWNLOAD_CALL = /fnDownFile\('([^']+)',\s*'([^']+)'\)/;

  private readonly _logger = new Logger(MyhomeDetailAdapter.name);

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _sourceConfig: SourceConfigService,
  ) {}

  public async fetchAttachments(pblancId: string): Promise<NoticeAttachment[]> {
    const detailUrl = `${this._sourceConfig.myhomeDetailUrlPrefix}${pblancId}`;
    const html = await this._httpClient.fetchHtml(detailUrl);
    return this.parseAttachments(html, detailUrl);
  }

  /** 상세 HTML 파싱. 테스트에서 저장된 HTML 로 직접 호출한다. */
  public parseAttachments(html: string, detailUrl: string): NoticeAttachment[] {
    const root = parse(html);
    const attachments: NoticeAttachment[] = [];

    for (const anchor of root.querySelectorAll('a[href*="fnDownFile("]')) {
      const matched = MyhomeDetailAdapter.DOWNLOAD_CALL.exec(anchor.getAttribute('href') ?? '');
      const fileName = anchor.text.replace(/\s+/g, ' ').trim();

      if (!matched || !fileName) {
        continue;
      }

      const [, atchFileId, fileSn] = matched;
      attachments.push(
        NoticeAttachment.create({
          fileSeq: attachments.length + 1,
          fileName,
          previewUrl: detailUrl,
          // POST 로만 받을 수 있어 GET URL 이 없다.
          fileUrl: null,
          downloadRef: { url: this._sourceConfig.myhomeDownloadUrl, params: { atchFileId, fileSn } },
        }),
      );
    }

    if (attachments.length === 0) {
      this._logger.warn(`공고문 첨부를 찾지 못했습니다: ${detailUrl}`);
    }

    return attachments;
  }
}
