import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { SourceConfigService } from '../../config/source/source-config.service.js';
import { HttpClient } from '../../http/http-client.js';
import { ShDetailAdapter } from '../sh-detail.adapter.js';
import { ShPortalAdapter } from '../sh-portal.adapter.js';

/**
 * 파싱은 저장된 실제 HTML 로 검증한다 (네트워크 없음).
 * fixture 는 2026-09-21 목록 페이지에서 채취했으며 도메인·경로는 익명화되어 있다.
 */
/** 테스트용 엔드포인트 스텁. 실제 URL 은 .env 로 주입되며 저장소에 두지 않는다. */
class SourceConfigStub {
  public readonly shListUrl = 'https://example-portal.invalid/list/path/list';
  public readonly shBaseUrl = 'https://example-sh.invalid';
  public readonly shDetailUrlPrefix = 'https://example-sh.invalid/detail/path/view.do?seq=';
  public readonly myhomeApiUrl = 'https://example-api.invalid/notices';
  public readonly myhomeDetailUrlPrefix = 'https://example-myhome.invalid/detail.do?pblancId=';
  public readonly myhomeDownloadUrl = 'https://example-myhome.invalid/download.do';
}

describe('ShPortalAdapter', () => {
  let shPortalAdapter: ShPortalAdapter;
  let fixtureHtml: string;

  beforeAll(async () => {
    fixtureHtml = await readFile(join(import.meta.dirname, 'sh-list.fixture.html'), 'utf8');

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShPortalAdapter, ShDetailAdapter, HttpClient, { provide: SourceConfigService, useClass: SourceConfigStub }],
    }).compile();

    shPortalAdapter = module.get<ShPortalAdapter>(ShPortalAdapter);
  });

  test('목록 10건을 모두 파싱한다', () => {
    expect(shPortalAdapter.parseList(fixtureHtml)).toHaveLength(10);
  });

  test('상세 링크의 seq 를 externalId 로 쓴다', () => {
    const notices = shPortalAdapter.parseList(fixtureHtml);

    // 공고명 칸에 주석 처리된 앵커(seq=행번호)가 있어 행 전체에서 찾으면 1, 3, 4... 가 잡힌다.
    expect(notices[0].externalId).toBe('310258');
    expect(notices[1].externalId).toBe('310041');
    expect(notices.map((notice) => notice.externalId)).not.toContain('1');
  });

  test('청약유형을 공급 유형으로 정규화한다', () => {
    const notices = shPortalAdapter.parseList(fixtureHtml);
    const bySupplyType = new Map(notices.map((notice) => [notice.externalId, notice.supplyType]));

    expect(bySupplyType.get('309337')).toBe('HAPPY_HOUSE'); // 행복주택
    expect(bySupplyType.get('309467')).toBe('LONG_TERM_JEONSE'); // 장기전세주택
    expect(bySupplyType.get('308340')).toBe('NATIONAL_RENTAL'); // 국민공공임대주택
    expect(bySupplyType.get('310258')).toBe('OTHER'); // 희망하우징
  });

  test('모집상태를 정규화하고, 빈 칸은 UNKNOWN 으로 둔다', () => {
    const notices = shPortalAdapter.parseList(fixtureHtml);
    const byStatus = new Map(notices.map((notice) => [notice.externalId, notice.status]));

    expect(byStatus.get('310258')).toBe('OPEN'); // 모집중
    expect(byStatus.get('308446')).toBe('CLOSED'); // 모집마감
    expect(byStatus.get('310041')).toBe('UNKNOWN'); // 상태 칸이 비어 있는 행이 실제로 있다
  });

  test('게시일을 파싱하고, 원본을 rawJson 에 보존한다', () => {
    const [first] = shPortalAdapter.parseList(fixtureHtml);

    expect(first.postedAt).toEqual(new Date('2026-09-17T00:00:00Z'));
    expect(first.title).toContain('희망하우징');
    expect(first.detailUrl).toContain('/detail/path/');
    expect(first.rawJson).toMatchObject({ supplyTypeLabel: '희망하우징', statusLabel: '모집중' });
  });

  test('모든 공고가 SH_PORTAL 소스로 표시된다', () => {
    const notices = shPortalAdapter.parseList(fixtureHtml);

    expect(notices.every((notice) => notice.sourceId === 'SH_PORTAL')).toBe(true);
    expect(notices.every((notice) => notice.region === '서울특별시')).toBe(true);
  });

  test('테이블이 없는 HTML 이면 빈 배열', () => {
    expect(shPortalAdapter.parseList('<html><body>점검 중입니다</body></html>')).toEqual([]);
  });
});
