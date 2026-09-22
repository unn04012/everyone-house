import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './app-configuration.js';
import { AppConfigService } from './app-config.service.js';
import { appValidationSchema } from './app.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
      validationSchema: appValidationSchema,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
