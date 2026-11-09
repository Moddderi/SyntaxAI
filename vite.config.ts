import { execSync } from 'node:child_process';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type ExtensionTarget = 'chrome' | 'firefox';

const EXTENSION_HTML_OUTPUTS = (outDir: string): string[] => [
  resolve(__dirname, outDir, 'src/sidepanel/index.html'),
  resolve(__dirname, outDir, 'src/dashboard/index.html'),
];

function stripModulePreloadLinks(html: string): string {
  return html.replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
}

function extensionBuildPlugin(target: ExtensionTarget, outDir: string): Plugin {
  const manifestFile = target === 'firefox' ? 'manifest.firefox.json' : 'manifest.json';

  return {
    name: 'extension-build',
    closeBundle() {
      copyFileSync(resolve(__dirname, manifestFile), resolve(__dirname, outDir, 'manifest.json'));

      for (const htmlPath of EXTENSION_HTML_OUTPUTS(outDir)) {
        const html = readFileSync(htmlPath, 'utf-8');
        writeFileSync(htmlPath, stripModulePreloadLinks(html));
      }

      const env = { ...process.env, EXTENSION_OUT_DIR: outDir };
      execSync('vite build --config vite.background.config.ts', {
        cwd: __dirname,
        env,
        stdio: 'inherit',
      });
      for (const contentEntry of ['authHandoff', 'pageCapture']) {
        execSync('vite build --config vite.content.config.ts', {
          cwd: __dirname,
          env: { ...env, CONTENT_ENTRY: contentEntry },
          stdio: 'inherit',
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const target: ExtensionTarget = mode === 'firefox' ? 'firefox' : 'chrome';
  const outDir = target === 'firefox' ? 'dist-firefox' : 'dist';

  return {
    base: './',
    plugins: [react(), extensionBuildPlugin(target, outDir)],
    define: {
      'import.meta.env.VITE_EXTENSION_TARGET': JSON.stringify(target),
    },
    build: {
      outDir,
      emptyOutDir: true,
      modulePreload: false,
      rollupOptions: {
        input: {
          sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
          dashboard: resolve(__dirname, 'src/dashboard/index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
  };
});
