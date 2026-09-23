import type { RankBasis, RankRule } from '../criteria/criteria.types.js';

export enum RankOutcomeEnum {
  /** 이 순위 요건을 충족한다 */
  MATCHED = 'MATCHED',
  /** 충족하지 못한다 */
  NOT_MATCHED = 'NOT_MATCHED',
  /** 판단에 필요한 정보가 없다 (프로필 미입력 또는 추출 실패) */
  UNKNOWN = 'UNKNOWN',
}
export type RankOutcome = keyof typeof RankOutcomeEnum;

export interface RankEvaluation {
  rank: number;
  basis: RankBasis;
  /** 면적대·계층 등 이 순위가 적용되는 구분 */
  appliesTo: string | null;
  isPrioritySupply: boolean;
  outcome: RankOutcome;
  /** 왜 이렇게 판단했는지 */
  message: string;
  /** 공고문 원문 조건 */
  condition: string;
}

export interface RankingResult {
  /** 충족하는 가장 높은 순위. 없으면 null */
  bestRank: number | null;
  /** 우선공급에서 충족하는 가장 높은 순위 */
  bestPriorityRank: number | null;
  evaluations: RankEvaluation[];
  /** 판단 불가 항목이 있는가 — 있으면 결과를 확정으로 보지 않는다 */
  hasUnknown: boolean;
}

export type { RankRule };
