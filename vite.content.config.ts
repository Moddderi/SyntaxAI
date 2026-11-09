import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const extensionOutDir = process.env.EXTENSION_OUT_DIR ?? 'dist';

type ContentEntry = 'authHandoff' | 'pageCapture';

const contentEntry: ContentEntry =
  process.env.CONTENT_ENTRY === 'pageCapture' ? 'pageCapture' : 'authHandoff';

// Content scripts run as classic scripts: bundle each entry as a self-contained IIFE.
export default defineConfig({
  build: {
    outDir: resolve(__dirname, extensionOutDir, 'content'),
    // First entry wipes the folder; the second keeps the first one's output.
    emptyOutDir: contentEntry === 'authHandoff',
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, `src/content/${contentEntry}.ts`),
      formats: ['iife'],
      name: `SyntaxAi_${contentEntry}`,
      fileName: () => `${contentEntry}.js`,
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
