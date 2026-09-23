import { KoreanMoney } from './korean-money.js';

/** 범위 표기. 값이 같으면 하나만, 한쪽이 없으면 '미상' 으로 둔다. */
export class RangeText {
  public static money(min: number | null, max: number | null): string {
    if (min === null && max === null) {
      return '미상';
    }
    if (min === null || max === null) {
      return KoreanMoney.format((min ?? max) as number);
    }
    return min === max ? KoreanMoney.format(min) : `${KoreanMoney.format(min)} ~ ${KoreanMoney.format(max)}`;
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
