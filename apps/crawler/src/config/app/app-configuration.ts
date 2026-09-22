import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  databaseUrl: process.env.DATABASE_URL,
}));
