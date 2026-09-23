import { createHash } from 'node:crypto';

import type { JudgeReason, Verdict } from '../eligibility/eligibility.types.js';
import type { RankEvaluation, RankingResult } from '../ranking/ranking.types.js';
import type { CategoryOutcome, MatchSchema } from './match.types.js';

/**
 * 공고 × 프로필 판정 결과.
 *
 * 공고 하나에 계층이 여럿이면(청년 1·2·3순위처럼) 계층마다 판정하고,
 * 가장 유리한 결과를 대표값으로 삼는다 — 사용자 입장에서는 "어느 계층으로든
 * 넣을 수 있으면 알림 대상" 이기 때문이다.
 */
export class MatchEntity {
  /** 유리한 순서. 앞쪽이 더 유리하다 */
  private static readonly VERDICT_RANK: Record<Verdict, number> = {
    LIKELY_ELIGIBLE: 0,
    NEEDS_REVIEW: 1,
    NOT_ELIGIBLE: 2,
  };

  private readonly _matchId: string;
  private readonly _noticeId: string;
  private readonly _profileId: string;
  private readonly _verdict: Verdict;
  private readonly _categoryLabel: string | null;
  private readonly _reasons: JudgeReason[];
  private readonly _ruleset: string;
  private readonly _categoryOutcomes: CategoryOutcome[];
  private readonly _bestRank: number | null;
  private readonly _bestPriorityRank: number | null;
  private readonly _rankEvaluations: RankEvaluation[];
  private readonly _judgedAt: string;

  get matchId() {
    return this._matchId;
  }
  get noticeId() {
    return this._noticeId;
  }
  get profileId() {
    return this._profileId;
  }
  get verdict() {
    return this._verdict;
  }
  get categoryLabel() {
    return this._categoryLabel;
  }
  get reasons(): readonly JudgeReason[] {
    return this._reasons;
  }
  get bestRank() {
    return this._bestRank;
  }
  get bestPriorityRank() {
    return this._bestPriorityRank;
  }

  private constructor(schema: MatchSchema) {
    this._matchId = schema.matchId;
    this._noticeId = schema.noticeId;
    this._profileId = schema.profileId;
    this._verdict = schema.verdict;
    this._categoryLabel = schema.categoryLabel;
    this._reasons = schema.reasons;
    this._ruleset = schema.ruleset;
    this._categoryOutcomes = schema.categoryOutcomes;
    this._bestRank = schema.bestRank;
    this._bestPriorityRank = schema.bestPriorityRank;
    this._rankEvaluations = schema.rankEvaluations;
    this._judgedAt = schema.judgedAt;
  }

  /**
   * 같은 (공고, 프로필)은 몇 번을 판정해도 같은 ID 여야 한다 —
   * 재판정이 새 행을 쌓지 않고 기존 행을 갱신하도록.
   */
  private static _deriveMatchId(noticeId: string, profileId: string): string {
    const hash = createHash('sha256').update(`${noticeId}:${profileId}`).digest('hex');
    return [hash.slice(0, 8), hash.slice(8, 12), `8${hash.slice(13, 16)}`, `8${hash.slice(17, 20)}`, hash.slice(20, 32)].join('-');
  }

  public static create({
    noticeId,
    profileId,
    ruleset,
    categoryOutcomes,
    ranking,
    judgedAt,
  }: {
    noticeId: string;
    profileId: string;
    ruleset: string;
    categoryOutcomes: CategoryOutcome[];
    ranking: RankingResult;
    judgedAt: Date;
  }): MatchEntity {
    const best = MatchEntity._selectBest(categoryOutcomes);

    return new MatchEntity({
      matchId: MatchEntity._deriveMatchId(noticeId, profileId),
      noticeId,
      profileId,
      verdict: best?.verdict ?? 'NEEDS_REVIEW',
      categoryLabel: best?.categoryLabel ?? null,
      reasons: best?.reasons ?? [{ code: 'NO_RULE_DATA', message: '공고문에서 판정 가능한 계층 기준을 찾지 못했습니다.' }],
      ruleset,
      categoryOutcomes,
      bestRank: ranking.bestRank,
      bestPriorityRank: ranking.bestPriorityRank,
      rankEvaluations: ranking.evaluations,
      judgedAt: judgedAt.toISOString(),
    });
  }

  public static fromSchema(schema: MatchSchema): MatchEntity {
    return new MatchEntity(schema);
  }

  public getMatch(): MatchSchema {
    return {
      matchId: this._matchId,
      noticeId: this._noticeId,
      profileId: this._profileId,
      verdict: this._verdict,
      categoryLabel: this._categoryLabel,
      reasons: this._reasons,
      ruleset: this._ruleset,
      categoryOutcomes: this._categoryOutcomes,
      bestRank: this._bestRank,
      bestPriorityRank: this._bestPriorityRank,
      rankEvaluations: this._rankEvaluations,
      judgedAt: this._judgedAt,
    };
  }

  /** 알림을 보낼 가치가 있는가. 미해당은 굳이 알리지 않는다. */
  public isWorthNotifying(): boolean {
    return this._verdict !== 'NOT_ELIGIBLE';
  }

  private static _selectBest(outcomes: CategoryOutcome[]): CategoryOutcome | null {
    if (outcomes.length === 0) {
      return null;
    }
    return outcomes.reduce((best, current) =>
      MatchEntity.VERDICT_RANK[current.verdict] < MatchEntity.VERDICT_RANK[best.verdict] ? current : best,
    );
  }
}
