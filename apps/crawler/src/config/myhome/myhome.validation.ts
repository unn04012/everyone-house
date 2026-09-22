import Joi from 'joi';

export const myhomeValidationSchema = Joi.object({
  MYHOME_SERVICE_KEY: Joi.string().required(),
});
