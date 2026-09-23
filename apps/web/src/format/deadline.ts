/** 마감일 표기. 남은 날짜 계산만 하고 판정에는 관여하지 않는다. */
export class Deadline {
  private static readonly DAY_MS = 24 * 60 * 60 * 1000;

  /** 'D-5' / '오늘 마감' / '마감됨' / null(마감일 미상) */
  public static label(closesAt: string | null, now: Date = new Date()): string | null {
    if (!closesAt) {
      return null;
    }
    const closes = new Date(closesAt);
    if (Number.isNaN(closes.getTime())) {
      return null;
    }
    const days = Math.ceil((closes.getTime() - now.getTime()) / Deadline.DAY_MS);
    if (days < 0) {
      return '마감됨';
    }
    if (days === 0) {
      return '오늘 마감';
    }
    return `마감 D-${days}`;
  }

  /** 남은 일수. 마감일을 모르면 null */
  public static daysLeft(closesAt: string | null, now: Date = new Date()): number | null {
    if (!closesAt) {
      return null;
    }
    const closes = new Date(closesAt);
    if (Number.isNaN(closes.getTime())) {
      return null;
    }
    return Math.ceil((closes.getTime() - now.getTime()) / Deadline.DAY_MS);
  }

  /** 숫자로 크게 그릴 때 쓰는 짧은 표기. 'D-5' · '오늘' · '마감' */
  public static shortLabel(closesAt: string | null, now: Date = new Date()): string | null {
    const days = Deadline.daysLeft(closesAt, now);
    if (days === null) {
      return null;
    }
    if (days < 0) {
      return '마감';
    }
    return days === 0 ? '오늘' : `D-${days}`;
  }

  /** 사흘 안쪽이면 강조한다 */
  public static isUrgent(closesAt: string | null, now: Date = new Date()): boolean {
    if (!closesAt) {
      return false;
    }
    const days = Math.ceil((new Date(closesAt).getTime() - now.getTime()) / Deadline.DAY_MS);
    return days >= 0 && days <= 3;
  }
}
