import type { DataSourceOptions } from 'typeorm';
import { MatchOrmEntity } from './schema/match.orm-entity.js';
import { NoticeCriteriaOrmEntity } from './schema/notice-criteria.orm-entity.js';
import { NoticeOrmEntity } from './schema/notice.orm-entity.js';
import { NotificationOrmEntity } from './schema/notification.orm-entity.js';
import { UserProfileOrmEntity } from './schema/user-profile.orm-entity.js';

/**
 * 접속 정보는 DATABASE_URL 하나로만 받는다 (SPEC §5).
 * 드라이버 교체가 필요해지면(Lambda 커넥션 고갈 대응) 이 클래스만 바꾼다.
 */
export class DataSourceOptionsFactory {
  public static readonly ORM_ENTITIES = [NoticeOrmEntity, NoticeCriteriaOrmEntity, MatchOrmEntity, UserProfileOrmEntity, NotificationOrmEntity];

  public static create({ url, logging = false }: { url?: string; logging?: boolean }): DataSourceOptions {
    if (!url) {
      throw new Error('DATABASE_URL 이 설정되지 않았습니다');
    }

    return {
      type: 'postgres',
      url,
      entities: DataSourceOptionsFactory.ORM_ENTITIES,
      migrations: ['dist/migrations/*.js'],
      // 스키마 변경은 항상 마이그레이션으로. synchronize 는 어떤 환경에서도 쓰지 않는다.
      synchronize: false,
      logging: logging ? ['query', 'error'] : ['error'],
    };
  }
}
