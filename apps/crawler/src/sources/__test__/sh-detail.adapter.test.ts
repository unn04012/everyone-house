import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { SourceConfigService } from '../../config/source/source-config.service.js';
import { HttpClient } from '../../http/http-client.js';
import { ShDetailAdapter } from '../sh-detail.adapter.js';

/** 테스트용 엔드포인트 스텁. 실제 URL 은 .env 로 주입되며 저장소에 두지 않는다. */
class SourceConfigStub {
  public readonly shListUrl = 'https://example-portal.invalid/list/path/list';
  public readonly shBaseUrl = 'https://example-sh.invalid';
  public readonly shDetailUrlPrefix = 'https://example-sh.invalid/detail/path/view.do?seq=';
  public readonly myhomeApiUrl = 'https://example-api.invalid/notices';
  public readonly myhomeDetailUrlPrefix = 'https://example-myhome.invalid/detail.do?pblancId=';
  public readonly myhomeDownloadUrl = 'https://example-myhome.invalid/download.do';
}

describe('ShDetailAdapter', () => {
  let shDetailAdapter: ShDetailAdapter;
  let fixtureHtml: string;

  beforeAll(async () => {
    fixtureHtml = await readFile(join(import.meta.dirname, 'sh-detail.fixture.html'), 'utf8');

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShDetailAdapter, HttpClient, { provide: SourceConfigService, useClass: SourceConfigStub }],
    }).compile();

    shDetailAdapter = module.get<ShDetailAdapter>(ShDetailAdapter);
  });

  test('첨부 파일명과 미리보기 URL 을 뽑는다', () => {
    const attachments = shDetailAdapter.parseAttachments(fixtureHtml);

    expect(attachments).toHaveLength(2);
    expect(attachments[0].fileName).toBe('2026년 2차 행복주택 공고문(2026_08_28_ 공고).pdf');
    expect(attachments[0].fileSeq).toBe(1);
    expect(attachments[0].previewUrl).toBe('https://example-sh.invalid/converter/path.do?brd_id=BOARD&seq=309337&data_tp=A&file_seq=1');
    expect(attachments[1].fileName).toBe('위임장(행복주택).pdf');
    expect(attachments[1].fileSeq).toBe(2);
  });

  test('PDF 여부를 구분한다', () => {
    const attachments = shDetailAdapter.parseAttachments(fixtureHtml);

    expect(attachments.every((attachment) => attachment.isPdf())).toBe(true);
  });

  test('미리보기 리다이렉트에서 원본 PDF URL 을 도출한다', () => {
    // 실제 응답 Location (2026-09-22 확인)
    const location = '/viewer/doc.html?fn=20260827040630433_383f392fa9a541b797eea0079bfe1168&rs=/upload/path/2026/08/html/';

    const fileUrl = shDetailAdapter.deriveFileUrl(location, '2026년 2차 행복주택 공고문.pdf');

    expect(fileUrl).toBe('https://example-sh.invalid/upload/path/2026/08/20260827040630433_383f392fa9a541b797eea0079bfe1168.pdf');
  });

  test('파일 확장자를 원본 URL 에 반영한다 (hwp 등)', () => {
    const location = '/viewer/doc.html?fn=abc123&rs=/upload/path/2026/08/html/';

    expect(shDetailAdapter.deriveFileUrl(location, '신청서.hwp')).toBe('https://example-sh.invalid/upload/path/2026/08/abc123.hwp');
  });

  test('Location 에 fn/rs 가 없으면 null (미리보기로 대체된다)', () => {
    expect(shDetailAdapter.deriveFileUrl('/viewer/doc.html', '공고문.pdf')).toBeNull();
  });

  test('첨부가 없는 상세 페이지면 빈 배열', () => {
    expect(shDetailAdapter.parseAttachments('<html><body>본문만 있음</body></html>')).toEqual([]);
  });
});
