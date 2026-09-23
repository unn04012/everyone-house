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
    personalIncome: 3_000_000,
    personalAssets: 100_000_000,
    householdSize: 1,
    householdIncome: 3_000_000,
    householdAssets: 100_000_000,
    parentsIncome: null,
    parentsAssets: null,
    parentsCount: 2,
    livesWithParents: false,
    carValue: 10_000_000,
    isHomeless: true,
    age: 29,
    maritalStatus: 'SINGLE',
    isDualIncome: false,
    childrenBirthDates: [],
    isBasicLivingBeneficiary: false,
    isSecondLowestIncome: false,
    isSupportedSingleParent: false,
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

  test('범위에 따라 다른 소득과 다른 가구원수 기준을 쓴다', () => {
    // 같은 사람: 본인 458만 / 세대합산 958만, 4인 가구
    const profile = buildProfile({
      personalIncome: 4_583_333,
      householdIncome: 9_583_333,
      householdSize: 4,
      householdAssets: 100_000_000,
    });

    // 청년(SELF) → 1인 기준 4,576,036 과 비교 → 7,297원 초과로 경계
    const asSelf = engine.judge(profile, buildNotice(), '청년');
    // 세대 전원(HOUSEHOLD) → 4인 기준 8,802,202 과 비교 → 명확히 초과
    const asHousehold = new EligibilityEngine({
      ...happyHouseCriteria,
      categories: [{ ...happyHouseCriteria.categories[0], applicantScope: 'HOUSEHOLD' }],
    }).judge(profile, buildNotice(), '청년');

    expect(asSelf.verdict).toBe('NEEDS_REVIEW');
    expect(asHousehold.verdict).toBe('NOT_ELIGIBLE');
    expect(codes(asHousehold)).toContain('INCOME_OVER_LIMIT');
  });

  test('세대주 여부로 범위가 갈리는 공고 (SELF_IF_NOT_HOUSEHOLDER)', () => {
    const criteria = {
      ...happyHouseCriteria,
      categories: [{ ...happyHouseCriteria.categories[0], applicantScope: 'SELF_IF_NOT_HOUSEHOLDER' as const }],
    };
    const engineByHouseholder = new EligibilityEngine(criteria);
    const finances = { personalIncome: 4_000_000, householdIncome: 9_583_333, householdSize: 4, householdAssets: 100_000_000 };

    const asMember = engineByHouseholder.judge(buildProfile({ ...finances, livesWithParents: true }), buildNotice());
    const asHouseholder = engineByHouseholder.judge(buildProfile({ ...finances, livesWithParents: false }), buildNotice());

    expect(asMember.verdict).toBe('LIKELY_ELIGIBLE'); // 본인 400만 < 1인 기준 457만
    expect(asHouseholder.verdict).toBe('NOT_ELIGIBLE'); // 세대 958만 > 4인 기준 880만
  });

  test('본인+부모 범위인데 부모 소득을 모르면 NEEDS_REVIEW', () => {
    const result = engine.judge(buildProfile({ parentsIncome: null }), buildNotice(), '대학생');

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('MISSING_PROFILE_DATA');
  });

  test('상한을 5% 넘게 초과하면 NOT_ELIGIBLE', () => {
    // 1인 상한 4,576,036 × 1.05 = 4,804,838
    const result = engine.judge(buildProfile({ personalIncome: 5_000_000 }), buildNotice());

    expect(result.verdict).toBe('NOT_ELIGIBLE');
  });

  test('경계(±5%) 안이면 초과해도 NEEDS_REVIEW — 실제 사례 7,297원', () => {
    const result = engine.judge(buildProfile({ personalIncome: 4_583_333 }), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('BORDERLINE');
  });

  test('경계 아래쪽(상한 직전)도 NEEDS_REVIEW', () => {
    const result = engine.judge(buildProfile({ personalIncome: 4_500_000 }), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('BORDERLINE');
  });

  test('경계에 있어도 확정 미달 사유가 있으면 NOT_ELIGIBLE 이 우선한다', () => {
    const result = engine.judge(buildProfile({ personalIncome: 4_583_333, personalAssets: 300_000_000 }), buildNotice());

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(codes(result)).toContain('ASSETS_OVER_LIMIT');
  });

  test('수급자 전용 계층은 해당자가 아니면 NOT_ELIGIBLE', () => {
    // 이 계층은 소득·자산 기준이 따로 없어, 걸러내지 않으면 통과처럼 보인다.
    const criteria = {
      ...happyHouseCriteria,
      categories: [{ ...happyHouseCriteria.categories[0], categoryLabel: '청년 1순위 (수급자 가구·차상위계층)', requiresSupportStatus: true }],
    };
    const result = new EligibilityEngine(criteria).judge(buildProfile(), buildNotice());

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(codes(result)).toContain('NOT_SUPPORT_TARGET');
  });

  test('수급자면 그 계층으로 판정이 진행된다', () => {
    const criteria = {
      ...happyHouseCriteria,
      categories: [{ ...happyHouseCriteria.categories[0], requiresSupportStatus: true }],
    };
    const result = new EligibilityEngine(criteria).judge(buildProfile({ isBasicLivingBeneficiary: true }), buildNotice());

    expect(result.verdict).toBe('LIKELY_ELIGIBLE');
  });

  test('추출본에 값이 없으면 계층명에서 추론한다 (구 데이터 호환)', () => {
    const criteria = {
      ...happyHouseCriteria,
      categories: [{ ...happyHouseCriteria.categories[0], categoryLabel: '청년 1순위 (지원대상 한부모가족)' }],
    };
    const result = new EligibilityEngine(criteria).judge(buildProfile(), buildNotice());

    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(codes(result)).toContain('NOT_SUPPORT_TARGET');
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
    const result = engine.judge(buildProfile({ personalAssets: null }), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('MISSING_PROFILE_DATA');
  });

  test('프로필 계층에 맞는 기준을 고른다 (대학생은 자산 상한이 낮다)', () => {
    const asStudent = engine.judge(buildProfile({ category: 'UNIVERSITY_STUDENT', personalAssets: 108_000_000, parentsIncome: 1_000_000, parentsAssets: 50_000_000 }), buildNotice());
    const asYouth = engine.judge(buildProfile({ category: 'YOUTH', personalAssets: 150_000_000 }), buildNotice());

    expect(asStudent.verdict).toBe('NOT_ELIGIBLE'); // 대학생 상한 1억 800만
    expect(asYouth.verdict).toBe('LIKELY_ELIGIBLE'); // 청년 상한 2억 5,100만
  });

  test('계층 라벨을 직접 지정할 수 있다', () => {
    const result = engine.judge(buildProfile({ personalAssets: 108_000_000, parentsIncome: 1_000_000, parentsAssets: 50_000_000 }), buildNotice(), '대학생');

    expect(result.verdict).toBe('NOT_ELIGIBLE');
  });

  test('해당 계층 기준이 공고문에 없으면 NEEDS_REVIEW', () => {
    const result = engine.judge(buildProfile({ category: 'SENIOR' }), buildNotice());

    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(codes(result)).toContain('NO_RULE_DATA');
  });

  test('금액표에 없는 가구원수는 추정하지 않고 NEEDS_REVIEW', () => {
    // 금액표는 5인까지만 있다. 대가구는 별도 가산 규칙이 붙어 임의 확장이 위험하다.
    const householdEngine = new EligibilityEngine({
      ...happyHouseCriteria,
      categories: [{ ...happyHouseCriteria.categories[0], applicantScope: 'HOUSEHOLD' }],
    });
    const result = householdEngine.judge(buildProfile({ householdSize: 7, householdIncome: 5_000_000, householdAssets: 100_000_000 }), buildNotice());

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
