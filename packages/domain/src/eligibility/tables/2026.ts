import type { EligibilityTable } from '../eligibility.types.js';

/**
 * 2026년 기준표.
 *
 * ⚠️ 아직 채워지지 않았다. 실제 수치는 공식 출처에서 확인해 넣어야 한다:
 *   - 도시근로자 가구원수별 월평균소득: 통계청 가계동향조사 기반, 국토부/LH 공고문 부록
 *   - 기준 중위소득: 보건복지부 고시
 *   - 총자산·자동차가액 상한: 유형별 공고문 (연도별 갱신)
 *
 * 값이 비어 있는 동안 EligibilityEngine 은 NO_RULE_DATA 사유로 NEEDS_REVIEW 를 돌려준다.
 * 추측값을 넣지 말 것 — 틀린 상한은 적합한 공고를 조용히 버리거나 그 반대를 한다.
 */
export class EligibilityTable2026 {
  public static readonly RULESET = '2026.0-empty';

  public static create(): EligibilityTable {
    return {
      ruleset: EligibilityTable2026.RULESET,
      year: 2026,
      urbanWorkerAverage: {},
      medianIncome: {},
      rules: {},
    };
  }
}
