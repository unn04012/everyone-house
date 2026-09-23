/** 조사 처리. '세대 총자산을(를)' 같은 표기를 쓰지 않기 위한 최소 규칙. */
export class Josa {
  private static readonly PAIRS: Record<string, [string, string]> = {
    '을/를': ['을', '를'],
    '이/가': ['이', '가'],
    '은/는': ['은', '는'],
    '과/와': ['과', '와'],
  };

  /** 받침이 있으면 앞쪽, 없으면 뒤쪽 조사를 붙인다 */
  public static attach(word: string, pair: keyof typeof Josa.PAIRS | string): string {
    const [withBatchim, withoutBatchim] = Josa.PAIRS[pair] ?? ['을', '를'];
    return `${word}${Josa._hasBatchim(word) ? withBatchim : withoutBatchim}`;
  }

  private static _hasBatchim(word: string): boolean {
    const last = word.trim().at(-1);
    if (!last) {
      return false;
    }
    const code = last.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) {
      return false; // 한글 음절이 아니면 판단하지 않는다
    }
    return (code - 0xac00) % 28 !== 0;
  }
}
