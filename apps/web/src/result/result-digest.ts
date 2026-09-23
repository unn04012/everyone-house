import { ReasonCodeEnum, VerdictEnum, type Verdict } from '@everyone-house/domain/types';
import type { MatchView } from '../api/api.types.js';
import type { ProfileField } from '../profile/profile-draft.js';

/** 지금 채우면 판정이 확정되는 항목 */
export interface MissingFieldSummary {
  field: ProfileField;
  /** 이 항목 때문에 확인 필요로 남은 공고 수 */
  count: number;
}

/**
 * 결과 목록의 집계. 정렬(적합 → 확인 필요 → 미해당)과
 * "무엇을 채우면 몇 건이 확정되는가" 를 여기서만 계산한다.
 */
export class ResultDigest {
  private readonly _matches: readonly MatchView[];
  private readonly _collectedToday: number;

  get collectedToday(): number {
    return this._collectedToday;
  }

  private constructor(matches: readonly MatchView[], collectedToday: number) {
    this._matches = matches;
    this._collectedToday = collectedToday;
  }

  public static from(matches: readonly MatchView[], collectedToday: number): ResultDigest {
    return new ResultDigest(matches, collectedToday);
  }

  public static empty(): ResultDigest {
    return new ResultDigest([], 0);
  }

  public countOf(verdict: Verdict): number {
    return this._matches.filter((match) => match.verdict === verdict).length;
  }

  public get isEmpty(): boolean {
    return this._matches.length === 0;
  }

  /** 판정순 + 마감 임박순 */
  public of(verdict: Verdict): MatchView[] {
    return this._matches.filter((match) => match.verdict === verdict).toSorted((left, right) => ResultDigest._byDeadline(left, right));
  }

  /** 접지 않고 보여주는 목록 (적합 → 확인 필요). 미해당은 따로 접어서 개수만 노출한다 */
  public get visible(): MatchView[] {
    return [...this.of(VerdictEnum.LIKELY_ELIGIBLE), ...this.of(VerdictEnum.NEEDS_REVIEW)];
  }

  public get notEligible(): MatchView[] {
    return this.of(VerdictEnum.NOT_ELIGIBLE);
  }

  /**
   * 가장 많은 공고를 묶어서 풀어 주는 미입력 항목.
   * 배너("총자산을 채우면 확인 필요 3건이 확정돼요")는 이 값으로 만든다.
   */
  public get topMissingField(): MissingFieldSummary | null {
    const counts = new Map<ProfileField, number>();
    for (const match of this._matches) {
      if (match.verdict !== VerdictEnum.NEEDS_REVIEW) {
        continue;
      }
      for (const reason of match.reasons) {
        if (reason.code === ReasonCodeEnum.MISSING_PROFILE_DATA && reason.field) {
          counts.set(reason.field, (counts.get(reason.field) ?? 0) + 1);
        }
      }
    }
    let top: MissingFieldSummary | null = null;
    for (const [field, count] of counts) {
      if (!top || count > top.count) {
        top = { field, count };
      }
    }
    return top;
  }

  private static _byDeadline(left: MatchView, right: MatchView): number {
    if (!left.closesAt) {
      return 1;
    }
    if (!right.closesAt) {
      return -1;
    }
    return new Date(left.closesAt).getTime() - new Date(right.closesAt).getTime();
  }
}
