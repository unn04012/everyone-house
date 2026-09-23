import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { SourceConfigService } from '../../config/source/source-config.service.js';
import { HttpClient } from '../../http/http-client.js';
import { GhApplyAdapter } from '../gh-apply.adapter.js';

/** 테스트용 엔드포인트 스텁. 실제 URL 은 .env 로 주입되며 저장소에 두지 않는다. */
class SourceConfigStub {
  public readonly shListUrl = 'https://example-portal.invalid/list';
  public readonly shBaseUrl = 'https://example-sh.invalid';
  public readonly shDetailUrlPrefix = 'https://example-sh.invalid/detail?seq=';
  public readonly myhomeApiUrl = 'https://example-api.invalid/notices';
  public readonly myhomeDetailUrlPrefix = 'https://example-myhome.invalid/detail.do?pblancId=';
  public readonly myhomeDownloadUrl = 'https://example-myhome.invalid/download.do';
  public readonly ghListUrl = 'https://example-gh.invalid/list.do';
  public readonly ghDetailUrl = 'https://example-gh.invalid/detail.do';
}

describe('GhApplyAdapter', () => {
  let ghApplyAdapter: GhApplyAdapter;
  let listHtml: string;
  let detailHtml: string;

  beforeAll(async () => {
    listHtml = await readFile(join(import.meta.dirname, 'gh-list.fixture.html'), 'utf8');
    detailHtml = await readFile(join(import.meta.dirname, 'gh-detail.fixture.html'), 'utf8');

    const module: TestingModule = await Test.createTestingModule({
      providers: [GhApplyAdapter, HttpClient, { provide: SourceConfigService, useClass: SourceConfigStub }],
    }).compile();

    ghApplyAdapter = module.get<GhApplyAdapter>(GhApplyAdapter);
  });

  test('목록 10건을 파싱한다', () => {
    expect(ghApplyAdapter.parseList(listHtml)).toHaveLength(10);
  });

  test('data-pbancNo 를 externalId 로 쓴다', () => {
    const notices = ghApplyAdapter.parseList(listHtml);

    expect(notices[0].externalId).toBe('811');
    expect(notices[1].externalId).toBe('808');
  });

  test('유형을 공급 유형으로 정규화한다', () => {
    const bySupplyType = new Map(ghApplyAdapter.parseList(listHtml).map((notice) => [notice.externalId, notice.supplyType]));

    expect(bySupplyType.get('811')).toBe('HAPPY_HOUSE');
    expect(bySupplyType.get('808')).toBe('LONG_TERM_JEONSE');
    expect(bySupplyType.get('801')).toBe('NATIONAL_RENTAL');
    expect(bySupplyType.get('793')).toBe('INTEGRATED_PUBLIC');
  });

  test('상태를 정규화하고, 빈 칸은 UNKNOWN 으로 둔다', () => {
    const byStatus = new Map(ghApplyAdapter.parseList(listHtml).map((notice) => [notice.externalId, notice.status]));

    expect(byStatus.get('808')).toBe('CLOSED'); // 접수마감
    expect(byStatus.get('811')).toBe('UNKNOWN'); // 상태 칸이 '-'
  });

  test('게시일·마감일을 파싱한다 (마감일이 없는 행도 있다)', () => {
    const byId = new Map(ghApplyAdapter.parseList(listHtml).map((notice) => [notice.externalId, notice]));

    expect(byId.get('808')!.postedAt).toEqual(new Date('2026-08-13T00:00:00Z'));
    expect(byId.get('808')!.closesAt).toEqual(new Date('2026-08-24T00:00:00Z'));
    expect(byId.get('811')!.closesAt).toBeNull();
  });

  test('지역을 경기도 기준으로 정규화한다', () => {
    const [first] = ghApplyAdapter.parseList(listHtml);

    expect(first.region).toBe('경기도 연천군');
    expect(first.sourceId).toBe('GH_APPLY');
  });

  test('상세에서 공고문 첨부를 GET URL 로 뽑는다', () => {
    const attachments = ghApplyAdapter.parseAttachments(detailHtml);

    expect(attachments.length).toBeGreaterThan(0);
    expect(attachments[0].fileUrl).toContain('selectFileDown.do');
    expect(attachments[0].downloadRef).toBeNull(); // GET 이라 POST 파라미터가 필요 없다
  });

  test('파일명에서 바이트 표기를 떼어낸다', () => {
    const [first] = ghApplyAdapter.parseAttachments(detailHtml);

    expect(first.fileName).not.toMatch(/Byte\)/);
    expect(first.fileName).toMatch(/\.(pdf|hwp)$/i);
  });

  test('PDF 첨부를 구분한다', () => {
    const attachments = ghApplyAdapter.parseAttachments(detailHtml);

    expect(attachments.some((attachment) => attachment.isPdf())).toBe(true);
  });

  test('테이블이 없는 HTML 이면 빈 배열', () => {
    expect(ghApplyAdapter.parseList('<html><body>점검 중</body></html>')).toEqual([]);
    expect(ghApplyAdapter.parseAttachments('<html><body>없음</body></html>')).toEqual([]);
  });
});
