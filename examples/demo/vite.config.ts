import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@taskgenius/calendar': resolve(__dirname, '../../src/index.ts')
    }
  }
});
