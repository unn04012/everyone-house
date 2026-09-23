import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SourceConfigService {
  constructor(private readonly _configService: ConfigService) {}

  get shListUrl(): string {
    return this._configService.getOrThrow<string>('source.shListUrl');
  }

  get shBaseUrl(): string {
    return this._configService.getOrThrow<string>('source.shBaseUrl');
  }

  get shDetailUrlPrefix(): string {
    return this._configService.getOrThrow<string>('source.shDetailUrlPrefix');
  }

  get myhomeApiUrl(): string {
    return this._configService.getOrThrow<string>('source.myhomeApiUrl');
  }

  get myhomeDetailUrlPrefix(): string {
    return this._configService.getOrThrow<string>('source.myhomeDetailUrlPrefix');
  }

  get myhomeDownloadUrl(): string {
    return this._configService.getOrThrow<string>('source.myhomeDownloadUrl');
  }

  get ghListUrl(): string {
    return this._configService.getOrThrow<string>('source.ghListUrl');
  }

  get ghDetailUrl(): string {
    return this._configService.getOrThrow<string>('source.ghDetailUrl');
  }
}
