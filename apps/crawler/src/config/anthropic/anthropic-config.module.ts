import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './anthropic-configuration.js';
import { AnthropicConfigService } from './anthropic-config.service.js';
import { anthropicValidationSchema } from './anthropic.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
      validationSchema: anthropicValidationSchema,
    }),
  ],
  providers: [AnthropicConfigService],
  exports: [AnthropicConfigService],
})
export class AnthropicConfigModule {}
