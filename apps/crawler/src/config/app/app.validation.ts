import Joi from 'joi';

export const appValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
});
