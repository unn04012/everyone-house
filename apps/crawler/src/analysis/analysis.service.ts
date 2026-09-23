import type { ICriteriaRepository, INoticeRepository, NoticeEntity } from '@everyone-house/domain';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Symbols } from '../symbols.js';
import { DocumentLoader } from './document-loader.js';
import { NoticeAnalyzer } from './notice-analyzer.js';
import { SupplyTableLocator } from './supply-table-locator.js';

export interface AnalysisResult {
  analyzed: number;
  failed: number;
  skipped: number;
}

/**
 * 분석 잡. 수집 잡과 분리돼 있다.
 *
 * 분석은 공고당 1분 가까이 걸려 43건이면 40분이다 — 수집(40초)과 한 잡에 두면
 * Lambda 15분 제한을 넘고, 크론 실행 시간도 예측할 수 없다.
 * 배치 크기가 곧 실행 시간과 API 비용의 상한이 된다.
 */
@Injectable()
export class AnalysisService {
  /** 한 번에 처리할 공고 수. 실행 시간·비용의 상한이다. */
  private static readonly BATCH_SIZE = 10;
  /** 이 횟수만큼 실패하면 SKIPPED 로 보낸다. 무한 재시도로 비용을 태우지 않는다. */
  private static readonly MAX_ATTEMPTS = 3;

  private readonly _logger = new Logger(AnalysisService.name);

  constructor(
    @Inject(Symbols.noticeRepository) private readonly _noticeRepository: INoticeRepository,
    @Inject(Symbols.criteriaRepository) private readonly _criteriaRepository: ICriteriaRepository,
    private readonly _documentLoader: DocumentLoader,
    private readonly _noticeAnalyzer: NoticeAnalyzer,
    private readonly _supplyTableLocator: SupplyTableLocator,
  ) {}

  public async runAnalysis(batchSize = AnalysisService.BATCH_SIZE): Promise<AnalysisResult> {
    const pending = await this._noticeRepository.findPendingAnalysis(batchSize);
    this._logger.log(`분석 대기 ${pending.length}건 (배치 상한 ${batchSize})`);

    const result: AnalysisResult = { analyzed: 0, failed: 0, skipped: 0 };

    for (const notice of pending) {
      const outcome = await this._analyzeOne(notice);
      result[outcome] += 1;
    }

    this._logger.log(`분석 완료 — 성공 ${result.analyzed} / 실패 ${result.failed} / 건너뜀 ${result.skipped}`);
    return result;
  }

  private async _analyzeOne(notice: NoticeEntity): Promise<'analyzed' | 'failed' | 'skipped'> {
    const document = this._documentLoader.selectDocument(notice.attachments);

    if (!document) {
      this._logger.warn(`${notice.externalId}: 첨부가 없어 건너뜁니다`);
      await this._noticeRepository.updateAnalysisStatus(notice.noticeId, 'SKIPPED', 0);
      return 'skipped';
    }

    const loaded = await this._documentLoader.load(document).catch((error: unknown) => error as Error);
    if (loaded instanceof Error) {
      return await this._handleFailure(notice, loaded);
    }

    try {
      // 공급표는 LLM 없이 페이지 위치만 찾는다. 표는 이미지로 그대로 보여준다.
      const supplyTablePages = await this._supplyTableLocator.locate(loaded.pdfPath);

      const record = await this._noticeAnalyzer.analyze({
        noticeId: notice.noticeId,
        sourceFileName: document.fileName,
        documentText: loaded.text,
        supplyTablePages,
      });

      await this._criteriaRepository.save(record);
      await this._noticeRepository.updateAnalysisStatus(notice.noticeId, 'ANALYZED', 0);
      return 'analyzed';
    } catch (error) {
      return await this._handleFailure(notice, error);
    } finally {
      await loaded.dispose();
    }
  }

  private async _handleFailure(notice: NoticeEntity, error: unknown): Promise<'failed' | 'skipped'> {
    const attempts = notice.analysisAttempts + 1;
    const exhausted = attempts >= AnalysisService.MAX_ATTEMPTS;

    this._logger.error(`${notice.externalId} 분석 실패 (${attempts}/${AnalysisService.MAX_ATTEMPTS}): ${String(error)}`);
    await this._noticeRepository.updateAnalysisStatus(notice.noticeId, exhausted ? 'SKIPPED' : 'FAILED', attempts);

    return exhausted ? 'skipped' : 'failed';
  }
}
