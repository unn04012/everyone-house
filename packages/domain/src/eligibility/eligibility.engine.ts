import type { CategoryRule, IncomeTableRow, NoticeCriteria } from '../criteria/criteria.types.js';
import type { NoticeEntity } from '../notice/domain/notice.entity.js';
import type { ApplicantScope } from '../profile/domain/profile.types.js';
import type { UserProfileEntity } from '../profile/domain/user-profile.entity.js';
import type { JudgeReason, JudgeResult, Verdict } from './eligibility.types.js';

/** 개별 기준 검사 결과. UNKNOWN 은 데이터가 없어 판단을 보류한 것이다. */
type CheckOutcome = 'OK' | 'BLOCKED' | 'BORDERLINE' | 'UNKNOWN';

/** 공고가 요구하는 범위로 해석된 소득·자산. */
interface ScopedFinances {
  income: number;
  assets: number | null;
  householdSize: number;
}

/**
 * 자격 자동 1차 필터. 확정 판정이 아니다. (SPEC §7)
 *
 * 공고문에서 추출한 기준(NoticeCriteria)을 주입받아 판정한다 —
 * 전역 기준표로는 맞출 수 없다. 소득 상한 금액조차 공고문마다 표로 실려 있고,
 * 가산 규칙(1인 +20%p 등)이 이미 반영된 값이라 다시 계산하면 안 된다.
 *
 * I/O·현재 시각·전역 상태에 접근하지 않는다. 같은 입력이면 항상 같은 결과다.
 */
export class EligibilityEngine {
  /**
   * 경계 완충 비율. 상한의 ±5% 안에 들면 확정하지 않고 검토로 보낸다.
   *
   * 사용자가 입력하는 소득은 근사치인데(연봉÷12 등), 실제 심사는 사회보장정보시스템의
   * 공적자료로 한다. 실제로 7,297원(0.16%) 차이로 갈리는 사례가 나왔다 —
   * 이 폭에서 '미해당'으로 단정하면 유효한 공고를 버리게 된다.
   */
  private static readonly BORDERLINE_RATIO = 0.05;

  /** 계층명에서 '수급자 전용' 을 알아보는 단서 */
  private static readonly SUPPORT_STATUS_HINTS = ['수급자', '차상위', '한부모'];

  private readonly _criteria: NoticeCriteria;

  constructor(criteria: NoticeCriteria) {
    this._criteria = criteria;
  }

  /**
   * @param categoryLabel 어느 계층으로 신청하는지. 생략하면 프로필 계층에 맞는 것을 고른다.
   */
  public judge(profile: UserProfileEntity, notice: NoticeEntity, categoryLabel?: string): JudgeResult {
    const ruleset = this._rulesetVersion(notice);
    const category = this._selectCategory(profile, categoryLabel);

    if (!category) {
      return this._result('NEEDS_REVIEW', ruleset, [
        {
          code: 'NO_RULE_DATA',
          message: `공고문에서 ${this._categoryHint(profile)} 계층의 자격 기준을 찾지 못해 자동 판정을 건너뛰었습니다. 공고문을 직접 확인하세요.`,
        },
      ]);
    }

    if (category.requiresHomeless && !profile.isHomeless) {
      return this._result('NOT_ELIGIBLE', ruleset, [{ code: 'NOT_HOMELESS', message: '무주택 요건을 충족하지 않습니다.' }]);
    }

    // 수급자 전용 계층은 소득·자산 기준이 따로 없는 경우가 많아, 검사할 게 없으면
    // 통과처럼 보인다. 해당자가 아니면 신청 자체가 안 되므로 먼저 걸러낸다.
    if (this._requiresSupportStatus(category) && !profile.hasPrioritySupportStatus()) {
      return this._result('NOT_ELIGIBLE', ruleset, [
        { code: 'NOT_SUPPORT_TARGET', message: '수급자·차상위계층·지원대상 한부모가족만 신청할 수 있는 계층입니다.' },
      ]);
    }

    const scoped = profile.resolveScope(category.applicantScope);
    if (!scoped) {
      return this._result('NEEDS_REVIEW', ruleset, [
        {
          code: 'MISSING_PROFILE_DATA',
          message: `이 공고는 ${this._scopeLabel(category.applicantScope)} 기준으로 심사하는데, 해당 소득·자산 정보가 없습니다.`,
        },
      ]);
    }

    const reasons: JudgeReason[] = [];
    const outcomes = [
      this._checkIncome(scoped, category, reasons),
      this._checkLimit({
        label: '총자산',
        value: scoped.assets,
        limit: category.totalAssetsLimit,
        overCode: 'ASSETS_OVER_LIMIT',
        withinCode: 'ASSETS_WITHIN_LIMIT',
        reasons,
      }),
      this._checkLimit({
        label: '자동차가액',
        value: profile.carValue,
        limit: category.carValueLimit,
        overCode: 'CAR_OVER_LIMIT',
        withinCode: 'CAR_WITHIN_LIMIT',
        reasons,
      }),
      this._checkAge(profile, category, reasons),
    ];

    if (outcomes.includes('BLOCKED')) {
      return this._result('NOT_ELIGIBLE', ruleset, reasons);
    }

    for (const note of this._criteria.manualCheckNotes) {
      reasons.push({ code: 'MANUAL_CHECK_REQUIRED', message: note });
    }

    // 추출이 불확실한 공고는 확정하지 않는다.
    const hasUncertainExtraction = this._criteria.uncertainNotes.length > 0;
    const needsReview = outcomes.includes('UNKNOWN') || outcomes.includes('BORDERLINE') || hasUncertainExtraction;

    return this._result(needsReview ? 'NEEDS_REVIEW' : 'LIKELY_ELIGIBLE', ruleset, reasons);
  }

