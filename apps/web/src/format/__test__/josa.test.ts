import { Josa } from '../josa.js';

describe('Josa', () => {
  test('받침이 있으면 을, 없으면 를', () => {
    expect(Josa.attach('세대 총자산', '을/를')).toBe('세대 총자산을');
    expect(Josa.attach('자동차가액', '을/를')).toBe('자동차가액을');
    expect(Josa.attach('거주지', '을/를')).toBe('거주지를');
  });

  test('한글이 아니면 뒤쪽 조사를 쓴다', () => {
    expect(Josa.attach('PDF', '이/가')).toBe('PDF가');
  });
});
