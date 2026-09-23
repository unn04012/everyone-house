import Joi from 'joi';

export const anthropicValidationSchema = Joi.object({
  ANTHROPIC_API_KEY: Joi.string().required(),
});
