import type { Verdict } from '@everyone-house/domain';

/** 알림 메일에 실리는 공고 한 건. */
export interface NotificationItem {
  noticeId: string;
  title: string;
  /** 'LH' · 'SH' · 'GH' */
  agencyLabel: string;
  verdict: Verdict;
  /**
   * 사유 첫 줄. 뱃지만 있는 알림은 열어 볼 이유를 주지 않는다 (HANDOFF §8).
   * 예: '소득이 기준에 아주 가까워요 (기준의 97%) 외 1건'
   */
  reasonLine: string;
  /** '마감 D-9'. 마감일을 모르면 null */
  deadlineLabel: string | null;
}

/** 하루 1~2회 보내는 묶음 알림 한 통. */
export interface NotificationDigest {
  /** '청년 · 2인 세대 · 서울 강서구' 처럼 판정 기준을 한 줄로 */
  profileSummary: string;
  items: NotificationItem[];
  /** 프로필 한 항목만 채우면 확정되는 공고 수 */
  fixableCount: number;
  /** 그 항목 이름. 없으면 유도 블록을 넣지 않는다 */
  fixableFieldLabel: string | null;
  /** 판정에 쓴 기준표 연도 */
  rulesetYear: number;
  /** 'https://example.com' — 링크 조립에 쓴다 */
  baseUrl: string;
  unsubscribeUrl: string;
}
