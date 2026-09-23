import { RangeText } from '../range-text.js';

describe('RangeText', () => {
  test('단위가 같으면 단위를 한 번만 쓴다', () => {
    expect(RangeText.money(230_000, 350_000)).toBe('23~35만원');
  });

  test('단위가 다르면 각각 읽는다', () => {
    expect(RangeText.money(5_000_000, 120_000_000)).toBe('500만원 ~ 1억 2,000만원');
  });

  test('같은 값이면 하나만', () => {
    expect(RangeText.money(1_000_000, 1_000_000)).toBe('100만원');
  });

  test('한쪽만 알면 아는 값으로, 둘 다 모르면 미상', () => {
    expect(RangeText.money(null, 1_000_000)).toBe('100만원');
    expect(RangeText.money(null, null)).toBe('미상');
  });

  test('면적과 호수', () => {
    expect(RangeText.area(17, 29)).toBe('17~29㎡');
    expect(RangeText.area(29, 29)).toBe('29㎡');
    expect(RangeText.count(42, '호')).toBe('42호');
    expect(RangeText.count(null, '호')).toBe('미상');
  });
});
