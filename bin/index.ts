#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'path';
import * as process from 'node:process';

const args = process.argv.slice(2);

if (!args[0]) {
  console.error('❌ No input SQL file specified.');
  process.exit(1);
}

const dbName = (args.includes('-d') ? args[args.indexOf('-d') + 1] : 'mysql').toLowerCase();
const input = join(process.cwd(), args[0]);
const output = join(
  process.cwd(),
  args.includes('-o') ? args[args.indexOf('-o') + 1] : `${dbName}.d.ts`
);

if (!existsSync(input)) {
  console.error('❌ SQL file not found:', input);
  process.exit(1);
}

try {
  const { generate: generateDts } = require(`../src/${dbName}`);

  const sql = readFileSync(input, 'utf-8');
  const dts = generateDts(sql);

  if (dts) {
    try {
      writeFileSync(output, dts);
    } catch (err) {
      if (err.code === 'ENOENT') {
        const dir = dirname(output);

        console.log(`⚠️ Directory not found, creating: ${dir}`);
        mkdirSync(dir, { recursive: true });

        // Try writing again
        writeFileSync(output, dts);
        console.log(`✅ Generated .d.ts saved to: ${output}`);
      } else {
        throw err;
      }
    }
  } else {
    console.log('❗ No table found in SQL input.');
  }

} catch (e) {
  console.error(`❌ Unsupported database type or module not found: ${dbName}`);
  process.exit(1);
}
