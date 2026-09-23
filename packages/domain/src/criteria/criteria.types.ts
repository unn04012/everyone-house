import type { IncomeBasis } from '../eligibility/eligibility.types.js';

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
  /**
   * 이 순위가 적용되는 주택 구분. 같은 공고에서도 면적대별로 순위 체계가 다르다 —
   * 국민임대는 50㎡ 미만이 거주지 기준, 50㎡ 이상이 청약저축 회차 기준이다.
   * 구분이 없으면 null (공고 전체에 적용).
   */
  appliesTo: string | null;
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

/**
 * 공고문에 실린 가구원수별 소득 금액표.
 *
 * 이 금액이 있어야 판정을 자동화할 수 있다 — 기준이 "도시근로자 월평균소득의 100%"
 * 라고만 알아서는 실제 상한선을 계산할 수 없다. 공고문마다 표가 실려 있고
 * 1인 가구 +20%p, 2인 +10%p 가산이 이미 반영된 금액이 적혀 있다.
 */
export interface IncomeTableRow {
  /** 기준 비율 (%). 예: 100, 120, 130 */
  percent: number;
  /** 어느 통계 기준인가 */
  basis: IncomeBasis;
  /** 가구원수별 월 금액(원). 표에 없는 칸은 담지 않는다 */
  amounts: { householdSize: number; amount: number }[];
  /** 이 행이 적용되는 대상 설명. 예: '공통', '맞벌이 신혼부부' */
  appliesTo: string | null;
}

export interface NoticeCriteria {
  /** 접수 시작·종료일 (YYYY-MM-DD). 목록에 마감일이 없는 SH 공고는 여기서만 얻을 수 있다 */
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  /** 입주자모집공고일. 자격 판단 기준일이다 */
  announcementDate: string | null;
  categories: CategoryRule[];
  ranks: RankRule[];
  /** 공고문에 실린 가구원수별 소득 금액표. 없으면 빈 배열 */
  incomeTable: IncomeTableRow[];
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
