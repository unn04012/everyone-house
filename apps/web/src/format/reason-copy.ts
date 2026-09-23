import { ReasonCodeEnum, type ReasonCode } from '@everyone-house/domain/types';
import type { ReasonView } from '../api/api.types.js';
import { KoreanMoney } from './korean-money.js';

export enum ReasonToneEnum {
  PASS = 'PASS', // 통과한 항목
  BLOCKING = 'BLOCKING', // 기준을 넘어 미해당
  MISSING = 'MISSING', // 사용자가 지금 해결 가능 — 시각적으로 구분한다
  BORDERLINE = 'BORDERLINE', // 경계선. 미터로 보여준다
  SYSTEM = 'SYSTEM', // 시스템 한계 (기준표 없음 / 공고문 확인 필요)
}
export type ReasonTone = keyof typeof ReasonToneEnum;

interface ReasonRule {
  tone: ReasonTone;
  /** 비교 표시에 붙는 이름. null 이면 수치 비교를 그리지 않는다 */
  subject: string | null;
  headline: (reason: ReasonView) => string;
  /** 공고문 링크를 강조할 사유인가 */
  emphasizeDocument?: boolean;
}

/**
 * 사유 코드 → 사람이 읽는 문구. 엔진은 코드를 내고 문구는 프론트가 만든다 (HANDOFF §4).
 * 뱃지만 단독으로 뜨는 카드는 없다 — 판정에는 항상 사유가 따라붙는다.
 */
export class ReasonCopy {
  private static readonly TABLE: Record<ReasonCode, ReasonRule> = {
    [ReasonCodeEnum.INCOME_WITHIN_LIMIT]: {
      tone: ReasonToneEnum.PASS,
      subject: '소득',
      headline: () => '소득이 기준 안에 들어와요',
    },
    [ReasonCodeEnum.INCOME_OVER_LIMIT]: {
      tone: ReasonToneEnum.BLOCKING,
      subject: '소득',
      headline: (reason) => (reason.detail ? `월소득이 기준(${KoreanMoney.format(reason.detail.limit)})을 넘어요` : '월소득이 기준을 넘어요'),
    },
    [ReasonCodeEnum.ASSETS_WITHIN_LIMIT]: {
      tone: ReasonToneEnum.PASS,
      subject: '총자산',
      headline: () => '총자산이 기준 안에 들어와요',
    },
    [ReasonCodeEnum.ASSETS_OVER_LIMIT]: {
      tone: ReasonToneEnum.BLOCKING,
      subject: '총자산',
      headline: (reason) => (reason.detail ? `총자산이 기준(${KoreanMoney.format(reason.detail.limit)})을 넘어요` : '총자산이 기준을 넘어요'),
    },
    [ReasonCodeEnum.CAR_WITHIN_LIMIT]: {
      tone: ReasonToneEnum.PASS,
      subject: '자동차가액',
      headline: () => '자동차가액이 기준 안에 들어와요',
    },
    [ReasonCodeEnum.CAR_OVER_LIMIT]: {
      tone: ReasonToneEnum.BLOCKING,
      subject: '자동차가액',
      headline: (reason) => (reason.detail ? `자동차가액이 기준(${KoreanMoney.format(reason.detail.limit)})을 넘어요` : '자동차가액이 기준을 넘어요'),
    },
    [ReasonCodeEnum.NOT_HOMELESS]: {
      tone: ReasonToneEnum.BLOCKING,
      subject: null,
      headline: () => '세대에 주택이 있어 무주택 요건에 안 맞아요',
    },
    [ReasonCodeEnum.NOT_SUPPORT_TARGET]: {
      tone: ReasonToneEnum.BLOCKING,
      subject: null,
      headline: () => '수급자·차상위·한부모 가구만 신청할 수 있는 공고예요',
    },
    [ReasonCodeEnum.NO_RULE_DATA]: {
      tone: ReasonToneEnum.SYSTEM,
      subject: null,
      headline: () => '이 유형은 아직 기준표가 없어요',
      emphasizeDocument: true,
    },
    [ReasonCodeEnum.MISSING_PROFILE_DATA]: {
      tone: ReasonToneEnum.MISSING,
      subject: null,
      headline: (reason) => reason.message,
    },
    [ReasonCodeEnum.BORDERLINE]: {
      tone: ReasonToneEnum.BORDERLINE,
      subject: '소득',
      headline: (reason) => (reason.detail ? `기준에 아주 가까워요 (기준의 ${Math.round(reason.detail.ratio * 100)}%)` : '기준에 아주 가까워요'),
    },
    [ReasonCodeEnum.AGE_OUT_OF_RANGE]: {
      tone: ReasonToneEnum.BLOCKING,
      subject: null,
      headline: (reason) => reason.message,
    },
    [ReasonCodeEnum.MANUAL_CHECK_REQUIRED]: {
      tone: ReasonToneEnum.SYSTEM,
      subject: null,
      headline: () => '공고문에만 있는 조건이 있어요',
      emphasizeDocument: true,
    },
  };

  public static toneOf(code: ReasonCode): ReasonTone {
    return ReasonCopy.TABLE[code].tone;
  }

  public static headlineOf(reason: ReasonView): string {
    const rule = ReasonCopy.TABLE[reason.code];
    return rule ? rule.headline(reason) : reason.message;
  }

  public static subjectOf(code: ReasonCode): string | null {
    return ReasonCopy.TABLE[code]?.subject ?? null;
  }

  public static emphasizesDocument(code: ReasonCode): boolean {
    return ReasonCopy.TABLE[code]?.emphasizeDocument === true;
  }

  /** 카드 본문에 접지 않고 바로 보여줄 사유인가. 통과 항목은 접는다 */
  public static isHighlighted(code: ReasonCode): boolean {
    return ReasonCopy.toneOf(code) !== ReasonToneEnum.PASS;
  }
}
