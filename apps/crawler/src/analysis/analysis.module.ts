import { Module } from '@nestjs/common';
import { AnthropicConfigModule } from '../config/anthropic/anthropic-config.module.js';
import { NoticeAnalyzer } from './notice-analyzer.js';

@Module({
  imports: [AnthropicConfigModule],
  providers: [NoticeAnalyzer],
  exports: [NoticeAnalyzer],
})
export class AnalysisModule {}
