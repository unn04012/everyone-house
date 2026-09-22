import { NoticeEntity } from '../../notice/domain/notice.entity.js';
import type { SupplyType } from '../../notice/domain/notice.types.js';
import { UserProfileEntity } from '../../profile/domain/user-profile.entity.js';
import { EligibilityEngine } from '../eligibility.engine.js';
import { EligibilityTable2026 } from '../tables/2026.js';
import { fixtureTable } from './eligibility-table-fixture.js';

const buildNotice = (supplyType: SupplyType) =>
  NoticeEntity.create({
    sourceId: 'SH_PORTAL',
    externalId: 'seq-1',
    supplyType,
    status: 'OPEN',
    title: '테스트 공고',
  });

const buildProfile = (overrides: Partial<Parameters<typeof UserProfileEntity.create>[0]> = {}) =>
  UserProfileEntity.create({
    category: 'YOUTH',
    householdSize: 1,
    monthlyIncome: 2_500_000,
    totalAssets: 100_000_000,
    carValue: 10_000_000,
    isHomeless: true,
    age: 30,
    maritalStatus: 'SINGLE',
    isDualIncome: false,
    childrenBirthDates: [],
    residence: { province: '서울특별시', district: '강남구' },
    districtMovedInAt: null,
    incomeSourceLocation: null,
    universityLocation: null,
    housingSubscriptionPayments: 0,
    ...overrides,
  });

describe('EligibilityEngine', () => {
  const engine = new EligibilityEngine(fixtureTable);

  test('모든 기준을 통과하면 LIKELY_ELIGIBLE', () => {
    const result = engine.judge(buildProfile(), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('LIKELY_ELIGIBLE');
    expect(result.ruleset).toBe('test.1');
    expect(result.reasons.map((r) => r.code)).toContain('INCOME_WITHIN_LIMIT');
  });

  test('판정 결과에 항상 ruleset 버전과 사유가 담긴다', () => {
    const result = engine.judge(buildProfile(), buildNotice('HAPPY_HOUSE'));

    expect(result.ruleset).toBe(fixtureTable.ruleset);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test('소득 상한과 정확히 같으면 초과가 아니다 (경계값)', () => {
    // 1인 가구 도시근로자 300만 × 100% = 300만
    const result = engine.judge(buildProfile({ monthlyIncome: 3_000_000 }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('LIKELY_ELIGIBLE');
  });

  test('소득이 1원이라도 넘으면 NOT_ELIGIBLE (경계값)', () => {
    const result = engine.judge(buildProfile({ monthlyIncome: 3_000_001 }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(result.reasons.map((r) => r.code)).toContain('INCOME_OVER_LIMIT');
  });

  test('소득 기준 체계가 유형별로 다르게 적용된다', () => {
    // 통합공공임대는 중위소득 기준: 1인 200만 × 150% = 300만
    const withinMedian = engine.judge(buildProfile({ monthlyIncome: 3_000_000 }), buildNotice('INTEGRATED_PUBLIC'));
    const overMedian = engine.judge(buildProfile({ monthlyIncome: 3_100_000 }), buildNotice('INTEGRATED_PUBLIC'));

    expect(withinMedian.verdict).toBe('LIKELY_ELIGIBLE');
    expect(overMedian.verdict).toBe('NOT_ELIGIBLE');
  });

  test('가구원수에 따라 소득 상한이 달라진다', () => {
    // 3인 가구 500만 × 100%
    const result = engine.judge(buildProfile({ householdSize: 3, monthlyIncome: 4_900_000 }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('LIKELY_ELIGIBLE');
  });

  test('총자산 초과는 NOT_ELIGIBLE', () => {
    const result = engine.judge(buildProfile({ totalAssets: 300_000_000 }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(result.reasons.map((r) => r.code)).toContain('ASSETS_OVER_LIMIT');
  });

  test('자동차가액 초과는 NOT_ELIGIBLE', () => {
    const result = engine.judge(buildProfile({ carValue: 40_000_000 }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(result.reasons.map((r) => r.code)).toContain('CAR_OVER_LIMIT');
  });

  test('무주택이 아니면 다른 기준을 보지 않고 NOT_ELIGIBLE', () => {
    const result = engine.judge(buildProfile({ isHomeless: false }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0].code).toBe('NOT_HOMELESS');
  });

  test('기준표에 유형 규칙이 없으면 NEEDS_REVIEW (미해당으로 단정하지 않는다)', () => {
    const result = engine.judge(buildProfile(), buildNotice('YOUTH_SAFE_HOUSE'));

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(result.reasons[0].code).toBe('NO_RULE_DATA');
  });

  test('가구원수 데이터가 없으면 NEEDS_REVIEW', () => {
    // fixture 의 도시근로자 표는 3인까지만 있다
    const result = engine.judge(buildProfile({ householdSize: 5 }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(result.reasons.map((r) => r.code)).toContain('NO_RULE_DATA');
  });

  test('자산 초과가 있으면 소득 데이터가 없어도 NOT_ELIGIBLE (확정 사유 우선)', () => {
    const result = engine.judge(buildProfile({ householdSize: 5, totalAssets: 300_000_000 }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NOT_ELIGIBLE');
  });

  test('총자산 미입력(null)은 0 이 아니라 NEEDS_REVIEW 로 간다', () => {
    const result = engine.judge(buildProfile({ totalAssets: null }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(result.reasons.map((r) => r.code)).toContain('MISSING_PROFILE_DATA');
  });

  test('자동차가액 미입력도 NEEDS_REVIEW', () => {
    const result = engine.judge(buildProfile({ carValue: null }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NEEDS_REVIEW');
  });

  test('미입력이 있어도 확정 미달 사유가 있으면 NOT_ELIGIBLE 이 우선한다', () => {
    const result = engine.judge(buildProfile({ totalAssets: null, monthlyIncome: 9_000_000 }), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NOT_ELIGIBLE');
  });

  test('비어 있는 2026 기준표로는 아무것도 확정하지 않는다', () => {
    const result = new EligibilityEngine(EligibilityTable2026.create()).judge(buildProfile(), buildNotice('HAPPY_HOUSE'));

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(result.reasons[0].code).toBe('NO_RULE_DATA');
  });
});
