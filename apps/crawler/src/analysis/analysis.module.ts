import { CriteriaRepositoryPostgres, NoticeRepositoryPostgres } from '@everyone-house/db';
import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AnthropicConfigModule } from '../config/anthropic/anthropic-config.module.js';
import { AppConfigModule } from '../config/app/app-config.module.js';
import { DatabaseModule } from '../database.module.js';
import { Symbols } from '../symbols.js';
import { AnalysisService } from './analysis.service.js';
import { DocumentLoader } from './document-loader.js';
import { NoticeAnalyzer } from './notice-analyzer.js';

@Module({
  imports: [AppConfigModule, AnthropicConfigModule, DatabaseModule],
  providers: [
    AnalysisService,
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
  ],
  exports: [AnalysisService, NoticeAnalyzer],
})
export class AnalysisModule {}
