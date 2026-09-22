import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyhomeConfigService {
  constructor(private readonly _configService: ConfigService) {}

  /**
   * data.go.kr 인증키.
   * 포털은 Encoding/Decoding 두 형태를 주는데, URLSearchParams 가 다시 인코딩하므로
   * 여기서 한 번 디코딩해 이중 인코딩을 막는다.
   */
  get serviceKey(): string {
    return decodeURIComponent(this._configService.getOrThrow<string>('myhome.serviceKey'));
  }
}
