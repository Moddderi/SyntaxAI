import { defineConfig } from 'vitest/config';

// Standalone config: tests must not load vite.config.ts, whose plugin rebuilds dist/ on close.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
