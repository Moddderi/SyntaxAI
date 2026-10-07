import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const extensionOutDir = process.env.EXTENSION_OUT_DIR ?? 'dist';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, extensionOutDir, 'content'),
    emptyOutDir: true,
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/contentScript.ts'),
      formats: ['es'],
      fileName: () => 'contentScript.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
