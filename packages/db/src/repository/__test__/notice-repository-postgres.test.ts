import { NoticeEntity } from '@everyone-house/domain';
import { DataSource } from 'typeorm';
import { DataSourceOptionsFactory } from '../../data-source-options.js';
import { NoticeRepositoryPostgres } from '../notice-repository-postgres.js';

/**
 * 실제 Postgres 를 쓴다 (`npm run db:up`). DATABASE_URL 이 없으면 전체를 건너뛴다.
 * dedupe 는 DB 유니크 제약에 기대므로 인메모리 목으로는 검증이 되지 않는다.
 */
const databaseUrl = process.env.DATABASE_URL;
const describeIfDb = databaseUrl ? describe : describe.skip;

describeIfDb('NoticeRepositoryPostgres', () => {
  let dataSource: DataSource;
  let noticeRepository: NoticeRepositoryPostgres;

  const buildNotice = (externalId: string, title = 'SH 청년안심주택 모집공고') =>
    NoticeEntity.create({
      sourceId: 'SH_PORTAL',
      externalId,
      supplyType: 'YOUTH_SAFE_HOUSE',
      status: 'OPEN',
      title,
      region: '서울특별시',
      detailUrl: 'https://example-sh.invalid/detail/path/view.do?seq=1',
      postedAt: new Date('2026-09-20T00:00:00Z'),
      rawJson: { cp: 1, supplyType: 'publicLease' },
    });

  beforeAll(async () => {
    dataSource = new DataSource(DataSourceOptionsFactory.create({ url: databaseUrl }));
    await dataSource.initialize();
    noticeRepository = new NoticeRepositoryPostgres(dataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.query('delete from notices');
  });

  test('저장한 공고를 externalId 로 다시 읽는다', async () => {
    const saved = await noticeRepository.save(buildNotice('seq-1001'));
    const found = await noticeRepository.findByExternalId('SH_PORTAL', 'seq-1001');

    expect(found).not.toBeNull();
    expect(found!.noticeId).toBe(saved.noticeId);
    expect(found!.title).toBe('SH 청년안심주택 모집공고');
    expect(found!.rawJson).toEqual({ cp: 1, supplyType: 'publicLease' });
    expect(found!.postedAt).toEqual(new Date('2026-09-20T00:00:00Z'));
  });

  test('없는 공고는 null', async () => {
    expect(await noticeRepository.findByExternalId('SH_PORTAL', 'nope')).toBeNull();
  });

  test('같은 externalId 를 다시 저장하면 중복 행이 생기지 않는다 (dedupe)', async () => {
    await noticeRepository.save(buildNotice('seq-1002', '처음 제목'));
    await noticeRepository.save(buildNotice('seq-1002', '같은 공고 재수집'));

    const rows = await dataSource.query('select count(*)::int as count from notices where external_id = $1', ['seq-1002']);
    expect(rows[0].count).toBe(1);
  });

  test('다른 소스의 같은 externalId 는 별개 공고다', async () => {
    const shNotice = buildNotice('seq-1003');
    const ghNotice = NoticeEntity.create({
      sourceId: 'GH_APPLY',
      externalId: 'seq-1003',
      supplyType: 'HAPPY_HOUSE',
      status: 'OPEN',
      title: 'GH 행복주택 모집공고',
    });

    await noticeRepository.saveAll([shNotice, ghNotice]);

    const rows = await dataSource.query('select count(*)::int as count from notices where external_id = $1', ['seq-1003']);
    expect(rows[0].count).toBe(2);
  });

  test('findSeenExternalIds 는 신규 감지용 집합을 돌려준다', async () => {
    await noticeRepository.saveAll([buildNotice('seq-a'), buildNotice('seq-b')]);

    const seen = await noticeRepository.findSeenExternalIds('SH_PORTAL');

    expect(seen.has('seq-a')).toBe(true);
    expect(seen.has('seq-b')).toBe(true);
    expect(seen.has('seq-c')).toBe(false);
  });

  test('saveAll 에 빈 배열을 주면 아무 일도 하지 않는다', async () => {
    await expect(noticeRepository.saveAll([])).resolves.toEqual([]);
  });
});
