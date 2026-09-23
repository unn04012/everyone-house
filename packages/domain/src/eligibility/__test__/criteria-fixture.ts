import type { NoticeCriteria } from '../../criteria/criteria.types.js';

/**
 * 테스트용 공고 기준. 2026년 2차 행복주택 공고문에서 실제로 추출된 값을 축약한 것이다
 * (금액표는 원문 그대로 — 경계 검증이 실제 숫자에 의존한다).
 */
export const happyHouseCriteria: NoticeCriteria = {
  applicationStartDate: '2026-09-09',
  applicationEndDate: '2026-09-11',
  announcementDate: '2026-08-28',
  categories: [
    {
      categoryLabel: '청년',
      applicantScope: 'SELF',
      urbanWorkerIncomePercent: 100,
      medianIncomePercent: null,
      totalAssetsLimit: 251_000_000,
      carValueLimit: 45_420_000,
      requiresHomeless: true,
      minAge: 19,
      maxAge: 39,
      maritalRequirement: '혼인 중이 아닐 것',
    },
    {
      categoryLabel: '대학생',
      applicantScope: 'SELF_AND_PARENTS',
      urbanWorkerIncomePercent: 100,
      medianIncomePercent: null,
      totalAssetsLimit: 108_000_000,
      carValueLimit: null,
      requiresHomeless: true,
      minAge: null,
      maxAge: null,
      maritalRequirement: '혼인 중이 아닐 것',
    },
  ],
  ranks: [],
  incomeTable: [
    {
      percent: 100,
      basis: 'URBAN_WORKER_AVERAGE',
      appliesTo: '공통',
      amounts: [
        { householdSize: 1, amount: 4_576_036 },
        { householdSize: 2, amount: 6_452_897 },
        { householdSize: 3, amount: 8_168_429 },
        { householdSize: 4, amount: 8_802_202 },
        { householdSize: 5, amount: 9_326_985 },
      ],
    },
  ],
  supplyTablePages: [],
  manualCheckNotes: ['나이·거주 요건과 순위별 조건은 공고문을 확인해야 합니다.'],
  uncertainNotes: [],
};
