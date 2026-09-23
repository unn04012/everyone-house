import type { ApplicantCategory, LocationSchema } from '@everyone-house/domain/types';

/**
 * 온보딩에서 채워지는 값. `undefined` = 아직 안 물어봄, `null` = 사용자가 '모름' 을 선택.
 * 금액의 `0` 은 유효한 값이다 (무차량 등) — 셋을 절대 같게 다루지 않는다 (HANDOFF §1-1).
 */
export interface ProfileDraftValues {
  // ── Tier 0 ──
  category?: ApplicantCategory;
  personalIncome?: number | null;
  householdSize?: number;
  householdIncome?: number | null;
  livesWithParents?: boolean;
  isHomeless?: boolean;
  /** 생년월일 (YYYY-MM-DD). 나이는 저장하지 않고 판정 시점에 계산한다 */
  birthDate?: string;
  residence?: LocationSchema;

  // ── Tier 1 (비우면 NEEDS_REVIEW) ──
  householdAssets?: number | null;
  personalAssets?: number | null;
  carValue?: number | null;
  parentsIncome?: number | null;
  parentsAssets?: number | null;
}

export type ProfileField = keyof ProfileDraftValues;

/** 금액 컴포넌트가 그리는 세 상태. `data-state` 로도 내보낸다 */
export enum AnswerStateEnum {
  EMPTY = 'EMPTY', // 미응답
  VALUE = 'VALUE', // 유효한 값
  ZERO = 'ZERO', // 0원 — 유효한 답
  UNKNOWN = 'UNKNOWN', // '잘 모르겠어요' → null
}
export type AnswerState = keyof typeof AnswerStateEnum;

/** 불변 값 객체. 수정은 항상 새 인스턴스를 만든다. */
export class ProfileDraft {
  private readonly _values: ProfileDraftValues;

  get values(): ProfileDraftValues {
    return this._values;
  }

  private constructor(values: ProfileDraftValues) {
    this._values = values;
  }

  public static empty(): ProfileDraft {
    return new ProfileDraft({});
  }

  public static fromValues(values: ProfileDraftValues): ProfileDraft {
    return new ProfileDraft({ ...values });
  }

  public with<K extends ProfileField>(field: K, value: ProfileDraftValues[K]): ProfileDraft {
    const next: ProfileDraftValues = { ...this._values, [field]: value };
    // 1인 세대의 세대 소득은 본인 소득과 같다 — 따로 묻지 않고 복사한다
    if (field === 'householdSize' && value === 1) {
      next.householdIncome = next.personalIncome;
    }
    if (field === 'personalIncome' && next.householdSize === 1) {
      next.householdIncome = value as number | null;
    }
    return new ProfileDraft(next);
  }

  public get<K extends ProfileField>(field: K): ProfileDraftValues[K] {
    return this._values[field];
  }

  /** 답을 했는가. '모름'(null)도 답이다 */
  public isAnswered(field: ProfileField): boolean {
    return this._values[field] !== undefined;
  }

  /** 사용자가 '모름' 을 고른 항목인가 */
  public isUnknown(field: ProfileField): boolean {
    return this._values[field] === null;
  }

  public stateOf(field: ProfileField): AnswerState {
    const value = this._values[field];
    if (value === undefined) {
      return AnswerStateEnum.EMPTY;
    }
    if (value === null) {
      return AnswerStateEnum.UNKNOWN;
    }
    if (value === 0) {
      return AnswerStateEnum.ZERO;
    }
    return AnswerStateEnum.VALUE;
  }

  public getValues(): ProfileDraftValues {
    return { ...this._values };
  }
}
