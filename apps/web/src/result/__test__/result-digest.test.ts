import { ReasonCodeEnum, SourceIdEnum, SupplyTypeEnum, VerdictEnum, type Verdict } from '@everyone-house/domain/types';
import type { MatchView, ReasonView } from '../../api/api.types.js';
import { ResultDigest } from '../result-digest.js';

class MatchFixture {
  public static create(matchId: string, verdict: Verdict, options: { closesInDays?: number; reasons?: ReasonView[] } = {}): MatchView {
    return {
      matchId,
      noticeId: `notice-${matchId}`,
      title: `공고 ${matchId}`,
      sourceId: SourceIdEnum.SH_PORTAL,
      supplyType: SupplyTypeEnum.HAPPY_HOUSE,
      region: '서울특별시 강서구',
      closesAt: options.closesInDays === undefined ? null : new Date(Date.now() + options.closesInDays * 86_400_000).toISOString(),
      documentUrl: 'https://example.test/notice.pdf',
      verdict,
      categoryLabel: '청년',
      reasons: options.reasons ?? [],
      ruleset: '2026.1',
      passedCount: 0,
    };
  }
}

describe('ResultDigest', () => {
  const missingAssets: ReasonView = { code: ReasonCodeEnum.MISSING_PROFILE_DATA, message: '총자산을 아직 안 알려주셨어요', field: 'householdAssets' };

  test('적합 → 확인 필요 순으로 보여주고 미해당은 따로 뺀다', () => {
    const digest = ResultDigest.from(
      [MatchFixture.create('a', VerdictEnum.NOT_ELIGIBLE), MatchFixture.create('b', VerdictEnum.NEEDS_REVIEW), MatchFixture.create('c', VerdictEnum.LIKELY_ELIGIBLE)],
      12,
    );

    expect(digest.visible.map((match) => match.matchId)).toEqual(['c', 'b']);
    expect(digest.notEligible.map((match) => match.matchId)).toEqual(['a']);
  });

  test('같은 판정 안에서는 마감이 급한 순이다', () => {
    const digest = ResultDigest.from(
      [
        MatchFixture.create('late', VerdictEnum.NEEDS_REVIEW, { closesInDays: 20 }),
        MatchFixture.create('soon', VerdictEnum.NEEDS_REVIEW, { closesInDays: 2 }),
        MatchFixture.create('unknown', VerdictEnum.NEEDS_REVIEW),
      ],
      3,
    );

    expect(digest.of(VerdictEnum.NEEDS_REVIEW).map((match) => match.matchId)).toEqual(['soon', 'late', 'unknown']);
  });

  test('가장 많은 공고를 풀어 주는 미입력 항목을 찾는다', () => {
    const digest = ResultDigest.from(
      [
        MatchFixture.create('a', VerdictEnum.NEEDS_REVIEW, { reasons: [missingAssets] }),
        MatchFixture.create('b', VerdictEnum.NEEDS_REVIEW, { reasons: [missingAssets] }),
        MatchFixture.create('c', VerdictEnum.NEEDS_REVIEW, { reasons: [{ code: ReasonCodeEnum.MISSING_PROFILE_DATA, message: '자동차가액', field: 'carValue' }] }),
      ],
      3,
    );

    expect(digest.topMissingField).toEqual({ field: 'householdAssets', count: 2 });
  });

  test('미해당 공고의 미입력 사유는 집계하지 않는다 — 채워도 결과가 바뀌지 않는다', () => {
    const digest = ResultDigest.from([MatchFixture.create('a', VerdictEnum.NOT_ELIGIBLE, { reasons: [missingAssets] })], 1);

    expect(digest.topMissingField).toBeNull();
  });

  test('집계는 항상 적합 → 확인 필요 → 미해당 순서로 낸다', () => {
    const digest = ResultDigest.from([MatchFixture.create('a', VerdictEnum.NOT_ELIGIBLE), MatchFixture.create('b', VerdictEnum.LIKELY_ELIGIBLE)], 2);

    expect(digest.tally).toEqual([
      { verdict: VerdictEnum.LIKELY_ELIGIBLE, count: 1 },
      { verdict: VerdictEnum.NEEDS_REVIEW, count: 0 },
      { verdict: VerdictEnum.NOT_ELIGIBLE, count: 1 },
    ]);
  });
});
