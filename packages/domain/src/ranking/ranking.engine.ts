import type { NoticeCriteria, RankRule } from '../criteria/criteria.types.js';
import type { UserProfileEntity } from '../profile/domain/user-profile.entity.js';
import type { RankEvaluation, RankOutcome, RankingResult } from './ranking.types.js';

/**
 * 순위 판정.
 *
 * 자격(EligibilityEngine)과 축이 완전히 다르다 — 자격은 소득·자산이 가르고,
 * 순위는 거주지나 청약저축 회차가 가른다. 소득이 낮아도 지방 거주면 3순위고,
 * 소득이 높아도 서울 거주면 1순위다.
 *
 * 순위 체계 자체가 공고마다 다르므로(지역 / 청약회차 / 소득구간 / 복합)
 * 공고문에서 추출한 RankRule 을 그대로 평가한다.
 */
export class RankingEngine {
  private readonly _criteria: NoticeCriteria;

  constructor(criteria: NoticeCriteria) {
    this._criteria = criteria;
  }

  /**
   * @param appliesTo 면적대·계층으로 순위가 갈리는 공고에서 어느 쪽을 볼지. 생략하면 전부 평가한다.
   *
   * appliesTo 는 공고문에서 뽑은 자유 문자열이라 표기가 제각각이다
   * ('청년 계층', '청년 계층 일반공급', '전용 50㎡ 미만' …). 완전일치로 거르면
   * 아무것도 안 걸리므로 부분일치로 본다.
   */
  public evaluate(profile: UserProfileEntity, appliesTo?: string): RankingResult {
    const rules = appliesTo ? this._criteria.ranks.filter((rule) => rule.appliesTo?.includes(appliesTo) ?? false) : this._criteria.ranks;

    const evaluations = rules.map((rule) => this._evaluateRule(profile, rule)).toSorted((a, b) => a.rank - b.rank);

    return {
      bestRank: this._bestRank(evaluations, false),
      bestPriorityRank: this._bestRank(evaluations, true),
      evaluations,
      hasUnknown: evaluations.some((evaluation) => evaluation.outcome === 'UNKNOWN'),
    };
  }

  private _evaluateRule(profile: UserProfileEntity, rule: RankRule): RankEvaluation {
    const { outcome, message } = this._check(profile, rule);

    return {
      rank: rule.rank,
      basis: rule.basis,
      appliesTo: rule.appliesTo,
      isPrioritySupply: rule.isPrioritySupply,
      outcome,
      message,
      condition: rule.condition,
    };
  }

  private _check(profile: UserProfileEntity, rule: RankRule): { outcome: RankOutcome; message: string } {
    switch (rule.basis) {
      case 'RESIDENCE':
        return this._checkResidence(profile, rule);
      case 'SUBSCRIPTION':
        return this._checkSubscription(profile, rule);
      case 'MIXED':
        return this._checkMixed(profile, rule);
      default:
        // INCOME·OTHER 는 조건 서술이 자유로워 기계 판정하지 않는다.
        return { outcome: 'UNKNOWN', message: '조건을 자동으로 판단할 수 없습니다. 공고문을 확인하세요.' };
    }
  }

  /**
   * 거주지 기준. 공고는 보통 '거주지 또는 소득근거지'(대학생은 대학 소재지)를 본다.
   * 지역 목록이 비어 있으면(예: "1·2순위에 해당하지 않는 자") 판단하지 않는다.
   */
  private _checkResidence(profile: UserProfileEntity, rule: RankRule): { outcome: RankOutcome; message: string } {
    if (rule.regions.length === 0) {
      return { outcome: 'UNKNOWN', message: '공고문에서 해당 순위의 지역 목록을 찾지 못했습니다.' };
    }

    const locations = profile.rankingLocations();
    const matched = locations.find((location) => location.isIn(rule.regions));

    if (matched) {
      return { outcome: 'MATCHED', message: `${matched.toString()}이(가) 이 순위의 지역에 해당합니다.` };
    }

    // 자치구를 모르면 시도 단위로도 못 맞추는 경우가 있어 구분해 알린다.
    if (profile.residence.district === null && rule.regions.some((region) => region.includes(' '))) {
      return { outcome: 'UNKNOWN', message: '자치구를 입력하지 않아 지역 요건을 확인하지 못했습니다.' };
    }

    return { outcome: 'NOT_MATCHED', message: `${locations.map((location) => location.toString()).join(', ')}이(가) 이 순위의 지역에 없습니다.` };
  }

  private _checkSubscription(profile: UserProfileEntity, rule: RankRule): { outcome: RankOutcome; message: string } {
    if (rule.requiredSubscriptionPayments === null) {
      return { outcome: 'UNKNOWN', message: '공고문에서 필요한 청약저축 납입회차를 찾지 못했습니다.' };
    }

    if (profile.meetsSubscriptionPayments(rule.requiredSubscriptionPayments)) {
      return {
        outcome: 'MATCHED',
        message: `청약저축 ${profile.housingSubscriptionPayments}회가 요건(${rule.requiredSubscriptionPayments}회 이상)을 충족합니다.`,
      };
    }

    return {
      outcome: 'NOT_MATCHED',
      message: `청약저축 ${profile.housingSubscriptionPayments}회가 요건(${rule.requiredSubscriptionPayments}회 이상)에 못 미칩니다.`,
    };
  }

  /** 두 축을 함께 보는 순위는 둘 다 충족해야 한다. */
  private _checkMixed(profile: UserProfileEntity, rule: RankRule): { outcome: RankOutcome; message: string } {
    const residence = this._checkResidence(profile, rule);
    const subscription = this._checkSubscription(profile, rule);

    if (residence.outcome === 'NOT_MATCHED' || subscription.outcome === 'NOT_MATCHED') {
      return { outcome: 'NOT_MATCHED', message: `${residence.message} / ${subscription.message}` };
    }
    if (residence.outcome === 'UNKNOWN' || subscription.outcome === 'UNKNOWN') {
      return { outcome: 'UNKNOWN', message: `${residence.message} / ${subscription.message}` };
    }

    return { outcome: 'MATCHED', message: `${residence.message} / ${subscription.message}` };
  }

  private _bestRank(evaluations: RankEvaluation[], priorityOnly: boolean): number | null {
    const matched = evaluations.filter((evaluation) => evaluation.isPrioritySupply === priorityOnly && evaluation.outcome === 'MATCHED');
    return matched.length === 0 ? null : Math.min(...matched.map((evaluation) => evaluation.rank));
  }
}
