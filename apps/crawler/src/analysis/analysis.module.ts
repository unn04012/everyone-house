import { CriteriaRepositoryPostgres, MatchRepositoryPostgres, NoticeRepositoryPostgres, ProfileRepositoryPostgres } from '@everyone-house/db';
import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AnthropicConfigModule } from '../config/anthropic/anthropic-config.module.js';
import { AppConfigModule } from '../config/app/app-config.module.js';
import { DatabaseModule } from '../database.module.js';
import { Symbols } from '../symbols.js';
import { MatchingService } from '../matching/matching.service.js';
import { AnalysisService } from './analysis.service.js';
import { DocumentLoader } from './document-loader.js';
import { NoticeAnalyzer } from './notice-analyzer.js';

@Module({
  imports: [AppConfigModule, AnthropicConfigModule, DatabaseModule],
  providers: [
    AnalysisService,
    MatchingService,
    NoticeAnalyzer,
    DocumentLoader,
    {
      provide: Symbols.noticeRepository,
      useFactory: (dataSource: DataSource) => new NoticeRepositoryPostgres(dataSource),
      inject: [DataSource],
    },
    {
      provide: Symbols.criteriaRepository,
      useFactory: (dataSource: DataSource) => new CriteriaRepositoryPostgres(dataSource),
      inject: [DataSource],
    },
    {
      provide: Symbols.matchRepository,
      useFactory: (dataSource: DataSource) => new MatchRepositoryPostgres(dataSource),
      inject: [DataSource],
    },
    {
      provide: Symbols.profileRepository,
      useFactory: (dataSource: DataSource) => new ProfileRepositoryPostgres(dataSource),
      inject: [DataSource],
    },
  ],
  exports: [AnalysisService, MatchingService, NoticeAnalyzer],
})
export class AnalysisModule {}
