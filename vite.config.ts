import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EXTENSION_HTML_OUTPUTS = [
  resolve(__dirname, 'dist/src/sidepanel/index.html'),
  resolve(__dirname, 'dist/src/dashboard/index.html'),
];

function stripModulePreloadLinks(html: string): string {
  return html.replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
}

function chromeExtensionBuildPlugin(): Plugin {
  return {
    name: 'chrome-extension-build',
    closeBundle() {
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json'),
      );

      for (const htmlPath of EXTENSION_HTML_OUTPUTS) {
        const html = readFileSync(htmlPath, 'utf-8');
        writeFileSync(htmlPath, stripModulePreloadLinks(html));
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), chromeExtensionBuildPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        dashboard: resolve(__dirname, 'src/dashboard/index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }

          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
