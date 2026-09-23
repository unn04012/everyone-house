import type { NoticeCriteria, NoticeCriteriaRecord } from '@everyone-house/domain';
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
  private static readonly MODEL = 'claude-opus-5';
  /** 공고문은 길다(최대 15만 자). 스트리밍으로 받아 HTTP 타임아웃을 피한다. */
  private static readonly MAX_TOKENS = 16_000;

  private static readonly SYSTEM_PROMPT = [
    '당신은 한국 공공임대주택 모집공고문을 읽고 신청 자격과 순위 기준을 구조화하는 분석기입니다.',
    '',
    '원칙:',
    '- 공고문에 적힌 내용만 추출한다. 일반 상식이나 다른 공고의 기준을 끌어오지 않는다.',
    '- 찾지 못한 값은 반드시 null 또는 빈 배열로 두고, uncertainNotes 에 무엇을 못 찾았는지 적는다.',
    '- 금액은 원 단위 정수로 변환한다. "2억 5,100만원" → 251000000, "3,708만원" → 37080000.',
    '- 순위는 우선공급과 일반공급을 모두 담되 isPrioritySupply 로 구분한다.',
    '- 계층(대학생/청년/신혼부부/고령자 등)마다 소득·자산 기준이 다르면 각각 별도 항목으로 만든다.',
    '- 소득 기준이 "도시근로자 월평균소득"인지 "기준 중위소득"인지 구분해 해당 필드에만 넣는다.',
    '- 나이·거주요건처럼 서술이 복잡해 기계 판정이 어려운 조건은 manualCheckNotes 에 원문에 가깝게 남긴다.',
  ].join('\n');

  private readonly _logger = new Logger(NoticeAnalyzer.name);
  private readonly _client: Anthropic;

  constructor(private readonly _anthropicConfig: AnthropicConfigService) {
    this._client = new Anthropic({ apiKey: this._anthropicConfig.apiKey });
  }

  public async analyze({ noticeId, sourceFileName, documentText }: { noticeId: string; sourceFileName: string; documentText: string }): Promise<NoticeCriteriaRecord> {
    this._logger.log(`공고문 분석 시작: ${sourceFileName} (${documentText.length.toLocaleString('ko-KR')}자)`);

    const criteria = await this._extract(documentText);

    this._logger.log(`분석 완료: 계층 ${criteria.categories.length}개, 순위 ${criteria.ranks.length}개, 불확실 ${criteria.uncertainNotes.length}건`);

    return {
      ...criteria,
      noticeId,
      model: NoticeAnalyzer.MODEL,
      extractedAt: new Date().toISOString(),
      sourceFileName,
    };
  }

  private async _extract(documentText: string): Promise<NoticeCriteria> {
    const response = await this._client.messages.parse({
      model: NoticeAnalyzer.MODEL,
      max_tokens: NoticeAnalyzer.MAX_TOKENS,
      thinking: { type: 'adaptive' },
      system: NoticeAnalyzer.SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `다음은 공공임대주택 모집공고문 전문입니다. 신청 자격과 순위 기준을 추출하세요.\n\n---\n${documentText}`,
        },
      ],
      output_config: { format: zodOutputFormat(noticeCriteriaSchema) },
    });

    if (!response.parsed_output) {
      throw new Error('공고문 분석 결과를 파싱하지 못했습니다');
    }

    return response.parsed_output as NoticeCriteria;
  }
}
