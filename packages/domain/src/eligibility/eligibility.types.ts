import type { SupplyType } from '../notice/domain/notice.types.js';

/**
 * 3단계 판정. 공고문 PDF에만 상세 자격이 있는 경우가 많아
 * NEEDS_REVIEW 는 실패가 아니라 정상적인 결과다. (SPEC §7)
 */
export enum VerdictEnum {
  LIKELY_ELIGIBLE = 'LIKELY_ELIGIBLE', // 적합 가능성 높음
  NEEDS_REVIEW = 'NEEDS_REVIEW', // 검토 필요
  NOT_ELIGIBLE = 'NOT_ELIGIBLE', // 미해당
}
export type Verdict = keyof typeof VerdictEnum;

export enum ReasonCodeEnum {
  INCOME_WITHIN_LIMIT = 'INCOME_WITHIN_LIMIT',
  INCOME_OVER_LIMIT = 'INCOME_OVER_LIMIT',
  ASSETS_WITHIN_LIMIT = 'ASSETS_WITHIN_LIMIT',
  ASSETS_OVER_LIMIT = 'ASSETS_OVER_LIMIT',
  CAR_WITHIN_LIMIT = 'CAR_WITHIN_LIMIT',
  CAR_OVER_LIMIT = 'CAR_OVER_LIMIT',
  NOT_HOMELESS = 'NOT_HOMELESS',
  /** 기준표에 해당 유형·가구원수 데이터가 없어 판정 불가 */
  NO_RULE_DATA = 'NO_RULE_DATA',
  /** 프로필에 값이 없어 판정 불가 (미입력과 0 은 다르다) */
  MISSING_PROFILE_DATA = 'MISSING_PROFILE_DATA',
  /** 공고문(PDF)에만 있는 조건이라 자동 판정 범위를 벗어남 */
  MANUAL_CHECK_REQUIRED = 'MANUAL_CHECK_REQUIRED',
}
export type ReasonCode = keyof typeof ReasonCodeEnum;

export interface JudgeReason {
  code: ReasonCode;
  /** 사람이 읽을 설명. 알림 본문에 그대로 쓴다. */
  message: string;
}

export interface JudgeResult {
  verdict: Verdict;
  reasons: JudgeReason[];
  /** 판정에 사용한 기준표 버전. matches 행에 함께 저장한다. (SPEC D5) */
  ruleset: string;
}

/** 소득 기준 체계. 유형에 따라 기준이 되는 표가 다르다. (SPEC §7) */
export enum IncomeBasisEnum {
  URBAN_WORKER_AVERAGE = 'URBAN_WORKER_AVERAGE', // 전년도 도시근로자 가구원수별 월평균소득
  MEDIAN_INCOME = 'MEDIAN_INCOME', // 기준 중위소득
}
export type IncomeBasis = keyof typeof IncomeBasisEnum;

/** 가구원수 → 금액(원) */
export type AmountByHouseholdSize = Record<number, number>;

export interface SupplyTypeRule {
  incomeBasis: IncomeBasis;
  /** 소득 상한 비율 (%). 예: 100, 120, 150 */
  incomePercent: number;
  /** 총자산 상한 (원) */
  totalAssetsLimit: number;
  /** 자동차가액 상한 (원) */
  carValueLimit: number;
  requiresHomeless: boolean;
}

/**
 * 연도별 기준표. 코드 상수로 관리한다 (SPEC D3).
 * 갱신 시 새 연도 파일을 추가하고 ruleset 버전을 올린다.
 */
export interface EligibilityTable {
  /** 예: '2026.1' */
  ruleset: string;
  year: number;
  urbanWorkerAverage: AmountByHouseholdSize;
  medianIncome: AmountByHouseholdSize;
  rules: Partial<Record<SupplyType, SupplyTypeRule>>;
}
