import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './source-configuration.js';
import { SourceConfigService } from './source-config.service.js';
import { sourceValidationSchema } from './source.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
      validationSchema: sourceValidationSchema,
    }),
  ],
  providers: [SourceConfigService],
  exports: [SourceConfigService],
})
export class SourceConfigModule {}
