import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  name: 'sql2dts',
  globalName: 'sql2dts',
  outDir: 'dist',
  sourcemap: false,
  minify: false,
  dts: true,
});
