import { NoticeEntity } from '../../notice/domain/notice.entity.js';
import { UserProfileEntity } from '../../profile/domain/user-profile.entity.js';
import type { UserProfileSchema } from '../../profile/domain/profile.types.js';
import { EligibilityEngine } from '../eligibility.engine.js';
import { happyHouseCriteria } from './criteria-fixture.js';

const buildNotice = () =>
  NoticeEntity.create({
    sourceId: 'SH_PORTAL',
    externalId: '309337',
    supplyType: 'HAPPY_HOUSE',
    status: 'OPEN',
    title: '2026년 2차 행복주택',
  });

const buildProfile = (overrides: Partial<Omit<UserProfileSchema, 'profileId'>> = {}) =>
  UserProfileEntity.create({
    category: 'YOUTH',
    householdSize: 1,
    monthlyIncome: 3_000_000,
    totalAssets: 100_000_000,
    carValue: 10_000_000,
    isHomeless: true,
    age: 29,
    maritalStatus: 'SINGLE',
    isDualIncome: false,
    childrenBirthDates: [],
    residence: { province: '서울특별시', district: '관악구' },
    districtMovedInAt: null,
    incomeSourceLocation: null,
    universityLocation: null,
    housingSubscriptionPayments: 45,
    ...overrides,
  });

describe('EligibilityEngine', () => {
  const engine = new EligibilityEngine(happyHouseCriteria);
  const codes = (result: { reasons: { code: string }[] }) => result.reasons.map((r) => r.code);

  test('모든 기준을 통과하면 LIKELY_ELIGIBLE', () => {
    const result = engine.judge(buildProfile(), buildNotice());

    expect(result.verdict).toBe('LIKELY_ELIGIBLE');
    expect(codes(result)).toContain('INCOME_WITHIN_LIMIT');
  });

  test('판정 결과에 출처(ruleset)와 사유가 담긴다', () => {
    const result = engine.judge(buildProfile(), buildNotice());

    expect(result.ruleset).toBe('notice:SH_PORTAL:309337');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test('공고문 금액표에서 가구원수에 맞는 상한을 찾는다', () => {
    // 4인 가구 100% = 8,802,202원
    const within = engine.judge(buildProfile({ householdSize: 4, monthlyIncome: 8_000_000 }), buildNotice());
    const over = engine.judge(buildProfile({ householdSize: 4, monthlyIncome: 9_583_000 }), buildNotice());

    expect(within.verdict).toBe('LIKELY_ELIGIBLE');
    expect(over.verdict).toBe('NOT_ELIGIBLE');
    expect(codes(over)).toContain('INCOME_OVER_LIMIT');
  });

  test('상한을 5% 넘게 초과하면 NOT_ELIGIBLE', () => {
    // 1인 상한 4,576,036 × 1.05 = 4,804,838
    const result = engine.judge(buildProfile({ monthlyIncome: 5_000_000 }), buildNotice());

    expect(result.verdict).toBe('NOT_ELIGIBLE');
  });

  test('경계(±5%) 안이면 초과해도 NEEDS_REVIEW — 실제 사례 7,297원', () => {
    const result = engine.judge(buildProfile({ monthlyIncome: 4_583_333 }), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('BORDERLINE');
  });

  test('경계 아래쪽(상한 직전)도 NEEDS_REVIEW', () => {
    const result = engine.judge(buildProfile({ monthlyIncome: 4_500_000 }), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('BORDERLINE');
  });

  test('경계에 있어도 확정 미달 사유가 있으면 NOT_ELIGIBLE 이 우선한다', () => {
    const result = engine.judge(buildProfile({ monthlyIncome: 4_583_333, totalAssets: 300_000_000 }), buildNotice());

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(codes(result)).toContain('ASSETS_OVER_LIMIT');
  });

  test('무주택이 아니면 다른 기준을 보지 않고 NOT_ELIGIBLE', () => {
    const result = engine.judge(buildProfile({ isHomeless: false }), buildNotice());

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0].code).toBe('NOT_HOMELESS');
  });

  test('계층 나이 범위를 벗어나면 NOT_ELIGIBLE', () => {
    const result = engine.judge(buildProfile({ age: 45 }), buildNotice());

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(codes(result)).toContain('AGE_OUT_OF_RANGE');
  });

  test('총자산 미입력(null)은 0 이 아니라 NEEDS_REVIEW', () => {
    const result = engine.judge(buildProfile({ totalAssets: null }), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('MISSING_PROFILE_DATA');
  });

  test('프로필 계층에 맞는 기준을 고른다 (대학생은 자산 상한이 낮다)', () => {
    const asStudent = engine.judge(buildProfile({ category: 'UNIVERSITY_STUDENT', totalAssets: 150_000_000 }), buildNotice());
    const asYouth = engine.judge(buildProfile({ category: 'YOUTH', totalAssets: 150_000_000 }), buildNotice());

    expect(asStudent.verdict).toBe('NOT_ELIGIBLE'); // 대학생 상한 1억 800만
    expect(asYouth.verdict).toBe('LIKELY_ELIGIBLE'); // 청년 상한 2억 5,100만
  });

  test('계층 라벨을 직접 지정할 수 있다', () => {
    const result = engine.judge(buildProfile({ totalAssets: 150_000_000 }), buildNotice(), '대학생');

    expect(result.verdict).toBe('NOT_ELIGIBLE');
  });

  test('해당 계층 기준이 공고문에 없으면 NEEDS_REVIEW', () => {
    const result = engine.judge(buildProfile({ category: 'SENIOR' }), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('NO_RULE_DATA');
  });

  test('금액표에 없는 가구원수는 추정하지 않고 NEEDS_REVIEW', () => {
    const result = engine.judge(buildProfile({ householdSize: 7 }), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('NO_RULE_DATA');
  });

  test('추출이 불확실한 공고는 통과시키지 않는다', () => {
    const uncertain = new EligibilityEngine({ ...happyHouseCriteria, uncertainNotes: ['소득 기준을 찾지 못함'] });
    const result = uncertain.judge(buildProfile(), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
  });

  test('공고문의 수동 확인 사항을 사유에 그대로 전달한다', () => {
    const result = engine.judge(buildProfile(), buildNotice());

    expect(codes(result)).toContain('MANUAL_CHECK_REQUIRED');
  });
});
