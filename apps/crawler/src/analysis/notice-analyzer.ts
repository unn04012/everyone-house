import type { NoticeCriteria, NoticeCriteriaRecord, SupplyTablePage } from '@everyone-house/domain';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Injectable, Logger } from '@nestjs/common';
import { AnthropicConfigService } from '../config/anthropic/anthropic-config.service.js';
import { noticeCriteriaSchema } from './criteria.schema.js';

/**
 * 공고문 PDF 텍스트에서 자격·순위 기준을 추출한다.
 *
 * 규칙 기반 파서를 쓰지 않는 이유: 순위 체계가 공고마다 다르고(지역/청약회차/소득구간),
 * 표 레이아웃도 제각각이라 유형별 파서를 만들어도 금방 깨진다.
 *
 * 추출 결과에는 모델명과 추출 시각을 스탬프한다 — 나중에 "왜 이렇게 판정했나"를
 * 추적하고, 모델을 바꿨을 때 재추출 대상을 고르기 위해서다.
 */
@Injectable()
export class NoticeAnalyzer {
  /** Opus 5.5 는 Opus 5 보다 싸다($4/$20 vs $5/$25). 더 새 모델이라 바꾸지 않을 이유가 없다. */
  private static readonly MODEL = 'claude-opus-5-5';
  /** 단가 (USD per 1M tokens). 비용을 눈으로 확인하기 위한 값이다. */
  private static readonly INPUT_USD_PER_MTOK = 4;
  private static readonly OUTPUT_USD_PER_MTOK = 20;
  /** 캐시 쓰기 1.25배, 읽기는 0.05배 (Opus 5.5) */
  private static readonly CACHE_WRITE_USD_PER_MTOK = 5;
  private static readonly CACHE_READ_USD_PER_MTOK = 0.2;
  /**
   * 추출은 정형 작업이라 최고 수준의 추론이 필요하지 않다.
   * thinking 출력은 입력의 5배 단가라 effort 를 낮추는 것이 비용에 가장 크게 작용한다.
   */
  private static readonly EFFORT = 'medium';
  /** 공고문은 길다(최대 15만 자). 스트리밍으로 받아 HTTP 타임아웃을 피한다. */
  private static readonly MAX_TOKENS = 16_000;

  private readonly _logger = new Logger(NoticeAnalyzer.name);
  private readonly _client: Anthropic;

  constructor(private readonly _anthropicConfig: AnthropicConfigService) {
    this._client = new Anthropic({ apiKey: this._anthropicConfig.apiKey });
  }

  public async analyze({
    noticeId,
    sourceFileName,
    documentText,
    supplyTablePages = [],
  }: {
    noticeId: string;
    sourceFileName: string;
    documentText: string;
    supplyTablePages?: SupplyTablePage[];
  }): Promise<NoticeCriteriaRecord> {
    this._logger.log(`공고문 분석 시작: ${sourceFileName} (${documentText.length.toLocaleString('ko-KR')}자)`);

    const { criteria, usage } = await this._extract(documentText);

    this._logger.log(
      `분석 완료: 계층 ${criteria.categories.length}개, 순위 ${criteria.ranks.length}개, 공급표 ${supplyTablePages.length}p, 불확실 ${criteria.uncertainNotes.length}건`,
    );
    this._logUsage(usage);

    return {
      ...criteria,
      supplyTablePages,
      noticeId,
      model: NoticeAnalyzer.MODEL,
      extractedAt: new Date().toISOString(),
      sourceFileName,
    };
  }

  /**
   * 사용량을 매 호출마다 남긴다.
   * 남기지 않으면 비용이 얼마나 나가는지 알 수 없고, 추정은 쉽게 빗나간다 —
   * 특히 thinking 출력 토큰은 입력의 5배 단가라 무시하면 크게 틀린다.
   */
  private _logUsage(usage: Anthropic.Usage): void {
    const thinking = usage.output_tokens_details?.thinking_tokens ?? 0;
    const cacheWrite = usage.cache_creation_input_tokens ?? 0;
    const cacheRead = usage.cache_read_input_tokens ?? 0;
    const cost =
      (usage.input_tokens * NoticeAnalyzer.INPUT_USD_PER_MTOK +
        cacheWrite * NoticeAnalyzer.CACHE_WRITE_USD_PER_MTOK +
        cacheRead * NoticeAnalyzer.CACHE_READ_USD_PER_MTOK +
        usage.output_tokens * NoticeAnalyzer.OUTPUT_USD_PER_MTOK) /
      1_000_000;

    this._logger.log(
      `사용량: 입력 ${usage.input_tokens.toLocaleString('ko-KR')} (캐시 쓰기 ${cacheWrite.toLocaleString('ko-KR')} / 읽기 ${cacheRead.toLocaleString('ko-KR')})` +
        ` / 출력 ${usage.output_tokens.toLocaleString('ko-KR')}(thinking ${thinking.toLocaleString('ko-KR')}) → 약 $${cost.toFixed(3)}`,
    );
  }

  private async _extract(documentText: string): Promise<{ criteria: NoticeCriteria; usage: Anthropic.Usage }> {
    const response = await this._client.messages.parse({
      model: NoticeAnalyzer.MODEL,
      max_tokens: NoticeAnalyzer.MAX_TOKENS,
      thinking: { type: 'adaptive' },
      output_config: { effort: NoticeAnalyzer.EFFORT, format: zodOutputFormat(noticeCriteriaSchema) },
      system: this._anthropicConfig.analyzerSystemPrompt,
      messages: [this._documentMessage('신청 자격과 순위 기준을 추출하세요.', documentText)],
    });

    if (!response.parsed_output) {
      throw new Error('공고문 분석 결과를 파싱하지 못했습니다');
    }

    return { criteria: response.parsed_output as NoticeCriteria, usage: response.usage };
  }

  private _documentMessage(instruction: string, documentText: string): Anthropic.MessageParam {
    return {
      role: 'user',
      content: `다음은 공공임대주택 모집공고문 전문입니다. ${instruction}\n\n---\n${documentText}`,
    };
  }
}
