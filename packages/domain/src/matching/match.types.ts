import type { JudgeReason, Verdict } from '../eligibility/eligibility.types.js';
import type { RankEvaluation } from '../ranking/ranking.types.js';

/** 한 계층으로 신청했을 때의 결과. 공고 하나에 계층이 여러 개일 수 있다. */
export interface CategoryOutcome {
  categoryLabel: string;
  verdict: Verdict;
  reasons: JudgeReason[];
}

export interface MatchSchema {
  matchId: string;
  noticeId: string;
  profileId: string;
  /** 계층별 결과 중 가장 유리한 것. 알림·목록에 이 값을 쓴다 */
  verdict: Verdict;
  /** 그 결과를 낸 계층 */
  categoryLabel: string | null;
  reasons: JudgeReason[];
  /** 판정 근거의 출처 (공고 + 추출본) */
  ruleset: string;
  /** 계층별 전체 결과. 사용자에게 "어느 계층으로 넣으면 되는지" 보여줄 때 쓴다 */
  categoryOutcomes: CategoryOutcome[];
  /** 일반공급 최고 순위. 해당 없으면 null */
  bestRank: number | null;
  /** 우선공급 최고 순위 */
  bestPriorityRank: number | null;
  rankEvaluations: RankEvaluation[];
  judgedAt: string;
}
