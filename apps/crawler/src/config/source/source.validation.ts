import Joi from 'joi';

const requiredUrl = Joi.string().uri({ scheme: ['http', 'https'] }).required();

export const sourceValidationSchema = Joi.object({
  SH_LIST_URL: requiredUrl,
  SH_BASE_URL: requiredUrl,
  SH_DETAIL_URL_PREFIX: requiredUrl,
  MYHOME_API_URL: requiredUrl,
  MYHOME_DETAIL_URL_PREFIX: requiredUrl,
  MYHOME_DOWNLOAD_URL: requiredUrl,
});
