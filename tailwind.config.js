/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        syntax: {
          bg: 'var(--syntax-bg)',
          card: 'var(--syntax-card)',
          border: 'var(--syntax-border)',
          accent: 'var(--syntax-accent)',
          'accent-fg': 'var(--syntax-accent-fg)',
          'accent-muted': 'var(--syntax-accent-muted)',
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
          'heatmap-1': 'var(--syntax-heatmap-1)',
          'heatmap-1-border': 'var(--syntax-heatmap-1-border)',
          'heatmap-2': 'var(--syntax-heatmap-2)',
          'heatmap-2-border': 'var(--syntax-heatmap-2-border)',
          'heatmap-3': 'var(--syntax-heatmap-3)',
          'heatmap-3-border': 'var(--syntax-heatmap-3-border)',
        },
      },
      fontFamily: {
        sans: ['"Work Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
