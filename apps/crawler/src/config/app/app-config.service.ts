import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly _configService: ConfigService) {}

  get databaseUrl(): string {
    return this._configService.getOrThrow<string>('app.databaseUrl');
  }
}
