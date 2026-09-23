import type { CategoryRule, ICriteriaRepository, IncomeTableRow, NoticeCriteriaRecord, RankRule } from '@everyone-house/domain';
import type { DataSource, Repository } from 'typeorm';
import { NoticeCriteriaOrmEntity } from '../schema/notice-criteria.orm-entity.js';

export class CriteriaRepositoryPostgres implements ICriteriaRepository {
  private readonly _repository: Repository<NoticeCriteriaOrmEntity>;

  constructor(dataSource: DataSource) {
    this._repository = dataSource.getRepository(NoticeCriteriaOrmEntity);
  }

  public async findByNoticeId(noticeId: string): Promise<NoticeCriteriaRecord | null> {
    const row = await this._repository.findOneBy({ noticeId });
    return row ? this._mapRowToRecord(row) : null;
  }

  public async save(record: NoticeCriteriaRecord): Promise<NoticeCriteriaRecord> {
    await this._repository.upsert(
      {
        noticeId: record.noticeId,
        applicationStartDate: record.applicationStartDate,
        applicationEndDate: record.applicationEndDate,
        announcementDate: record.announcementDate,
        categories: record.categories,
        ranks: record.ranks,
        incomeTable: record.incomeTable,
        manualCheckNotes: record.manualCheckNotes,
        uncertainNotes: record.uncertainNotes,
        model: record.model,
        sourceFileName: record.sourceFileName,
        extractedAt: new Date(record.extractedAt),
      },
      { conflictPaths: ['noticeId'] },
    );

    return record;
  }

  private _mapRowToRecord(row: NoticeCriteriaOrmEntity): NoticeCriteriaRecord {
    return {
      noticeId: row.noticeId,
      applicationStartDate: row.applicationStartDate,
      applicationEndDate: row.applicationEndDate,
      announcementDate: row.announcementDate,
      categories: (row.categories as CategoryRule[] | null) ?? [],
      ranks: (row.ranks as RankRule[] | null) ?? [],
      incomeTable: (row.incomeTable as IncomeTableRow[] | null) ?? [],
      manualCheckNotes: (row.manualCheckNotes as string[] | null) ?? [],
      uncertainNotes: (row.uncertainNotes as string[] | null) ?? [],
      model: row.model,
      sourceFileName: row.sourceFileName,
      extractedAt: row.extractedAt.toISOString(),
    };
  }
}
