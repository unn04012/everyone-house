/**
 * 금액 표기. 저장은 원(정수), 표시는 항상 한글 단위다 (HANDOFF §1-5).
 * `3,000,000원` 이 아니라 `월 300만원` 으로 읽혀야 자릿수 오입을 막는다.
 */
export class KoreanMoney {
  private static readonly EOK = 100_000_000;
  private static readonly MAN = 10_000;

  /** 3_000_000 → '300만원', 251_000_000 → '2억 5,100만원' */
  public static format(won: number): string {
    const value = Math.max(0, Math.floor(won));
    if (value === 0) {
      return '0원';
    }
    const eok = Math.floor(value / KoreanMoney.EOK);
    const man = Math.floor((value % KoreanMoney.EOK) / KoreanMoney.MAN);
    const remainder = value % KoreanMoney.MAN;

    const parts: string[] = [];
    if (eok > 0) {
      parts.push(`${eok.toLocaleString('ko-KR')}억`);
    }
    if (man > 0) {
      parts.push(`${man.toLocaleString('ko-KR')}만`);
    }
    if (parts.length === 0) {
      return `${remainder.toLocaleString('ko-KR')}원`;
    }
    return `${parts.join(' ')}원`;
  }

  /** 월소득처럼 기간이 붙는 값. '월 300만원' */
  public static formatMonthly(won: number): string {
    return `월 ${KoreanMoney.format(won)}`;
  }

  /** 입력 문자열에서 숫자만 남긴다. 빈 문자열이면 null */
  public static parse(input: string): number | null {
    const digits = input.replace(/[^0-9]/g, '');
    return digits === '' ? null : Number(digits);
  }

  /** 입력창에 다시 그릴 콤마 표기. 3000000 → '3,000,000' */
  public static toInputText(won: number | null | undefined): string {
    return won === null || won === undefined ? '' : won.toLocaleString('ko-KR');
  }
}
