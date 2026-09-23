import { VerdictEnum, type Verdict } from '@everyone-house/domain/types';

export interface VerdictPresentation {
  /** 뱃지 문구. 단정하지 않는다 (HANDOFF §1-6) */
  label: string;
  /** .status 변형 클래스 */
  className: string;
  /** 목록 정렬 순서: 적합 → 확인 필요 → 미해당 */
  order: number;
  /** 사이드 rail 집계에 쓰는 짧은 이름 */
  shortLabel: string;
  /** 집계 점 색 (CSS 변수) */
  dotColor: string;
}

/** 판정 3단계의 표시 규칙. 색 단독으로 의미를 전달하지 않는다 (HANDOFF §6) */
export class VerdictCopy {
  private static readonly TABLE: Record<Verdict, VerdictPresentation> = {
    [VerdictEnum.LIKELY_ELIGIBLE]: {
      label: '신청 가능해 보여요',
      shortLabel: '신청 가능',
      className: 'status--ok',
      order: 0,
      dotColor: 'var(--color-ok)',
    },
    [VerdictEnum.NEEDS_REVIEW]: {
      label: '확인이 필요해요',
      shortLabel: '확인 필요',
      className: 'status--review',
      order: 1,
      dotColor: 'var(--color-review)',
    },
    [VerdictEnum.NOT_ELIGIBLE]: {
      label: '조건에 안 맞아요',
      shortLabel: '안 맞음',
      className: 'status--no',
      order: 2,
      dotColor: 'var(--color-no)',
    },
  };

  public static of(verdict: Verdict): VerdictPresentation {
    return VerdictCopy.TABLE[verdict];
  }

  /** 정렬용 가중치 */
  public static order(verdict: Verdict): number {
    return VerdictCopy.TABLE[verdict].order;
  }
}
