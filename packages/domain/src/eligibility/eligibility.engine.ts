import type { NoticeEntity } from '../notice/domain/notice.entity.js';
import type { UserProfileEntity } from '../profile/domain/user-profile.entity.js';
import type { AmountByHouseholdSize, EligibilityTable, JudgeReason, JudgeResult, SupplyTypeRule, Verdict } from './eligibility.types.js';

/** 개별 기준 검사 결과. UNKNOWN 은 데이터가 없어 판단을 보류한 것이다. */
type CheckOutcome = 'OK' | 'BLOCKED' | 'UNKNOWN';

/**
 * 자격 자동 1차 필터. 확정 판정이 아니다. (SPEC §7)
 *
 * 기준표를 생성자로 주입받는다 — 엔진이 "올해 표"를 내부에서 집어오면
 * 과거 판정을 재현할 수 없다. 연도는 언제나 명시적 데이터다.
 *
 * I/O·현재 시각·전역 상태에 접근하지 않는다. 같은 입력이면 항상 같은 결과다.
 */
export class EligibilityEngine {
  private readonly _table: EligibilityTable;

  constructor(table: EligibilityTable) {
    this._table = table;
  }

  get ruleset() {
    return this._table.ruleset;
  }

  public judge(profile: UserProfileEntity, notice: NoticeEntity): JudgeResult {
    const rule = this._table.rules[notice.supplyType];

    if (!rule) {
      return this._result('NEEDS_REVIEW', [
        {
          code: 'NO_RULE_DATA',
          message: `${notice.supplyType} 유형의 ${this._table.year}년 기준이 기준표에 없어 자동 판정을 건너뛰었습니다. 공고문을 직접 확인하세요.`,
        },
      ]);
    }

    // 무주택 요건 — 불충족이면 나머지를 보지 않는다
    if (rule.requiresHomeless && !profile.isHomeless) {
      return this._result('NOT_ELIGIBLE', [{ code: 'NOT_HOMELESS', message: '무주택 요건을 충족하지 않습니다.' }]);
    }

    const reasons: JudgeReason[] = [];
    const outcomes = [this._checkIncome(profile, rule, reasons), this._checkAssets(profile, rule, reasons), this._checkCarValue(profile, rule, reasons)];

    if (outcomes.includes('BLOCKED')) {
      return this._result('NOT_ELIGIBLE', reasons);
    }

    // 나이·혼인·거주요건은 공고문에만 있는 경우가 많아 자동 확정하지 않는다.
    reasons.push({ code: 'MANUAL_CHECK_REQUIRED', message: '나이·혼인·거주 요건과 순위별 조건은 공고문을 확인해야 합니다.' });

    return this._result(outcomes.includes('UNKNOWN') ? 'NEEDS_REVIEW' : 'LIKELY_ELIGIBLE', reasons);
  }

  private _checkIncome(profile: UserProfileEntity, rule: SupplyTypeRule, reasons: JudgeReason[]): CheckOutcome {
    const limit = this._incomeLimitFor(rule, profile.householdSize);

    if (limit === null) {
      reasons.push({ code: 'NO_RULE_DATA', message: `${profile.householdSize}인 가구의 소득 기준이 기준표에 없어 소득 비교를 건너뛰었습니다.` });
      return 'UNKNOWN';
    }

    if (profile.monthlyIncome > limit) {
      reasons.push({
        code: 'INCOME_OVER_LIMIT',
        message: `월소득 ${this._formatWon(profile.monthlyIncome)}이 상한 ${this._formatWon(limit)}(${rule.incomePercent}%)을 초과합니다.`,
      });
      return 'BLOCKED';
    }

    reasons.push({
      code: 'INCOME_WITHIN_LIMIT',
      message: `월소득 ${this._formatWon(profile.monthlyIncome)}이 상한 ${this._formatWon(limit)}(${rule.incomePercent}%) 이내입니다.`,
    });
    return 'OK';
  }

  private _checkAssets(profile: UserProfileEntity, rule: SupplyTypeRule, reasons: JudgeReason[]): CheckOutcome {
    if (profile.totalAssets === null) {
      reasons.push({ code: 'MISSING_PROFILE_DATA', message: '총자산을 입력하지 않아 자산 기준을 확인하지 못했습니다.' });
      return 'UNKNOWN';
    }

    if (profile.totalAssets > rule.totalAssetsLimit) {
      reasons.push({
        code: 'ASSETS_OVER_LIMIT',
        message: `총자산 ${this._formatWon(profile.totalAssets)}이 상한 ${this._formatWon(rule.totalAssetsLimit)}을 초과합니다.`,
      });
      return 'BLOCKED';
    }

    reasons.push({
      code: 'ASSETS_WITHIN_LIMIT',
      message: `총자산 ${this._formatWon(profile.totalAssets)}이 상한 ${this._formatWon(rule.totalAssetsLimit)} 이내입니다.`,
    });
    return 'OK';
  }

  private _checkCarValue(profile: UserProfileEntity, rule: SupplyTypeRule, reasons: JudgeReason[]): CheckOutcome {
    if (profile.carValue === null) {
      reasons.push({ code: 'MISSING_PROFILE_DATA', message: '자동차가액을 입력하지 않아 자동차 기준을 확인하지 못했습니다.' });
      return 'UNKNOWN';
    }

    if (profile.carValue > rule.carValueLimit) {
      reasons.push({
        code: 'CAR_OVER_LIMIT',
        message: `자동차가액 ${this._formatWon(profile.carValue)}이 상한 ${this._formatWon(rule.carValueLimit)}을 초과합니다.`,
      });
      return 'BLOCKED';
    }

    reasons.push({
      code: 'CAR_WITHIN_LIMIT',
      message: `자동차가액 ${this._formatWon(profile.carValue)}이 상한 ${this._formatWon(rule.carValueLimit)} 이내입니다.`,
    });
    return 'OK';
  }

  private _incomeLimitFor(rule: SupplyTypeRule, householdSize: number): number | null {
    const base = rule.incomeBasis === 'URBAN_WORKER_AVERAGE' ? this._table.urbanWorkerAverage : this._table.medianIncome;
    const baseAmount = this._lookupByHouseholdSize(base, householdSize);
    return baseAmount === null ? null : (baseAmount * rule.incomePercent) / 100;
  }

  /**
   * 표에 없는 가구원수는 가장 큰 구간 값으로 대체하지 않고 null 을 돌려준다 —
   * 대가구는 별도 가산 규칙이 붙는 경우가 있어 임의 확장이 위험하다.
   */
  private _lookupByHouseholdSize(table: AmountByHouseholdSize, householdSize: number): number | null {
    const amount = table[householdSize];
    return typeof amount === 'number' ? amount : null;
  }

  private _formatWon(amount: number): string {
    return `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  private _result(verdict: Verdict, reasons: JudgeReason[]): JudgeResult {
    return { verdict, reasons, ruleset: this._table.ruleset };
  }
}
