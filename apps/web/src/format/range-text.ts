import { KoreanMoney } from './korean-money.js';

/** 범위 표기. 값이 같으면 하나만, 한쪽이 없으면 '미상' 으로 둔다. */
export class RangeText {
  private static readonly MAN = 10_000;
  private static readonly EOK = 100_000_000;

  public static money(min: number | null, max: number | null): string {
    if (min === null && max === null) {
      return '미상';
    }
    if (min === null || max === null) {
      return KoreanMoney.format((min ?? max) as number);
    }
    if (min === max) {
      return KoreanMoney.format(min);
    }
    // 단위가 같으면 한 번만 쓴다: '23만원 ~ 35만원' 이 아니라 '23~35만원'
    if (RangeText._isWholeMan(min) && RangeText._isWholeMan(max)) {
      return `${(min / RangeText.MAN).toLocaleString('ko-KR')}~${(max / RangeText.MAN).toLocaleString('ko-KR')}만원`;
    }
    return `${KoreanMoney.format(min)} ~ ${KoreanMoney.format(max)}`;
  }

  /** 억 미만이면서 만원 단위로 떨어지는가 */
  private static _isWholeMan(won: number): boolean {
    return won > 0 && won < RangeText.EOK && won % RangeText.MAN === 0;
  }

  /** 전용면적. 제곱미터 단위 */
  public static area(min: number | null, max: number | null): string {
    if (min === null && max === null) {
      return '미상';
    }
    if (min === null || max === null) {
      return `${min ?? max}㎡`;
    }
    return min === max ? `${min}㎡` : `${min}~${max}㎡`;
  }

  public static count(value: number | null, unit: string): string {
    return value === null ? '미상' : `${value.toLocaleString('ko-KR')}${unit}`;
  }
}
