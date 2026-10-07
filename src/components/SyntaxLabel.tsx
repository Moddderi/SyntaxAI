import type { ReactElement, ReactNode } from 'react';

interface SyntaxLabelProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  muted?: boolean;
}

const TAG_CLASS = 'font-mono font-bold uppercase tracking-[0.14em]';

export function SyntaxLabel({
  children,
  as: Tag = 'span',
  className = '',
  muted = false,
}: SyntaxLabelProps): ReactElement {
  const colorClass = muted ? 'text-syntax-muted' : 'text-syntax-text';

  return <Tag className={`${TAG_CLASS} ${colorClass} ${className}`}>{children}</Tag>;
}
