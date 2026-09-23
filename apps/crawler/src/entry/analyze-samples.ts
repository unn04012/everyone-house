import 'reflect-metadata';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AnalysisModule } from '../analysis/analysis.module.js';
import { NoticeAnalyzer } from '../analysis/notice-analyzer.js';

/**
 * 샘플 공고문 분석기.
 * 사용법: SAMPLE_DIR=/path/to/texts node dist/entry/analyze-samples.js
 * SAMPLE_DIR 안의 *.txt 를 각각 분석해 결과 JSON 을 같은 폴더에 쓴다.
 */
class AnalyzeSamplesCli {
  private readonly _logger = new Logger(AnalyzeSamplesCli.name);

  public async run(): Promise<number> {
    const sampleDir = process.env.SAMPLE_DIR;
    if (!sampleDir) {
      this._logger.error('SAMPLE_DIR 환경변수가 필요합니다');
      return 1;
    }

    const app = await NestFactory.createApplicationContext(AnalysisModule, { logger: ['log', 'warn', 'error'] });
    const analyzer = app.get(NoticeAnalyzer);

    try {
      const files = (await readdir(sampleDir)).filter((file) => file.endsWith('.txt')).sort();
      this._logger.log(`분석 대상 ${files.length}건`);

      for (const file of files) {
        const noticeId = file.replace(/\.txt$/, '');
        try {
          const documentText = await readFile(join(sampleDir, file), 'utf8');
          const record = await analyzer.analyze({ noticeId, sourceFileName: file, documentText });
          const { writeFile } = await import('node:fs/promises');
          await writeFile(join(sampleDir, `${noticeId}.criteria.json`), JSON.stringify(record, null, 2));
          this._logger.log(`저장: ${noticeId}.criteria.json`);
        } catch (error) {
          this._logger.error(`${noticeId} 분석 실패: ${String(error)}`);
        }
      }

      return 0;
    } finally {
      await app.close();
    }
  }
}

process.exitCode = await new AnalyzeSamplesCli().run();
