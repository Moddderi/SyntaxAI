import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const extensionOutDir = process.env.EXTENSION_OUT_DIR ?? 'dist';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, extensionOutDir),
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/background/background.ts'),
      formats: ['es'],
      fileName: () => 'background.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
