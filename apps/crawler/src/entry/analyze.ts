import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AnalysisModule } from '../analysis/analysis.module.js';
import { AnalysisService } from '../analysis/analysis.service.js';
import { MatchingService } from '../matching/matching.service.js';

/**
 * 분석 잡 엔트리. 수집 잡과 별도로 실행한다.
 * 얇은 껍데기만 둔다 — Lambda 로 옮길 때 handler 파일 하나만 추가하면 되도록.
 */
class AnalyzeCli {
  private readonly _logger = new Logger(AnalyzeCli.name);

  public async run(): Promise<number> {
    const app = await NestFactory.createApplicationContext(AnalysisModule, { logger: ['log', 'warn', 'error'] });

    try {
      const batchSize = process.env.ANALYSIS_BATCH_SIZE ? Number(process.env.ANALYSIS_BATCH_SIZE) : undefined;
      const result = await app.get(AnalysisService).runAnalysis(batchSize);
      this._logger.log(`분석: 성공 ${result.analyzed} / 실패 ${result.failed} / 건너뜀 ${result.skipped}`);

      // 판정은 공짜이므로 분석 직후 바로 이어서 돌린다.
      const matching = await app.get(MatchingService).runMatching();
      this._logger.log(`판정: ${matching.judged}건 (알림 가치 ${matching.worthNotifying}건)`);

      // 실패가 있어도 다음 실행에서 재시도하므로 잡 자체는 성공으로 둔다.
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

process.exitCode = await new AnalyzeCli().run();
