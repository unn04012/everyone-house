import { NoticeRepositoryPostgres } from '@everyone-house/db';
import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppConfigModule } from './config/app/app-config.module.js';
import { MyhomeConfigModule } from './config/myhome/myhome-config.module.js';
import { SourceConfigModule } from './config/source/source-config.module.js';
import { CrawlerService } from './crawler.service.js';
import { DatabaseModule } from './database.module.js';
import { HttpClient } from './http/http-client.js';
import { GhApplyAdapter } from './sources/gh-apply.adapter.js';
import { MyhomeApiAdapter } from './sources/myhome-api.adapter.js';
import { MyhomeDetailAdapter } from './sources/myhome-detail.adapter.js';
import { ShDetailAdapter } from './sources/sh-detail.adapter.js';
import { ShPortalAdapter } from './sources/sh-portal.adapter.js';
import type { ISourceAdapter } from './sources/source.adapter.interface.js';
import { Symbols } from './symbols.js';

@Module({
  imports: [AppConfigModule, MyhomeConfigModule, SourceConfigModule, DatabaseModule],
  providers: [
    CrawlerService,
    HttpClient,
    ShPortalAdapter,
    ShDetailAdapter,
    MyhomeApiAdapter,
    MyhomeDetailAdapter,
    GhApplyAdapter,
    {
      provide: Symbols.sourceAdapters,
      useFactory: (shPortalAdapter: ShPortalAdapter, myhomeApiAdapter: MyhomeApiAdapter, ghApplyAdapter: GhApplyAdapter): ISourceAdapter[] => [
        shPortalAdapter,
        myhomeApiAdapter,
        ghApplyAdapter,
      ],
      inject: [ShPortalAdapter, MyhomeApiAdapter, GhApplyAdapter],
    },
    {
      provide: Symbols.noticeRepository,
      useFactory: (dataSource: DataSource) => new NoticeRepositoryPostgres(dataSource),
      inject: [DataSource],
    },
  ],
})
export class CrawlerModule {}
