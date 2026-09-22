import { DataSourceOptionsFactory } from '@everyone-house/db';
import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppConfigModule } from './config/app/app-config.module.js';
import { AppConfigService } from './config/app/app-config.service.js';

/**
 * DataSource 를 직접 관리한다 (@nestjs/typeorm 의 forRootAsync 대신).
 * 크론 작업은 짧게 살고 끝나므로 수명주기를 명시적으로 쥐고 있는 편이 낫다.
 */
@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: DataSource,
      useFactory: async (appConfig: AppConfigService) => {
        const dataSource = new DataSource(DataSourceOptionsFactory.create({ url: appConfig.databaseUrl }));
        await dataSource.initialize();
        return dataSource;
      },
      inject: [AppConfigService],
    },
  ],
  exports: [DataSource],
})
export class DatabaseModule {}
