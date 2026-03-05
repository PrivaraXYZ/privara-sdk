import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/blockchain/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  outDir: 'dist',
  external: ['viem', '@zerodev/sdk', '@zerodev/permissions', '@zerodev/ecdsa-validator'],
});
