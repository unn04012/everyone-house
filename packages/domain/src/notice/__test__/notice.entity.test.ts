import { NoticeEntity } from '../domain/notice.entity.js';

const build = (externalId: string) =>
  NoticeEntity.create({
    sourceId: 'SH_PORTAL',
    externalId,
    supplyType: 'HAPPY_HOUSE',
    status: 'OPEN',
    title: '테스트 공고',
  });

const buildWith = (overrides: { status?: 'OPEN' | 'CLOSED' | 'UNKNOWN'; closesAt?: Date | null }) =>
  NoticeEntity.create({
    sourceId: 'GH_APPLY',
    externalId: '811',
    supplyType: 'HAPPY_HOUSE',
    status: overrides.status ?? 'OPEN',
    title: '테스트 공고',
    closesAt: overrides.closesAt ?? null,
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

describe('NoticeEntity.isStillApplicable', () => {
  const today = new Date('2026-09-23T00:00:00Z');

  test('마감일이 지났으면 신청 불가', () => {
    expect(buildWith({ closesAt: new Date('2026-09-22T00:00:00Z') }).isStillApplicable(today)).toBe(false);
  });

  test('마감일이 남았으면 신청 가능', () => {
    expect(buildWith({ closesAt: new Date('2026-09-30T00:00:00Z') }).isStillApplicable(today)).toBe(true);
  });

  test('마감 당일은 아직 신청 가능', () => {
    expect(buildWith({ closesAt: today }).isStillApplicable(today)).toBe(true);
  });

  test('상태가 CLOSED 면 마감일과 무관하게 불가', () => {
    expect(buildWith({ status: 'CLOSED', closesAt: new Date('2026-12-31T00:00:00Z') }).isStillApplicable(today)).toBe(false);
  });

  test('마감일을 모르면 신청 가능으로 본다 (SH 목록에는 마감일이 없다)', () => {
    // 유효한 공고를 버리는 쪽이 더 나쁘다.
    expect(buildWith({ status: 'UNKNOWN', closesAt: null }).isStillApplicable(today)).toBe(true);
  });

  test('모집예정(아직 시작 전)도 신청 가능으로 본다', () => {
    expect(buildWith({ status: 'UNKNOWN', closesAt: new Date('2026-10-15T00:00:00Z') }).isStillApplicable(today)).toBe(true);
  });
});

