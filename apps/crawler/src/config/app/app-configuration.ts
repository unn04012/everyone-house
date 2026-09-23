import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  databaseUrl: process.env.DATABASE_URL,
  interestedSupplyTypes: process.env.INTERESTED_SUPPLY_TYPES,
  interestedTitleKeywords: process.env.INTERESTED_TITLE_KEYWORDS,
}));
