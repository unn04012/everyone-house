export default {
  rootDir: '.',
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: ['.*\\.test\\.ts$', '.*\\.spec\\.ts$'],
  transform: { '^.+\\.(t|j)s$': ['@swc/jest'] },
  // ESM 소스는 상대 import 에 .js 를 붙이므로 TS 소스로 되돌려 준다
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  testEnvironment: 'node',
};
