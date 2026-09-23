import type { JudgeReason, SourceId, SupplyType, Verdict } from '@everyone-house/domain/types';
import type { ProfileDraftValues, ProfileField } from '../profile/profile-draft.js';

/**
 * 판정 사유에 붙는 수치. 카드가 '내 값 / 기준값' 과 경계선 미터를 그리는 데 쓴다.
 *
 * 도메인 JudgeReason 은 코드와 문구만 갖는다 — 이 수치는 API 가 함께 내려줘야 한다.
 * (미구현. MockApiClient 가 형태를 고정해 둔다)
 */
export interface ReasonDetail {
  /** 내 값 (원) */
  actual: number;
  /** 기준값 (원) */
  limit: number;
  /** actual / limit. BORDERLINE 미터 길이 */
  ratio: number;
}

export interface ReasonView extends JudgeReason {
  detail?: ReasonDetail;
  /** MISSING_PROFILE_DATA 일 때 사용자가 지금 채울 수 있는 필드 */
  field?: ProfileField;
}

/** 결과 목록 한 줄. 공고 + 내 판정. */
export interface MatchView {
  matchId: string;
  noticeId: string;
  title: string;
  sourceId: SourceId;
  supplyType: SupplyType;
  region: string | null;
  /** ISO 날짜. 마감 D-day 계산에 쓴다 */
  closesAt: string | null;
  /** 공고문 원문. 결과 카드에 항상 노출한다 (HANDOFF §1-7) */
  documentUrl: string;
  verdict: Verdict;
  categoryLabel: string | null;
  reasons: ReasonView[];
  /** 판정에 쓴 기준표 버전 */
  ruleset: string;
  /** 통과한 항목 수. '모든 조건 충족 · 통과 항목 4개' 표기용 */
  passedCount: number;
}

export interface ResultsResponse {
  /** 오늘 수집한 공고 수 */
  collectedToday: number;
  matches: MatchView[];
}

export interface SaveProfileResponse {
  profileId: string;
}

/** 일정 한 단계. 현재 단계는 aria-current 로도 표시한다 */
export enum ScheduleStateEnum {
  DONE = 'DONE',
  NOW = 'NOW',
  UPCOMING = 'UPCOMING',
}
export type ScheduleState = keyof typeof ScheduleStateEnum;

export interface ScheduleStep {
  name: string;
  /** 표기 그대로. '9.29 ~ 10.2' 처럼 기간일 수 있다 */
  dateText: string;
  state: ScheduleState;
}

/** 판정 근거 한 줄. 결과 목록의 사유보다 자세하다. */
export interface CriterionView extends ReasonView {
  /** '본인 월소득' 같은 기준 이름 */
  label: string;
  /** 왜 이렇게 판단했는지 */
  note: string | null;
  /** 공고문 원문 용어. 사용자가 공고문과 대조할 수 있게 둔다 */
  term: string | null;
  /** MANUAL_CHECK_REQUIRED 일 때 확인할 공고문 페이지 */
  documentPage: number | null;
}

/** 통과 항목. 기본 접힘이고 개수만 노출한다 */
export interface PassedCriterion {
  label: string;
  value: string;
}

/** 예상 순위. 자격과 별개다 */
export interface RankView {
  residenceRank: string | null;
  residenceNote: string | null;
  /** 모르면 null — 전입일 입력을 유도한다 */
  movedInBonus: string | null;
}

/** 공급 정보. 금액·면적은 원본 수치로 받고 표시만 화면에서 만든다 */
export interface SupplyView {
  supplyCount: number | null;
  areaMin: number | null;
  areaMax: number | null;
  depositMin: number | null;
  depositMax: number | null;
  rentMin: number | null;
  rentMax: number | null;
}

export interface NoticeDetailView {
  noticeId: string;
  title: string;
  sourceId: SourceId;
  supplyType: SupplyType;
  categoryLabel: string | null;
  region: string | null;
  closesAt: string | null;
  /** '10월 2일(금) 18:00 마감' 처럼 공고문 표기를 그대로 */
  closesAtText: string | null;
  verdict: Verdict;
  /** 판정 한 문장. 단정하지 않는다 */
  summary: string;
  criteria: CriterionView[];
  passed: PassedCriterion[];
  rank: RankView;
  supply: SupplyView;
  schedule: ScheduleStep[];
  documentUrl: string;
  applyUrl: string | null;
  ruleset: string;
  /** 마감 전 다시 알려주기 */
  reminderEnabled: boolean;
}

export interface IApiClient {
  fetchResults(values: ProfileDraftValues): Promise<ResultsResponse>;
  fetchNoticeDetail(noticeId: string, values: ProfileDraftValues): Promise<NoticeDetailView>;
  saveProfile(values: ProfileDraftValues): Promise<SaveProfileResponse>;
  setReminder(noticeId: string, enabled: boolean): Promise<void>;
}
