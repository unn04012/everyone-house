import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CrawlerModule } from '../crawler.module.js';
import { CrawlerService } from '../crawler.service.js';

/**
 * Render Cron Job 엔트리. 얇은 껍데기만 둔다 —
 * Lambda 로 옮길 때 handler 파일 하나만 추가하면 되도록.
 */
class CrawlerCli {
  private readonly _logger = new Logger(CrawlerCli.name);

  public async run(): Promise<number> {
    const app = await NestFactory.createApplicationContext(CrawlerModule, { logger: ['log', 'warn', 'error'] });

    try {
      const result = await app.get(CrawlerService).runCrawl();

      for (const outcome of result.outcomes) {
        if (outcome.error) {
          this._logger.error(`${outcome.sourceId}: 실패 — ${outcome.error}`);
          continue;
        }
        for (const notice of outcome.newNotices) {
          const document = notice.primaryDocument();
          this._logger.log(`신규: [${notice.supplyType}] ${notice.title}`);
          this._logger.log(`      공고: ${notice.detailUrl}`);
          this._logger.log(`      공고문: ${document ? `${document.fileName} → ${document.bestUrl()}` : '첨부 없음'}`);
        }
      }

      // 한 소스라도 실패하면 크론 작업을 실패로 표시한다.
      return result.outcomes.some((outcome) => outcome.error) ? 1 : 0;
    } finally {
      const dataSource = app.get(DataSource, { strict: false });
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }
      await app.close();
    }
  }
}

process.exitCode = await new CrawlerCli().run();
