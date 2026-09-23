import Joi from 'joi';

export const anthropicValidationSchema = Joi.object({
  ANTHROPIC_API_KEY: Joi.string().required(),
  // 프롬프트는 코드가 아니라 환경변수로 받는다 (공개 저장소에 두지 않는다).
  // 길이 하한을 두는 이유: 빈 값이나 잘린 값이 들어가면 추출 품질이 조용히 무너진다.
  ANALYZER_SYSTEM_PROMPT: Joi.string().min(100).required(),
});
