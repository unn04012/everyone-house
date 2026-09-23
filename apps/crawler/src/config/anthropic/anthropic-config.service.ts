import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnthropicConfigService {
  constructor(private readonly _configService: ConfigService) {}

  get apiKey(): string {
    return this._configService.getOrThrow<string>('anthropic.apiKey');
  }
}
