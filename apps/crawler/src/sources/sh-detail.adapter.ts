import { NoticeAttachment } from '@everyone-house/domain';
import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'node-html-parser';
import { SourceConfigService } from '../config/source/source-config.service.js';
import { HttpClient } from '../http/http-client.js';

/**
 * SH 상세 페이지에서 공고문 첨부를 뽑는다.
 *
 * 다운로드 버튼은 `onclick="existFile('0')"` 인데 그 함수는 페이지 어디에도 정의되어 있지 않다.
 * 대신 '미리보기' 링크가 정적 GET 이라 이것을 기점으로 원본 파일 URL 을 도출한다:
 *
 *   1) 상세 페이지        → 파일명 + /main/com/util/htmlConverter.do?...&file_seq=N
 *   2) htmlConverter      → 302 Location: /main/skin/doc.html?fn={hash}&rs=/main/upload/bbs/GS0401/{yyyy}/{mm}/html/
 *   3) 원본 PDF           → {rs 에서 /html/ 을 뗀 경로}/{fn}.pdf
 *
 * 전 단계가 GET 이라 헤드리스 브라우저가 필요 없다 (SPEC §3.3).
 */
@Injectable()
export class ShDetailAdapter {

  private readonly _logger = new Logger(ShDetailAdapter.name);

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _sourceConfig: SourceConfigService,
  ) {}

  public async fetchAttachments(externalId: string): Promise<NoticeAttachment[]> {
    const html = await this._httpClient.fetchHtml(`${this._sourceConfig.shDetailUrlPrefix}${externalId}`);
    const parsed = this.parseAttachments(html);

    // 원본 파일 URL 은 미리보기 리다이렉트에서만 얻을 수 있어 첨부당 요청이 1회 더 든다.
    const resolved: NoticeAttachment[] = [];
    for (const attachment of parsed) {
      resolved.push(await this._withFileUrl(attachment));
    }

    return resolved;
  }

  /** 상세 HTML 파싱. 테스트에서 저장된 HTML 로 직접 호출한다. */
  public parseAttachments(html: string): NoticeAttachment[] {
    const root = parse(html);
    const attachments: NoticeAttachment[] = [];

    for (const row of root.querySelectorAll('tr.gs0401tr')) {
      const fileName = row.querySelector('a.btnAttach')?.text.replace(/\s+/g, ' ').trim();
      // URL 조각 대신 구조(미리보기 버튼 클래스)로 고른다.
      const previewPath = row.querySelector('a.icoView')?.getAttribute('href');

      if (!fileName || !previewPath) {
        continue;
      }

      const previewUrl = this._absolute(previewPath);
      const fileSeq = Number(/[?&]file_seq=(\d+)/.exec(previewUrl)?.[1] ?? attachments.length + 1);

      attachments.push(NoticeAttachment.create({ fileSeq, fileName, previewUrl, fileUrl: null, downloadRef: null }));
    }

    return attachments;
  }

  /** 미리보기 리다이렉트 Location 에서 원본 파일 URL 을 도출한다. */
  public deriveFileUrl(location: string, fileName: string): string | null {
    const fn = /[?&]fn=([^&]+)/.exec(location)?.[1];
    const rs = /[?&]rs=([^&]+)/.exec(location)?.[1];

    if (!fn || !rs) {
      return null;
    }

    // rs 는 변환본(html) 디렉터리다. 원본은 그 상위에 있다.
    const originDir = decodeURIComponent(rs).replace(/html\/?$/, '');
    const extension = fileName.slice(fileName.lastIndexOf('.'));

    return `${this._sourceConfig.shBaseUrl}${originDir}${fn}${extension}`;
  }

  private async _withFileUrl(attachment: NoticeAttachment): Promise<NoticeAttachment> {
    try {
      const location = await this._httpClient.resolveRedirect(attachment.previewUrl);
      const fileUrl = location ? this.deriveFileUrl(location, attachment.fileName) : null;

      if (!fileUrl) {
        this._logger.warn(`원본 파일 URL 도출 실패, 미리보기로 대체: ${attachment.fileName}`);
        return attachment;
      }

      return NoticeAttachment.create({ ...attachment.getAttachment(), fileUrl });
    } catch (error) {
      this._logger.warn(`첨부 해석 실패(${attachment.fileName}), 미리보기로 대체: ${String(error)}`);
      return attachment;
    }
  }

  private _absolute(path: string): string {
    return path.startsWith('http') ? path : `${this._sourceConfig.shBaseUrl}${path}`;
  }
}
