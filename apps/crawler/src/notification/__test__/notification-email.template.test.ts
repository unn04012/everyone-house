import { VerdictEnum } from '@everyone-house/domain';
import { NotificationEmailTemplate } from '../notification-email.template.js';
import type { NotificationDigest } from '../notification.types.js';

describe('NotificationEmailTemplate', () => {
  const template = new NotificationEmailTemplate();

  const digest = (overrides: Partial<NotificationDigest> = {}): NotificationDigest => ({
    profileSummary: '청년 · 2인 세대 · 서울 강서구',
    items: [
      {
        noticeId: 'n-2',
        title: '2026년 2차 청년 매입임대주택 입주자 모집 (서울)',
        agencyLabel: 'LH',
        verdict: VerdictEnum.NEEDS_REVIEW,
        reasonLine: '소득이 기준에 아주 가까워요 (기준의 97%) 외 1건',
        deadlineLabel: '마감 D-9',
      },
      {
        noticeId: 'n-1',
        title: '행복주택 청년 계층 입주자 모집 (강서)',
        agencyLabel: 'SH',
        verdict: VerdictEnum.LIKELY_ELIGIBLE,
        reasonLine: '소득·무주택·지역 요건을 모두 충족해 보여요',
        deadlineLabel: '마감 D-5',
      },
    ],
    fixableCount: 1,
    fixableFieldLabel: '총자산',
    rulesetYear: 2026,
    baseUrl: 'https://example.com/',
    unsubscribeUrl: 'https://example.com/unsubscribe?t=abc',
    ...overrides,
  });

  test('메일 클라이언트가 못 읽는 CSS 를 쓰지 않는다', () => {
    const html = template.render(digest());

    expect(html).not.toContain('var(--');
    expect(html).not.toContain('display:flex');
    expect(html).not.toContain('display:grid');
    expect(html).not.toContain('<link');
    expect(html).not.toContain('<style');
  });

  test('공고마다 판정 라벨과 사유 첫 줄을 함께 싣는다 — 뱃지만 있는 알림은 없다', () => {
    const html = template.render(digest());

    expect(html).toContain('확인이 필요해요');
    expect(html).toContain('소득이 기준에 아주 가까워요 (기준의 97%) 외 1건');
    expect(html).toContain('신청 가능해 보여요');
  });

  test('공고 링크는 상세로 가고 메일 유입 표시를 붙인다', () => {
    const html = template.render(digest());

    expect(html).toContain('https://example.com/notices/n-2?from=email');
  });

  test('집계 유도는 채울 항목이 있을 때만 넣는다', () => {
    expect(template.render(digest())).toContain('총자산만 알려주시면 확인 필요 1건이 확정돼요');
    expect(template.render(digest({ fixableFieldLabel: null, fixableCount: 0 }))).not.toContain('프로필 채우기');
  });

  test('판정 건수를 제목·미리보기에 노출한다', () => {
    expect(template.subject(digest())).toBe('[공공임대 알리미] 새 공고 2건');
    expect(template.preheader(digest())).toBe('신청 가능 1 · 확인 필요 1 — 총자산만 알려주시면 1건이 확정돼요.');
  });

  test('크롤링한 제목은 이스케이프한다', () => {
    const html = template.render(
      digest({
        items: [
          {
            noticeId: 'x',
            title: '<script>alert(1)</script> 모집',
            agencyLabel: 'LH',
            verdict: VerdictEnum.NEEDS_REVIEW,
            reasonLine: '확인이 필요해요',
            deadlineLabel: null,
          },
        ],
      }),
    );

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('수신 해지 링크는 항상 있다', () => {
    expect(template.render(digest())).toContain('https://example.com/unsubscribe?t=abc');
  });
});
