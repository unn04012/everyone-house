import type { LocationSchema } from './location.js';

export enum MaritalStatusEnum {
  SINGLE = 'SINGLE',
  NEWLYWED = 'NEWLYWED', // 신혼부부 (혼인 7년 이내 등 공고별 정의)
  MARRIED = 'MARRIED',
}
export type MaritalStatus = keyof typeof MaritalStatusEnum;

/**
 * 신청 계층. 소득·자산 상한이 계층별로 다르다.
 * (예: 총자산 대학생 1.08억 / 청년 2.51억 / 신혼부부·고령자 3.45억)
 *
 * maritalStatus 와 별개다 — 이쪽은 "무엇으로 신청하는가",
 * maritalStatus 는 그 계층 자격을 충족하는지 판단하는 사실이다.
 * (예: 청년 계층은 혼인 중이 아니어야 한다)
 */
export enum ApplicantCategoryEnum {
  UNIVERSITY_STUDENT = 'UNIVERSITY_STUDENT', // 대학생
  YOUTH = 'YOUTH', // 청년 (사회초년생·취업준비생 포함)
  NEWLYWED = 'NEWLYWED', // 신혼부부 (예비·한부모 포함)
  SENIOR = 'SENIOR', // 고령자
  ETC = 'ETC',
}
export type ApplicantCategory = keyof typeof ApplicantCategoryEnum;

/**
 * 소득·자산을 누구 기준으로 보는가.
 *
 * 같은 사람이라도 공고마다 적용 범위가 다르다. 실제 공고문 문구:
 *   SELF              "본인의 월평균 소득이 … 1인 가구 월평균소득 100% 이하"
 *   SELF_AND_PARENTS  "본인과 부모의 월평균 소득이 … 100% 이하"
 *   HOUSEHOLD         "해당 세대의 월평균 소득이 … (무주택세대구성원 전원)"
 *
 * 행복주택 청년 계층처럼 "세대주면 전원, 세대원이면 본인만" 인 경우도 있어
 * livesWithParents 로 분기한다.
 */
export enum ApplicantScopeEnum {
  SELF = 'SELF',
  SELF_AND_PARENTS = 'SELF_AND_PARENTS',
  HOUSEHOLD = 'HOUSEHOLD',
  /** 세대주면 HOUSEHOLD, 세대원이면 SELF */
  SELF_IF_NOT_HOUSEHOLDER = 'SELF_IF_NOT_HOUSEHOLDER',
}
export type ApplicantScope = keyof typeof ApplicantScopeEnum;

/** 자격 판정 입력. 금액 단위는 모두 '원'. */
export interface UserProfileSchema {
  profileId: string;
  category: ApplicantCategory;

  // ── 본인 기준 ──
  /** 본인 세전 월소득 (원) */
  personalIncome: number;
  /** 본인 총자산 (원). **모르면 null** — 0 으로 두면 자산 초과자를 통과시킨다 */
  personalAssets: number | null;

  // ── 세대 기준 ──
  householdSize: number;
  /** 세대 전원의 세전 월소득 합계 (원) */
  householdIncome: number;
  /** 세대 전원의 총자산 (원). 모르면 null */
  householdAssets: number | null;
  /** 부모의 월소득 합계 (원). '본인+부모' 범위 판정에 쓴다. 모르면 null */
  parentsIncome: number | null;
  /** 부모의 총자산 (원). 모르면 null */
  parentsAssets: number | null;
  /** 부모와 같은 세대인가(= 본인이 세대주가 아닌가). 청년 계층 판정을 가른다 */
  livesWithParents: boolean;

  /** 자동차가액 (원). 무차량이면 0, **모르면 null**. 세대에 2대 이상이면 가장 높은 값 */
  carValue: number | null;
  isHomeless: boolean;
  age: number;

  // ── 우선공급 1순위 조건 (매입·전세임대 등) ──
  /** 「국민기초생활보장법」 수급자 가구 */
  isBasicLivingBeneficiary: boolean;
  /** 차상위계층 가구 */
  isSecondLowestIncome: boolean;
  /** 「한부모가족 지원법」 지원대상 한부모가족 */
  isSupportedSingleParent: boolean;
  maritalStatus: MaritalStatus;
  /** 맞벌이 여부. 신혼부부 소득 상한이 100% → 120% 로 확장된다 */
  isDualIncome: boolean;
  /**
   * 자녀 생년월일. 2세 미만 자녀 유무(우선공급 최우선 조건)와
   * 소득 가산(공고일 기준 특정일 이후 출생) 판정에 쓴다.
   * 기준일이 공고마다 다르므로 날짜 자체를 보관하고 판정 시점에 계산한다.
   */
  childrenBirthDates: string[];

  // ── 순위 판정용 ──
  /** 거주지. 자치구까지 필요하다 */
  residence: LocationSchema;
  /** 해당 자치구 최종전입일. 배점(3년 이상 3점 / 미만 1점) 판정용 */
  districtMovedInAt: string | null;
  /** 소득근거지(직장 소재지). 순위를 '거주지 또는 소득근거지'로 판정한다 */
  incomeSourceLocation: LocationSchema | null;
  /** 대학 소재지. 대학생 계층은 학교 위치로 순위를 판정한다 */
  universityLocation: LocationSchema | null;
  /**
   * 주택청약종합저축 납입회차.
   * 국민임대(24회/6회), 장기전세(24회/6회 × 소득구간) 순위의 핵심 기준이다.
   */
  housingSubscriptionPayments: number;
}
