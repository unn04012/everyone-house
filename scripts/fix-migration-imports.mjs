#!/usr/bin/env node
/**
 * TypeORM 의 migration:generate 는 ESM + verbatimModuleSyntax 에 맞지 않는 코드를 쓴다:
 *   import { MigrationInterface, QueryRunner } from "typeorm";
 * 둘 다 타입이라 컴파일은 TS1484 로 실패하고, 통과시켜도 런타임에
 *   SyntaxError: does not provide an export named 'MigrationInterface'
 * 로 깨진다. 생성 직후 type-only import 로 바꿔 준다.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(import.meta.dirname, '..', 'packages', 'db', 'src', 'migrations');
const BAD_IMPORT = /^import \{ MigrationInterface, QueryRunner \} from "typeorm";$/m;
const GOOD_IMPORT = "import type { MigrationInterface, QueryRunner } from 'typeorm';";

const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.ts'));
let fixed = 0;

for (const file of files) {
  const path = join(MIGRATIONS_DIR, file);
  const source = await readFile(path, 'utf8');
  if (BAD_IMPORT.test(source)) {
    await writeFile(path, source.replace(BAD_IMPORT, GOOD_IMPORT));
    console.log(`fixed import: ${file}`);
    fixed += 1;
  }
}

console.log(fixed === 0 ? 'no migration imports needed fixing' : `${fixed} migration(s) fixed`);
