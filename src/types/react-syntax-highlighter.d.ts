declare module 'react-syntax-highlighter/dist/esm/prism' {
  import type { ComponentType } from 'react';
  import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';

  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  import type { CSSProperties } from 'react';

  export const vscDarkPlus: Record<string, CSSProperties>;
}

declare module 'react-syntax-highlighter/dist/esm/languages/prism/*' {
  const language: unknown;
  export default language;
}
