import type { NoticeCriteria, RankRule } from '../../criteria/criteria.types.js';
import { UserProfileEntity } from '../../profile/domain/user-profile.entity.js';
import type { UserProfileSchema } from '../../profile/domain/profile.types.js';
import { RankingEngine } from '../ranking.engine.js';

const buildRule = (overrides: Partial<RankRule> = {}): RankRule => ({
  rank: 1,
  appliesTo: null,
  basis: 'RESIDENCE',
  condition: '테스트 조건',
  regions: [],
  requiredSubscriptionPayments: null,
  isPrioritySupply: false,
  ...overrides,
});

const buildCriteria = (ranks: RankRule[]): NoticeCriteria => ({
  applicationStartDate: null,
  applicationEndDate: null,
  announcementDate: null,
  categories: [],
  ranks,
  incomeTable: [],
  supplyTablePages: [],
  manualCheckNotes: [],
  uncertainNotes: [],
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

describe('RankingEngine', () => {
  describe('거주지 기준', () => {
    // 행복주택 일반공급: 1순위 서울+연접, 2순위 그 밖의 수도권, 3순위 나머지
    const criteria = buildCriteria([
      buildRule({ rank: 1, regions: ['서울특별시', '성남시', '고양시'] }),
      buildRule({ rank: 2, regions: ['수원시', '용인시'] }),
      buildRule({ rank: 3, regions: [], condition: '1·2순위에 해당하지 않는 자' }),
    ]);
    const engine = new RankingEngine(criteria);

    test('거주지가 1순위 지역이면 1순위', () => {
      const result = engine.evaluate(buildProfile());

      expect(result.bestRank).toBe(1);
      expect(result.evaluations[0].outcome).toBe('MATCHED');
    });

    test('거주지가 2순위 지역이면 2순위', () => {
      const result = engine.evaluate(buildProfile({ residence: { province: '경기도', district: '수원시' } }));

      expect(result.bestRank).toBe(2);
    });

    test('어느 목록에도 없으면 순위 없음', () => {
      const result = engine.evaluate(buildProfile({ residence: { province: '부산광역시', district: '해운대구' } }));

      expect(result.bestRank).toBeNull();
    });

    test('소득근거지(직장)로도 순위를 맞춘다', () => {
      const result = engine.evaluate(
        buildProfile({
          residence: { province: '부산광역시', district: '해운대구' },
          incomeSourceLocation: { province: '서울특별시', district: '강남구' },
        }),
      );

      expect(result.bestRank).toBe(1);
    });

    test('대학생 계층은 대학 소재지로도 맞춘다', () => {
      const result = engine.evaluate(
        buildProfile({
          category: 'UNIVERSITY_STUDENT',
          residence: { province: '부산광역시', district: '해운대구' },
          universityLocation: { province: '서울특별시', district: '관악구' },
        }),
      );

      expect(result.bestRank).toBe(1);
    });

    test('지역 목록이 비어 있는 순위는 판단하지 않는다', () => {
      const result = engine.evaluate(buildProfile());

      expect(result.evaluations[2].outcome).toBe('UNKNOWN');
      expect(result.hasUnknown).toBe(true);
    });
  });

  describe('청약저축 기준', () => {
    // 국민임대 59㎡: 1순위 24회, 2순위 6회
    const engine = new RankingEngine(
      buildCriteria([
        buildRule({ rank: 1, basis: 'SUBSCRIPTION', requiredSubscriptionPayments: 24, appliesTo: '전용 50㎡ 이상' }),
        buildRule({ rank: 2, basis: 'SUBSCRIPTION', requiredSubscriptionPayments: 6, appliesTo: '전용 50㎡ 이상' }),
      ]),
    );

    test('45회면 24회 요건을 충족해 1순위', () => {
      const result = engine.evaluate(buildProfile({ housingSubscriptionPayments: 45 }));

      expect(result.bestRank).toBe(1);
      expect(result.evaluations[0].message).toContain('45회');
    });

    test('10회면 1순위는 미달, 2순위는 충족', () => {
      const result = engine.evaluate(buildProfile({ housingSubscriptionPayments: 10 }));

      expect(result.bestRank).toBe(2);
      expect(result.evaluations[0].outcome).toBe('NOT_MATCHED');
    });

    test('미가입(0회)이면 순위 없음', () => {
      const result = engine.evaluate(buildProfile({ housingSubscriptionPayments: 0 }));

      expect(result.bestRank).toBeNull();
    });
  });

  test('우선공급과 일반공급 순위를 따로 집계한다', () => {
    const engine = new RankingEngine(
      buildCriteria([
        buildRule({ rank: 1, regions: ['서울특별시 강남구'], isPrioritySupply: true }),
        buildRule({ rank: 2, regions: ['서울특별시'], isPrioritySupply: true }),
        buildRule({ rank: 1, regions: ['서울특별시'], isPrioritySupply: false }),
      ]),
    );

    const result = engine.evaluate(buildProfile());

    expect(result.bestPriorityRank).toBe(2); // 관악구라 자치구(강남구) 1순위는 미해당
    expect(result.bestRank).toBe(1);
  });

  test('appliesTo 는 부분일치로 거른다 (공고문 표기가 제각각이다)', () => {
    const engine = new RankingEngine(
      buildCriteria([
        buildRule({ rank: 1, regions: ['서울특별시'], appliesTo: '청년 계층 일반공급' }),
        buildRule({ rank: 1, regions: ['부산광역시'], appliesTo: '대학생 계층 일반공급' }),
      ]),
    );

    const result = engine.evaluate(buildProfile(), '청년');

    expect(result.evaluations).toHaveLength(1);
    expect(result.bestRank).toBe(1);
  });

  test('면적대로 순위가 갈리면 해당 구분만 평가한다', () => {
    const engine = new RankingEngine(
      buildCriteria([
        buildRule({ rank: 1, basis: 'RESIDENCE', regions: ['서울특별시'], appliesTo: '전용 50㎡ 미만' }),
        buildRule({ rank: 1, basis: 'SUBSCRIPTION', requiredSubscriptionPayments: 24, appliesTo: '전용 50㎡ 이상' }),
      ]),
    );

    const small = engine.evaluate(buildProfile({ housingSubscriptionPayments: 0 }), '전용 50㎡ 미만');
    const large = engine.evaluate(buildProfile({ housingSubscriptionPayments: 0 }), '전용 50㎡ 이상');

    expect(small.bestRank).toBe(1); // 거주지 기준이라 청약 0회여도 1순위
    expect(large.bestRank).toBeNull(); // 청약 기준이라 미달
  });

  test('자치구를 모르면 자치구 단위 순위는 UNKNOWN', () => {
    const engine = new RankingEngine(buildCriteria([buildRule({ rank: 1, regions: ['서울특별시 강남구'] })]));
    const result = engine.evaluate(buildProfile({ residence: { province: '서울특별시', district: null } }));

    expect(result.evaluations[0].outcome).toBe('UNKNOWN');
    expect(result.evaluations[0].message).toContain('자치구');
  });

  test('소득·기타 축은 자동 판정하지 않는다', () => {
    const engine = new RankingEngine(buildCriteria([buildRule({ rank: 1, basis: 'INCOME', condition: '수급자 가구' })]));
    const result = engine.evaluate(buildProfile());

    expect(result.evaluations[0].outcome).toBe('UNKNOWN');
    expect(result.bestRank).toBeNull();
  });

  test('복합 축(MIXED)은 둘 다 충족해야 한다', () => {
    const engine = new RankingEngine(
      buildCriteria([buildRule({ rank: 1, basis: 'MIXED', regions: ['서울특별시'], requiredSubscriptionPayments: 24 })]),
    );

    expect(engine.evaluate(buildProfile({ housingSubscriptionPayments: 45 })).bestRank).toBe(1);
    expect(engine.evaluate(buildProfile({ housingSubscriptionPayments: 3 })).bestRank).toBeNull();
  });
});
