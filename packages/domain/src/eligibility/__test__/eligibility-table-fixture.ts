import type { EligibilityTable } from '../eligibility.types.js';

/**
 * 테스트 전용 기준표. 실제 공식 수치가 아니라 경계 검증용으로 고른 값이다.
 * 실제 표는 tables/<year>.ts 에 들어간다.
 */
export const fixtureTable: EligibilityTable = {
  ruleset: 'test.1',
  year: 2026,
  urbanWorkerAverage: {
    1: 3_000_000,
    2: 4_000_000,
    3: 5_000_000,
  },
  medianIncome: {
    1: 2_000_000,
    2: 3_400_000,
  },
  rules: {
    HAPPY_HOUSE: {
      incomeBasis: 'URBAN_WORKER_AVERAGE',
      incomePercent: 100,
      totalAssetsLimit: 273_000_000,
      carValueLimit: 37_080_000,
      requiresHomeless: true,
    },
    INTEGRATED_PUBLIC: {
      incomeBasis: 'MEDIAN_INCOME',
      incomePercent: 150,
      totalAssetsLimit: 345_000_000,
      carValueLimit: 37_080_000,
      requiresHomeless: true,
    },
  },
};
