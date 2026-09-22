import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DataSourceOptionsFactory } from './data-source-options.js';

/**
 * TypeORM CLI 전용 진입점. 마이그레이션은 컴파일된 JS 로 실행한다
 * (TS 7 은 JS 컴파일러 API 를 제공하지 않아 ts-node 를 쓸 수 없다).
 */
export default new DataSource(DataSourceOptionsFactory.create({ url: process.env.DATABASE_URL }));
