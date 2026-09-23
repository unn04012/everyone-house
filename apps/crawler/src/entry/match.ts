import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { MatchingModule } from '../matching/matching.module.js';
import { MatchingService } from '../matching/matching.service.js';

/**
 * 판정 잡. LLM 을 쓰지 않아 공짜이고 빠르므로, 분석 잡 뒤에 바로 돌려도 되고
 * 프로필이 바뀌었을 때 단독으로 돌려도 된다.
 */
class MatchCli {
  private readonly _logger = new Logger(MatchCli.name);

  public async run(): Promise<number> {
    const app = await NestFactory.createApplicationContext(MatchingModule, { logger: ['log', 'warn', 'error'] });

    try {
      const result = await app.get(MatchingService).runMatching();
      this._logger.log(`판정 ${result.judged}건 / 알림 가치 ${result.worthNotifying}건 / 건너뜀 ${result.skipped}건`);
      return 0;
    } finally {
      const dataSource = app.get(DataSource, { strict: false });
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
      }
      await app.close();
    }
  }
}

process.exitCode = await new MatchCli().run();
