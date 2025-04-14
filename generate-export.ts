import { readdirSync, writeFileSync } from "node:fs";
import { parse } from 'node:path';

const excludes = ['index'];
try {
  const items = readdirSync('./src', { withFileTypes: true });

  const exports = items
    .filter(item => item.isFile())
    .map(item => {
      const { name: fileName, ext } = parse(item.name);
      return { fileName, ext };
    })
    .filter(({ fileName }) => !excludes.includes(fileName))
    .map(({ fileName }) => {
      const capitalized = fileName.length > 0
        ? fileName[0].toUpperCase() + fileName.slice(1)
        : fileName;
      return `export { generate as generateFor${capitalized} } from './${fileName}';`;
    });

  const content = exports.join('\n') + '\n'; // 确保最后有换行

  writeFileSync('./src/index.ts', content, { encoding: 'utf-8' });
} catch (err) {
  console.error('处理文件时出错:', err);
  process.exit(1);
}
