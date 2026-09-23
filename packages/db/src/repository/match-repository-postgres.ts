import { MatchEntity } from '@everyone-house/domain';
import type { CategoryOutcome, IMatchRepository, JudgeReason, MatchSchema, RankEvaluation } from '@everyone-house/domain';
import type { DataSource, QueryDeepPartialEntity, Repository } from 'typeorm';
import { MatchOrmEntity } from '../schema/match.orm-entity.js';

export class MatchRepositoryPostgres implements IMatchRepository {
  private readonly _repository: Repository<MatchOrmEntity>;

  constructor(dataSource: DataSource) {
    this._repository = dataSource.getRepository(MatchOrmEntity);
  }

  public async save(entity: MatchEntity): Promise<MatchEntity> {
    await this._repository.upsert(this._mapEntityToRow(entity), { conflictPaths: ['noticeId', 'profileId'] });
    return entity;
  }

  public async saveAll(entities: MatchEntity[]): Promise<MatchEntity[]> {
    if (entities.length === 0) {
      return [];
    }
    await this._repository.upsert(
      entities.map((entity) => this._mapEntityToRow(entity)),
      { conflictPaths: ['noticeId', 'profileId'] },
    );
    return entities;
  }

  public async findByProfileId(profileId: string): Promise<MatchEntity[]> {
    const rows = await this._repository.find({ where: { profileId }, order: { judgedAt: 'DESC' } });
    return rows.map((row) => this._mapRowToEntity(row));
  }

  private _mapEntityToRow(entity: MatchEntity): QueryDeepPartialEntity<MatchOrmEntity> {
    const match = entity.getMatch();
    return {
      matchId: match.matchId,
      noticeId: match.noticeId,
      profileId: match.profileId,
      verdict: match.verdict,
      categoryLabel: match.categoryLabel,
      reasons: match.reasons,
      ruleset: match.ruleset,
      categoryOutcomes: match.categoryOutcomes,
      bestRank: match.bestRank,
      bestPriorityRank: match.bestPriorityRank,
      rankEvaluations: match.rankEvaluations,
      judgedAt: new Date(match.judgedAt),
    };
  }

  private _mapRowToEntity(row: MatchOrmEntity): MatchEntity {
    const schema: MatchSchema = {
      matchId: row.matchId,
      noticeId: row.noticeId,
      profileId: row.profileId,
      verdict: row.verdict,
      categoryLabel: row.categoryLabel,
      reasons: (row.reasons as JudgeReason[] | null) ?? [],
      ruleset: row.ruleset,
      categoryOutcomes: (row.categoryOutcomes as CategoryOutcome[] | null) ?? [],
      bestRank: row.bestRank,
      bestPriorityRank: row.bestPriorityRank,
      rankEvaluations: (row.rankEvaluations as RankEvaluation[] | null) ?? [],
      judgedAt: row.judgedAt.toISOString(),
    };
    return MatchEntity.fromSchema(schema);
  }
}
