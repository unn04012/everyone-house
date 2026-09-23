/**
 * 공고문에서 추출한 자격·순위 기준.
 *
 * 전역 기준표로는 순위를 맞출 수 없다 — 순위 축 자체가 공고마다 다르다:
 *   행복주택   거주지 / 대학 소재지 (지역)
 *   국민임대   해당구·연접구 거주 + 청약저축 24회/6회
 *   장기전세   청약저축 회차 × 소득구간 조합 (1~4순위)
 *   매입임대   소득 130% 이하/초과
 * 그래서 공고별로 공고문을 읽어 저장한다.
 */

/** 순위를 가르는 축. */
export enum RankBasisEnum {
  RESIDENCE = 'RESIDENCE', // 거주지·소득근거지·대학 소재지
  SUBSCRIPTION = 'SUBSCRIPTION', // 주택청약종합저축 납입회차
  INCOME = 'INCOME', // 소득 구간
  MIXED = 'MIXED', // 두 축 이상의 조합
  OTHER = 'OTHER',
}
export type RankBasis = keyof typeof RankBasisEnum;

export interface RankRule {
  /** 1, 2, 3 ... */
  rank: number;
  basis: RankBasis;
  /** 공고문 표현 그대로. 판정 근거로 사용자에게 보여준다. */
  condition: string;
  /** 지역 기준일 때 해당 지역 목록 (시도 또는 '시도 시군구') */
  regions: string[];
  /** 청약저축 기준일 때 필요한 납입회차 */
  requiredSubscriptionPayments: number | null;
  /** 우선공급 순위인가(일반공급과 별도 체계) */
  isPrioritySupply: boolean;
}

/** 계층별 자격 기준. 같은 공고 안에서도 계층마다 다르다. */
export interface CategoryRule {
  /** 공고문 표기 그대로. 예: '청년', '대학생', '신혼부부', '고령자' */
  categoryLabel: string;
  /** 도시근로자 월평균소득 기준 % (예: 100, 120). 중위소득 기준이면 medianIncomePercent 사용 */
  urbanWorkerIncomePercent: number | null;
  medianIncomePercent: number | null;
  /** 원 단위 */
  totalAssetsLimit: number | null;
  carValueLimit: number | null;
  requiresHomeless: boolean;
  minAge: number | null;
  maxAge: number | null;
  /** 혼인 관련 제약. 예: '혼인 중이 아닐 것' */
  maritalRequirement: string | null;
}

export interface NoticeCriteria {
  /** 접수 시작·종료일 (YYYY-MM-DD). 목록에 마감일이 없는 SH 공고는 여기서만 얻을 수 있다 */
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  /** 입주자모집공고일. 자격 판단 기준일이다 */
  announcementDate: string | null;
  categories: CategoryRule[];
  ranks: RankRule[];
  /** 자동 판정이 어려운 조건. 사용자에게 그대로 보여준다 */
  manualCheckNotes: string[];
  /** 추출 실패·불확실 항목 */
  uncertainNotes: string[];
}

/** 추출 결과 + 출처 메타. 재추출 판단과 감사에 쓴다. */
export interface NoticeCriteriaRecord extends NoticeCriteria {
  noticeId: string;
  model: string;
  extractedAt: string;
  /** 분석에 사용한 공고문 파일명 */
  sourceFileName: string;
}
