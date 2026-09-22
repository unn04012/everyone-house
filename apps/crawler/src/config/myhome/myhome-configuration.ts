import { registerAs } from '@nestjs/config';

export default registerAs('myhome', () => ({
  serviceKey: process.env.MYHOME_SERVICE_KEY,
}));
