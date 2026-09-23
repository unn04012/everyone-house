import { CriteriaRepositoryPostgres, MatchRepositoryPostgres, NoticeRepositoryPostgres, ProfileRepositoryPostgres } from '@everyone-house/db';
import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppConfigModule } from '../config/app/app-config.module.js';
import { DatabaseModule } from '../database.module.js';
import { Symbols } from '../symbols.js';
import { MatchingService } from './matching.service.js';

@Module({
  imports: [AppConfigModule, DatabaseModule],
  providers: [
    MatchingService,
    { provide: Symbols.noticeRepository, useFactory: (ds: DataSource) => new NoticeRepositoryPostgres(ds), inject: [DataSource] },
    { provide: Symbols.criteriaRepository, useFactory: (ds: DataSource) => new CriteriaRepositoryPostgres(ds), inject: [DataSource] },
    { provide: Symbols.matchRepository, useFactory: (ds: DataSource) => new MatchRepositoryPostgres(ds), inject: [DataSource] },
    { provide: Symbols.profileRepository, useFactory: (ds: DataSource) => new ProfileRepositoryPostgres(ds), inject: [DataSource] },
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