  /** 소득 상한을 공고문 금액표에서 찾는다. 가구원수는 공고가 요구하는 범위를 따른다. */
  private _checkIncome(scoped: ScopedFinances, category: CategoryRule, reasons: JudgeReason[]): CheckOutcome {
    const percent = category.urbanWorkerIncomePercent ?? category.medianIncomePercent;
    const basis = category.urbanWorkerIncomePercent !== null ? 'URBAN_WORKER_AVERAGE' : 'MEDIAN_INCOME';

    if (percent === null) {
      reasons.push({ code: 'NO_RULE_DATA', message: '공고문에서 소득 기준 비율을 찾지 못했습니다.' });
      return 'UNKNOWN';
    }

    const limit = this._lookupIncomeLimit(percent, basis, scoped.householdSize);
    if (limit === null) {
      reasons.push({
        code: 'NO_RULE_DATA',
        message: `공고문 소득표에 ${scoped.householdSize}인 가구의 ${percent}% 금액이 없어 소득 비교를 건너뛰었습니다.`,
      });
      return 'UNKNOWN';
    }

    return this._compareWithBuffer({
      label: `월소득(${this._scopeLabel(category.applicantScope)} ${scoped.householdSize}인 ${percent}% 기준)`,
      value: scoped.income,
      limit,
      overCode: 'INCOME_OVER_LIMIT',
      withinCode: 'INCOME_WITHIN_LIMIT',
      reasons,
    });
  }

  private _lookupIncomeLimit(percent: number, basis: string, householdSize: number): number | null {
    const rows = this._criteria.incomeTable.filter((row: IncomeTableRow) => row.percent === percent && row.basis === basis);

    for (const row of rows) {
      const hit = row.amounts.find((entry) => entry.householdSize === householdSize);
      if (hit) {
        return hit.amount;
      }
    }

    return null;
  }

  private _checkLimit({
    label,
    value,
    limit,
    overCode,
    withinCode,
    reasons,
  }: {
    label: string;
    value: number | null;
    limit: number | null;
    overCode: JudgeReason['code'];
    withinCode: JudgeReason['code'];
    reasons: JudgeReason[];
  }): CheckOutcome {
    if (limit === null) {
      reasons.push({ code: 'NO_RULE_DATA', message: `공고문에서 ${label} 상한을 찾지 못했습니다.` });
      return 'UNKNOWN';
    }
    if (value === null) {
      reasons.push({ code: 'MISSING_PROFILE_DATA', message: `${label}을 입력하지 않아 기준을 확인하지 못했습니다.` });
      return 'UNKNOWN';
    }

    return this._compareWithBuffer({ label, value, limit, overCode, withinCode, reasons });
  }

