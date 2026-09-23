import { ReasonCodeEnum, SourceIdEnum, SupplyTypeEnum, VerdictEnum } from '@everyone-house/domain/types';
import type { ProfileDraftValues } from '../profile/profile-draft.js';
import { ScheduleStateEnum, type IApiClient, type MatchView, type NoticeDetailView, type ResultsResponse, type SaveProfileResponse } from './api.types.js';

/**
 * apps/api 가 아직 없어서 쓰는 목. 화면이 기대하는 응답 형태를 고정하는 계약 역할도 한다.
 * 프로필에 총자산이 들어오면 그 사유가 사라지는 정도의 반응만 흉내 낸다.
 */
export class MockApiClient implements IApiClient {
  private static readonly RULESET = '2026.1';

  public async fetchResults(values: ProfileDraftValues): Promise<ResultsResponse> {
    await MockApiClient._delay();
    const knowsAssets = values.householdAssets !== undefined && values.householdAssets !== null;
    return {
      collectedToday: 12,
      matches: MockApiClient._matches(knowsAssets),
    };
  }

  public async fetchNoticeDetail(noticeId: string, values: ProfileDraftValues): Promise<NoticeDetailView> {
    await MockApiClient._delay();
    const knowsAssets = values.householdAssets !== undefined && values.householdAssets !== null;
    const match = MockApiClient._matches(knowsAssets).find((item) => item.noticeId === noticeId) ?? MockApiClient._matches(knowsAssets)[0];
    return MockApiClient._detail(match, knowsAssets);
  }

  public async saveProfile(_values: ProfileDraftValues): Promise<SaveProfileResponse> {
    await MockApiClient._delay();
    return { profileId: 'mock-profile' };
  }

  public async setReminder(_noticeId: string, _enabled: boolean): Promise<void> {
    await MockApiClient._delay();
  }

  private static _detail(match: MatchView, knowsAssets: boolean): NoticeDetailView {
    const criteria: NoticeDetailView['criteria'] = [
      {
        code: ReasonCodeEnum.BORDERLINE,
        message: '소득이 기준에 아주 가까워요',
        label: '본인 월소득',
        detail: { actual: 4_450_000, limit: 4_580_000, ratio: 0.97 },
        note: '기준의 97%예요. 기준 ±5% 안은 실제 심사(공적자료) 결과가 달라질 수 있어 확정하지 않아요.',
        term: '공고문 용어: 1인 가구 도시근로자 월평균소득 100% 이하 (본인 기준)',
        documentPage: null,
      },
      {
        code: ReasonCodeEnum.MANUAL_CHECK_REQUIRED,
        message: '공고문에만 있는 조건이 있어요',
        label: '공고문에만 있는 조건',
        note: '‘대학 재학생 제외’ 등 자동으로 판정하지 못한 조건이 원문에 있어요.',
        term: null,
        documentPage: 4,
      },
    ];

    if (!knowsAssets) {
      criteria.splice(1, 0, {
        code: ReasonCodeEnum.MISSING_PROFILE_DATA,
        message: '총자산을 알려주시면 이 공고 판정이 바로 확정돼요.',
        label: '총자산',
        field: 'householdAssets',
        detail: { actual: 0, limit: 251_000_000, ratio: 0 },
        note: null,
        term: null,
        documentPage: null,
      });
    }

    return {
      noticeId: match.noticeId,
      title: match.title,
      sourceId: match.sourceId,
      supplyType: match.supplyType,
      categoryLabel: match.categoryLabel,
      region: match.region,
      closesAt: match.closesAt,
      closesAtText: '10월 2일(금) 18:00 마감',
      verdict: match.verdict,
      summary: knowsAssets
        ? '6개 기준 중 5개는 통과해 보여요. 소득이 기준에 아주 가까워 확정하지 않았어요.'
        : '6개 기준 중 4개는 통과해 보여요. 소득이 기준에 아주 가깝고, 총자산을 아직 모르는 상태라 확정하지 않았어요.',
      criteria,
      passed: [
        { label: '나이 (19~39세)', value: '31세' },
        { label: '무주택', value: '무주택' },
        { label: '거주지 (서울)', value: '강서구' },
        { label: '자동차 (4,542만원 이하)', value: '0원 · 무차량' },
      ],
      rank: { residenceRank: '1순위 예상', residenceNote: '공급 자치구(강서) 거주', movedInBonus: null },
      supply: { supplyCount: 42, areaMin: 17, areaMax: 29, depositMin: 1_000_000, depositMax: 1_000_000, rentMin: 230_000, rentMax: 350_000 },
      schedule: [
        { name: '공고', dateText: '9.15', state: ScheduleStateEnum.DONE },
        { name: '접수', dateText: '9.29 ~ 10.2', state: ScheduleStateEnum.NOW },
        { name: '서류 대상 발표', dateText: '11.13', state: ScheduleStateEnum.UPCOMING },
        { name: '당첨자 발표', dateText: '2027.1.8', state: ScheduleStateEnum.UPCOMING },
      ],
      documentUrl: match.documentUrl,
      applyUrl: 'https://apply.lh.or.kr/',
      ruleset: match.ruleset,
      reminderEnabled: true,
    };
  }

