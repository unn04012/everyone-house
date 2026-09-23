import { ReasonCodeEnum } from '@everyone-house/domain/types';
import { ReasonCopy, ReasonToneEnum } from '../reason-copy.js';

describe('ReasonCopy', () => {
  test('모든 사유 코드에 문구가 있다 — 뱃지만 뜨는 카드는 없다', () => {
    for (const code of Object.values(ReasonCodeEnum)) {
      expect(ReasonCopy.headlineOf({ code, message: '원문' })).toBeTruthy();
    }
  });

  test('기준값을 한글 단위로 넣는다', () => {
    const headline = ReasonCopy.headlineOf({
      code: ReasonCodeEnum.INCOME_OVER_LIMIT,
      message: '초과',
      detail: { actual: 3_000_000, limit: 2_740_000, ratio: 1.09 },
    });

    expect(headline).toBe('월소득이 기준(274만원)을 넘어요');
  });

  test('경계선은 비율을 퍼센트로 알려준다', () => {
    const headline = ReasonCopy.headlineOf({
      code: ReasonCodeEnum.BORDERLINE,
      message: '경계',
      detail: { actual: 4_450_000, limit: 4_580_000, ratio: 0.97 },
    });

    expect(headline).toBe('기준에 아주 가까워요 (기준의 97%)');
  });

  test('미입력만 사용자가 지금 해결 가능한 톤이다', () => {
    expect(ReasonCopy.toneOf(ReasonCodeEnum.MISSING_PROFILE_DATA)).toBe(ReasonToneEnum.MISSING);
    expect(ReasonCopy.toneOf(ReasonCodeEnum.INCOME_OVER_LIMIT)).toBe(ReasonToneEnum.BLOCKING);
  });

  test('통과 사유는 접고 나머지는 펼친다', () => {
    expect(ReasonCopy.isHighlighted(ReasonCodeEnum.INCOME_WITHIN_LIMIT)).toBe(false);
    expect(ReasonCopy.isHighlighted(ReasonCodeEnum.BORDERLINE)).toBe(true);
  });
});
