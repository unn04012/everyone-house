import { NoticeEntity } from '@everyone-house/domain';
import type { INoticeRepository, NoticeAttachmentSchema, NoticeSchema, SourceId } from '@everyone-house/domain';
import type { DataSource, QueryDeepPartialEntity, Repository } from 'typeorm';
import { NoticeOrmEntity } from '../schema/notice.orm-entity.js';

export class NoticeRepositoryPostgres implements INoticeRepository {
  private readonly _repository: Repository<NoticeOrmEntity>;

  constructor(dataSource: DataSource) {
    this._repository = dataSource.getRepository(NoticeOrmEntity);
  }

  public async findByExternalId(sourceId: SourceId, externalId: string): Promise<NoticeEntity | null> {
    const row = await this._repository.findOneBy({ sourceId, externalId });
    return row ? this._mapRowToEntity(row) : null;
  }

  public async findSeenExternalIds(sourceId: SourceId): Promise<Set<string>> {
    const rows = await this._repository.find({ where: { sourceId }, select: { externalId: true } });
    return new Set(rows.map((row) => row.externalId));
  }

  public async save(entity: NoticeEntity): Promise<NoticeEntity> {
    await this._repository.upsert(this._mapEntityToRow(entity), { conflictPaths: ['sourceId', 'externalId'] });
    return entity;
  }

  public async saveAll(entities: NoticeEntity[]): Promise<NoticeEntity[]> {
    if (entities.length === 0) {
      return [];
    }
    await this._repository.upsert(
      entities.map((entity) => this._mapEntityToRow(entity)),
      { conflictPaths: ['sourceId', 'externalId'] },
    );
    return entities;
  }

  private _mapEntityToRow(entity: NoticeEntity): QueryDeepPartialEntity<NoticeOrmEntity> {
    const notice = entity.getNotice();
    return {
      noticeId: notice.noticeId,
      sourceId: notice.sourceId,
      externalId: notice.externalId,
      supplyType: notice.supplyType,
      status: notice.status,
      title: notice.title,
      region: notice.region,
      detailUrl: notice.detailUrl,
      postedAt: notice.postedAt,
      closesAt: notice.closesAt,
      // null 은 QueryDeepPartialEntity<unknown> 에 없다. undefined 면 컬럼을 건드리지 않는다(원본은 지우지 않는다).
      rawJson: notice.rawJson ?? undefined,
      // 빈 배열로 덮어쓰면 이미 수집해 둔 첨부가 지워진다 (신규가 아닌 공고는 첨부를 다시 긁지 않는다).
      attachments: notice.attachments.length > 0 ? notice.attachments : undefined,
    };
  }

  private _mapRowToEntity(row: NoticeOrmEntity): NoticeEntity {
    const schema: NoticeSchema = {
      noticeId: row.noticeId,
      sourceId: row.sourceId,
      externalId: row.externalId,
      supplyType: row.supplyType,
      status: row.status,
      title: row.title,
      region: row.region,
      detailUrl: row.detailUrl,
      postedAt: row.postedAt,
      closesAt: row.closesAt,
      rawJson: (row.rawJson as Record<string, unknown> | null) ?? null,
      attachments: (row.attachments as NoticeAttachmentSchema[] | null) ?? [],
    };
    return NoticeEntity.fromSchema(schema);
  }
}