  private static _delay(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 220);
    });
  }

  private static _inDays(days: number): string {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  private static _matches(knowsAssets: boolean): MatchView[] {
    const missingAssets: MatchView['reasons'] = knowsAssets
      ? [{ code: ReasonCodeEnum.ASSETS_WITHIN_LIMIT, message: '총자산이 기준 안에 들어와요', detail: { actual: 96_000_000, limit: 251_000_000, ratio: 0.38 } }]
      : [{ code: ReasonCodeEnum.MISSING_PROFILE_DATA, message: '총자산을 아직 안 알려주셨어요', field: 'householdAssets' }];

    return [
      {
        matchId: 'm-1',
        noticeId: 'n-1',
        title: '행복주택 청년 계층 입주자 모집 (강서)',
        sourceId: SourceIdEnum.SH_PORTAL,
        supplyType: SupplyTypeEnum.HAPPY_HOUSE,
        region: '서울특별시 강서구',
        closesAt: MockApiClient._inDays(5),
        documentUrl: 'https://www.i-sh.co.kr/',
        verdict: VerdictEnum.LIKELY_ELIGIBLE,
        categoryLabel: '청년',
        ruleset: MockApiClient.RULESET,
        passedCount: 3,
        reasons: [
          { code: ReasonCodeEnum.INCOME_WITHIN_LIMIT, message: '소득이 기준 안에 들어와요', detail: { actual: 3_000_000, limit: 4_580_000, ratio: 0.66 } },
          { code: ReasonCodeEnum.CAR_WITHIN_LIMIT, message: '자동차가액이 기준 안에 들어와요' },
          { code: ReasonCodeEnum.ASSETS_WITHIN_LIMIT, message: '총자산이 기준 안에 들어와요' },
        ],
      },
      {
        matchId: 'm-2',
        noticeId: 'n-2',
        title: '통합공공임대 신혼·신생아 우선공급',
        sourceId: SourceIdEnum.MYHOME_API,
        supplyType: SupplyTypeEnum.INTEGRATED_PUBLIC,
        region: '경기도 화성시',
        closesAt: MockApiClient._inDays(9),
        documentUrl: 'https://apply.lh.or.kr/',
        verdict: VerdictEnum.NEEDS_REVIEW,
        categoryLabel: '신혼부부',
        ruleset: MockApiClient.RULESET,
        passedCount: 2,
        reasons: [{ code: ReasonCodeEnum.BORDERLINE, message: '소득이 기준에 아주 가까워요', detail: { actual: 4_450_000, limit: 4_580_000, ratio: 0.97 } }, ...missingAssets],
      },
      {
        matchId: 'm-3',
        noticeId: 'n-3',
        title: '2026년 1차 청년 매입임대주택 입주자 모집',
        sourceId: SourceIdEnum.MYHOME_API,
        supplyType: SupplyTypeEnum.PURCHASED_RENTAL,
        region: '서울특별시',
        closesAt: MockApiClient._inDays(14),
        documentUrl: 'https://apply.lh.or.kr/',
        verdict: VerdictEnum.NEEDS_REVIEW,
        categoryLabel: '청년',
        ruleset: MockApiClient.RULESET,
        passedCount: 3,
        reasons: [{ code: ReasonCodeEnum.MANUAL_CHECK_REQUIRED, message: '공고문에만 있는 조건이 있어요' }, ...missingAssets],
      },
      {
        matchId: 'm-4',
        noticeId: 'n-4',
        title: '장기전세주택 재공급 (송파)',
        sourceId: SourceIdEnum.SH_PORTAL,
        supplyType: SupplyTypeEnum.LONG_TERM_JEONSE,
        region: '서울특별시 송파구',
        closesAt: MockApiClient._inDays(3),
        documentUrl: 'https://www.i-sh.co.kr/',
        verdict: VerdictEnum.NOT_ELIGIBLE,
        categoryLabel: '일반',
        ruleset: MockApiClient.RULESET,
        passedCount: 1,
        reasons: [{ code: ReasonCodeEnum.INCOME_OVER_LIMIT, message: '월소득이 기준을 넘어요', detail: { actual: 3_000_000, limit: 2_740_000, ratio: 1.09 } }],
      },
      {
        matchId: 'm-5',
        noticeId: 'n-5',
        title: '고령자 전용 국민임대 추가 모집',
        sourceId: SourceIdEnum.GH_APPLY,
        supplyType: SupplyTypeEnum.NATIONAL_RENTAL,
        region: '경기도 수원시',
        closesAt: MockApiClient._inDays(7),
        documentUrl: 'https://apply.gh.or.kr/',
        verdict: VerdictEnum.NOT_ELIGIBLE,
        categoryLabel: '고령자',
        ruleset: MockApiClient.RULESET,
        passedCount: 2,
        reasons: [{ code: ReasonCodeEnum.AGE_OUT_OF_RANGE, message: '이 공고는 만 65세 이상만 신청할 수 있어요' }],
      },
    ];
  }
}
