import { NoticeEntity } from '../domain/notice.entity.js';

const build = (externalId: string) =>
  NoticeEntity.create({
    sourceId: 'SH_PORTAL',
    externalId,
    supplyType: 'HAPPY_HOUSE',
    status: 'OPEN',
    title: '테스트 공고',
  });

describe('NoticeEntity', () => {
  test('같은 공고는 몇 번을 만들어도 같은 ID 를 갖는다', () => {
    // 랜덤 ID 면 재수집 때 upsert 가 PK 를 덮어써 notice_criteria·matches 가 고아가 된다.
    expect(build('309337').noticeId).toBe(build('309337').noticeId);
  });

  test('다른 공고는 다른 ID', () => {
    expect(build('309337').noticeId).not.toBe(build('309338').noticeId);
  });

  test('소스가 다르면 같은 번호라도 다른 ID', () => {
    const sh = build('811');
    const gh = NoticeEntity.create({
      sourceId: 'GH_APPLY',
      externalId: '811',
      supplyType: 'HAPPY_HOUSE',
      status: 'OPEN',
      title: '테스트 공고',
    });

    expect(sh.noticeId).not.toBe(gh.noticeId);
  });

  test('UUID 형식을 따른다 (DB uuid 컬럼에 저장된다)', () => {
    expect(build('309337').noticeId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
