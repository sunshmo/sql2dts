#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'path';
import * as process from 'node:process';

const args = process.argv.slice(2);

if (!args[0] || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: sql2dts <input.sql> [-d dbname] [-o output.d.ts]

Options:
  -d <dbname>     Specify database type (default: mysql)
  -o <output>     Output path for .d.ts file
  -h, --help      Show this help message
`);
  process.exit(0);
}

const dbName = (args.includes('-d') ? args[args.indexOf('-d') + 1] : 'mysql').toLowerCase();
// absolute path
const inputArg = args[0];
const input = isAbsolute(inputArg) ? inputArg : join(process.cwd(), inputArg);

// absolute path
let outputArg = args.includes('-o') ? args[args.indexOf('-o') + 1] : `${dbName}.d.ts`;
const output = isAbsolute(outputArg) ? outputArg : join(process.cwd(), outputArg);

if (!existsSync(input)) {
  console.error('❌ SQL file not found:', input);
  process.exit(1);
}

const isDev = __dirname.includes('src');

let generateDts: (sql: string) => string;

try {
  const modulePath = isDev
    ? join(__dirname, `../src/${dbName}`)
    : join(__dirname, `../dist/${dbName}.js`);
  ({ generate: generateDts } = require(modulePath));
} catch (e) {
  console.error(`❌ Failed to load database module for: ${dbName}`);
  console.error(e);
  process.exit(1);
}

try {
  const sql = readFileSync(input, 'utf-8');
  const dts = generateDts(sql);

  if (typeof dts === 'string' && dts.trim()) {
    try {
      writeFileSync(output, dts);
      console.log(`✅ Generated .d.ts saved to: ${output}`);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        const dir = dirname(output);
        console.log(`⚠️ Directory not found, creating: ${dir}`);
        mkdirSync(dir, { recursive: true });
        writeFileSync(output, dts);
        console.log(`✅ Generated .d.ts saved to: ${output}`);
      } else {
        throw err;
      }
    }
  } else {
    console.log('❗ No TypeScript definitions generated from SQL.');
  }
} catch (e) {
  console.error('❌ Error while processing SQL input.');
  console.error(e);
  process.exit(1);
}
