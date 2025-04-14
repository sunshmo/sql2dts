import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/**'],
    format: ['esm', 'cjs'],
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    dts: true,
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    name: 'sql2dts',
    globalName: 'sql2dts',
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    dts: true,
  },
  {
    entry: ['bin/index.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist-bin',
    sourcemap: false,
    minify: false,
  }
]);
