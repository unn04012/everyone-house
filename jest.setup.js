// 통합 테스트는 개발 DB 를 지운다(리포지토리 테스트가 beforeEach 로 delete 한다).
// 반드시 별도 테스트 DB 를 쓴다 — 기본값도 _test 를 가리킨다.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:5433/everyone_house_test';
