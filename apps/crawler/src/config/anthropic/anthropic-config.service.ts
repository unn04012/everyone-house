import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnthropicConfigService {
  constructor(private readonly _configService: ConfigService) {}

  get apiKey(): string {
    return this._configService.getOrThrow<string>('anthropic.apiKey');
  }

  /**
   * 공고문 분석 시스템 프롬프트.
   *
   * 코드가 아니라 환경변수로 받는다 — 추출 품질을 좌우하는 자산이라
   * 공개 저장소에 남기지 않는다. 로컬 사본은 docs/prompts.local.md 에 있다.
   */
  get analyzerSystemPrompt(): string {
    return this._configService.getOrThrow<string>('anthropic.analyzerSystemPrompt');
  }
}
