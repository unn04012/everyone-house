import { KoreanMoney } from '../korean-money.js';

describe('KoreanMoney', () => {
  test('만·억 단위로 읽는다', () => {
    expect(KoreanMoney.format(3_000_000)).toBe('300만원');
    expect(KoreanMoney.format(251_000_000)).toBe('2억 5,100만원');
    expect(KoreanMoney.format(100_000_000)).toBe('1억원');
  });

  test('0원은 0원으로 읽는다 — 미입력과 다르다', () => {
    expect(KoreanMoney.format(0)).toBe('0원');
  });

  test('만원 미만은 원 단위로 남긴다', () => {
    expect(KoreanMoney.format(5_300)).toBe('5,300원');
  });

  test('월 단위 값에는 기간을 붙인다', () => {
    expect(KoreanMoney.formatMonthly(4_450_000)).toBe('월 445만원');
  });

  test('빈 입력은 null — 0 으로 바꾸지 않는다', () => {
    expect(KoreanMoney.parse('')).toBeNull();
    expect(KoreanMoney.parse('원')).toBeNull();
    expect(KoreanMoney.parse('3,000,000')).toBe(3_000_000);
    expect(KoreanMoney.parse('0')).toBe(0);
  });

  test('입력창 표기는 미입력과 0 을 구분한다', () => {
    expect(KoreanMoney.toInputText(null)).toBe('');
    expect(KoreanMoney.toInputText(undefined)).toBe('');
    expect(KoreanMoney.toInputText(0)).toBe('0');
  });
});
