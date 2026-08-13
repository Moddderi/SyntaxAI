/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        syntax: {
          bg: 'var(--syntax-bg)',
          card: 'var(--syntax-card)',
          border: 'var(--syntax-border)',
          accent: 'var(--syntax-accent)',
          text: 'var(--syntax-text)',
          muted: 'var(--syntax-muted)',
          hover: 'var(--syntax-hover)',
          overlay: 'var(--syntax-overlay)',
          'nav-active': 'var(--syntax-nav-active)',
          inset: 'var(--syntax-inset)',
          code: 'var(--syntax-code)',
          'code-header': 'var(--syntax-code-header)',
          'heatmap-empty': 'var(--syntax-heatmap-empty)',
          'heatmap-empty-border': 'var(--syntax-heatmap-empty-border)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
