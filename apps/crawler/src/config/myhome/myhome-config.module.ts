import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './myhome-configuration.js';
import { MyhomeConfigService } from './myhome-config.service.js';
import { myhomeValidationSchema } from './myhome.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
      validationSchema: myhomeValidationSchema,
    }),
  ],
  providers: [MyhomeConfigService],
  exports: [MyhomeConfigService],
})
export class MyhomeConfigModule {}
