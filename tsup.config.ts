import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['bin/index.ts'],
    format: ['esm', 'cjs'],
    outDir: 'bin',
  },
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs', 'iife'],
    name: 'sql2dts',
    globalName: 'sql2dts',
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    dts: true,
  }
]);
