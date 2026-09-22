// 통합 테스트용 DATABASE_URL 을 .env 없이도 쓸 수 있게 기본값을 준다 (docker compose 기준).
process.env.DATABASE_URL ??= 'postgres://postgres:postgres@127.0.0.1:5433/everyone_house';
