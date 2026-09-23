import { EligibilityEngine, MatchEntity, RankingEngine, UserProfileEntity } from '@everyone-house/domain';
import type { CategoryOutcome, ICriteriaRepository, IMatchRepository, INoticeRepository, IProfileRepository, NoticeCriteria, NoticeEntity } from '@everyone-house/domain';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Symbols } from '../symbols.js';

export interface MatchingResult {
  judged: number;
  worthNotifying: number;
  skipped: number;
}

/**
 * 판정. 분석이 끝난 공고를 프로필과 대조해 matches 에 남긴다.
 *
 * LLM 을 쓰지 않는다 — 추출은 공고당 1회지만 판정은 사용자 × 공고 × 재판정 만큼
 * 돌기 때문에, 여기에 모델을 끼우면 비용이 곱해진다. 순수 계산이라 무료이고,
 * 같은 입력이면 항상 같은 결과가 나온다.
 */
@Injectable()
export class MatchingService {
  private readonly _logger = new Logger(MatchingService.name);

  constructor(
    @Inject(Symbols.noticeRepository) private readonly _noticeRepository: INoticeRepository,
    @Inject(Symbols.criteriaRepository) private readonly _criteriaRepository: ICriteriaRepository,
    @Inject(Symbols.matchRepository) private readonly _matchRepository: IMatchRepository,
    @Inject(Symbols.profileRepository) private readonly _profileRepository: IProfileRepository,
  ) {}

  public async runMatching(): Promise<MatchingResult> {
    const profiles = await this._profileRepository.findAll();
    const notices = await this._noticeRepository.findAnalyzed();

    this._logger.log(`판정 시작 — 공고 ${notices.length}건 × 프로필 ${profiles.length}개`);

    const result: MatchingResult = { judged: 0, worthNotifying: 0, skipped: 0 };
    const matches: MatchEntity[] = [];

    const asOf = new Date();

    for (const notice of notices) {
      // 마감된 공고는 알림 대상이 아니다. 판정 결과를 남겨도 쓸 곳이 없다.
      if (!notice.isStillApplicable(asOf)) {
        result.skipped += 1;
        continue;
      }

      const criteria = await this._criteriaRepository.findByNoticeId(notice.noticeId);

      // 분석은 끝났다고 표시됐는데 기준이 없으면 판정할 수 없다.
      if (!criteria) {
        this._logger.warn(`${notice.externalId}: 추출 기준이 없어 판정을 건너뜁니다`);
        result.skipped += 1;
        continue;
      }

      for (const profile of profiles) {
        const match = this._judge(notice, profile, criteria);
        matches.push(match);
        result.judged += 1;
        if (match.isWorthNotifying()) {
          result.worthNotifying += 1;
        }
      }
    }

    await this._matchRepository.saveAll(matches);
    this._logger.log(`판정 완료 — ${result.judged}건 (알림 가치 ${result.worthNotifying}건, 건너뜀 ${result.skipped}건)`);

    return result;
  }

  private _judge(notice: NoticeEntity, profile: UserProfileEntity, criteria: NoticeCriteria & { model: string }): MatchEntity {
    const eligibility = new EligibilityEngine(criteria);
    const ranking = new RankingEngine(criteria);

    // 공고 하나에 계층이 여럿이면(청년 1·2·3순위처럼) 각각 판정하고 가장 유리한 것을 쓴다.
    const categoryOutcomes: CategoryOutcome[] = criteria.categories.map((category) => {
      const judged = eligibility.judge(profile, notice, category.categoryLabel);
      return { categoryLabel: category.categoryLabel, verdict: judged.verdict, reasons: judged.reasons };
    });

    return MatchEntity.create({
      noticeId: notice.noticeId,
      profileId: profile.profileId,
      ruleset: `notice:${notice.sourceId}:${notice.externalId}@${criteria.model}`,
      categoryOutcomes,
      ranking: ranking.evaluate(profile),
      judgedAt: new Date(),
    });
  }
}