  private _compareWithBuffer({
    label,
    value,
    limit,
    overCode,
    withinCode,
    reasons,
  }: {
    label: string;
    value: number;
    limit: number;
    overCode: JudgeReason['code'];
    withinCode: JudgeReason['code'];
    reasons: JudgeReason[];
  }): CheckOutcome {
    const buffer = limit * EligibilityEngine.BORDERLINE_RATIO;

    if (value > limit + buffer) {
      reasons.push({ code: overCode, message: `${label} ${this._won(value)}이 상한 ${this._won(limit)}을 초과합니다.` });
      return 'BLOCKED';
    }

    if (value > limit - buffer) {
      const diff = value - limit;
      const side = diff > 0 ? `${this._won(diff)} 초과` : `${this._won(-diff)} 여유`;
      reasons.push({
        code: 'BORDERLINE',
        message: `${label} ${this._won(value)}이 상한 ${this._won(limit)}과 ${side}로 경계에 있습니다. 실제 심사는 공적자료 기준이라 결과가 달라질 수 있습니다.`,
      });
      return 'BORDERLINE';
    }

    reasons.push({ code: withinCode, message: `${label} ${this._won(value)}이 상한 ${this._won(limit)} 이내입니다.` });
    return 'OK';
  }

  private _checkAge(profile: UserProfileEntity, category: CategoryRule, reasons: JudgeReason[]): CheckOutcome {
    if (category.minAge === null && category.maxAge === null) {
      return 'OK';
    }
    if ((category.minAge !== null && profile.age < category.minAge) || (category.maxAge !== null && profile.age > category.maxAge)) {
      reasons.push({
        code: 'AGE_OUT_OF_RANGE',
        message: `나이 ${profile.age}세가 기준(${category.minAge ?? ''}~${category.maxAge ?? ''}세)을 벗어납니다.`,
      });
      return 'BLOCKED';
    }

    return 'OK';
  }

  /** 프로필 계층에 맞는 기준을 고른다. 라벨이 주어지면 그것을 우선한다. */
  private _selectCategory(profile: UserProfileEntity, categoryLabel?: string): CategoryRule | null {
    if (categoryLabel) {
      return this._criteria.categories.find((category) => category.categoryLabel === categoryLabel) ?? null;
    }

    const hint = this._categoryHint(profile);
    return this._criteria.categories.find((category) => category.categoryLabel.includes(hint)) ?? null;
  }

  private _categoryHint(profile: UserProfileEntity): string {
    switch (profile.category) {
      case 'UNIVERSITY_STUDENT':
        return '대학생';
      case 'YOUTH':
        return '청년';
      case 'NEWLYWED':
        return '신혼';
      case 'SENIOR':
        return '고령';
      default:
        return '';
    }
  }

  /** 판정 근거의 출처. 재현을 위해 공고 + 추출 모델을 함께 남긴다. */
  private _rulesetVersion(notice: NoticeEntity): string {
    return `notice:${notice.sourceId}:${notice.externalId}`;
  }

  /** 추출본에 값이 없으면(구 데이터) 계층명에서 추론한다. */
  private _requiresSupportStatus(category: CategoryRule): boolean {
    if (typeof category.requiresSupportStatus === 'boolean') {
      return category.requiresSupportStatus;
    }
    return EligibilityEngine.SUPPORT_STATUS_HINTS.some((hint) => category.categoryLabel.includes(hint));
  }

  private _scopeLabel(scope: ApplicantScope): string {
    switch (scope) {
      case 'SELF':
        return '본인';
      case 'SELF_AND_PARENTS':
        return '본인+부모';
      case 'HOUSEHOLD':
        return '세대 전원';
      default:
        return '세대주 여부에 따름';
    }
  }

  private _won(amount: number): string {
    return `${Math.round(amount).toLocaleString('ko-KR')}원`;
  }

  private _result(verdict: Verdict, ruleset: string, reasons: JudgeReason[]): JudgeResult {
    return { verdict, reasons, ruleset };
  }
}
