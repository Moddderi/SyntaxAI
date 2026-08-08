import type { ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-5 text-xl font-semibold text-white first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-lg font-semibold text-white first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold text-white first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-3 text-sm font-semibold text-white first:mt-0">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-gray-300 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm text-gray-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-gray-300">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-[#00eaff]/40 pl-4 text-sm italic text-gray-400">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      className="text-[#00eaff] underline-offset-2 hover:underline"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
  hr: () => <hr className="my-4 border-[#1c1c20]" />,
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-xl border border-[#1c1c20]">
      <table className="min-w-full text-left text-sm text-gray-300">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#1a1b1e] text-xs uppercase text-gray-500">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-[#1c1c20] px-3 py-2">{children}</td>,
  pre: ({ children }) => <div className="my-3">{children}</div>,
  code: ({ className, children }) => {
    const languageMatch = /language-([\w-]+)/.exec(className ?? '');
    const codeText = String(children).replace(/\n$/, '');

    if (languageMatch) {
      return (
        <CodeBlock
          code={codeText}
          language={languageMatch[1]}
          showLanguageLabel
          size="sm"
        />
      );
    }

    return (
      <code className="rounded-md bg-[#1a1b1e] px-1.5 py-0.5 font-mono text-[12px] text-[#00eaff]">
        {children}
      </code>
    );
  },
};

export function MarkdownContent({ content, className = '' }: MarkdownContentProps): ReactElement {
  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
