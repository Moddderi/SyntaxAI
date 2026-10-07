import type { ReactElement } from 'react';

interface SyntaxWordmarkProps {
  className?: string;
  size?: 'sm' | 'md';
}

const SIZE_CLASS: Record<NonNullable<SyntaxWordmarkProps['size']>, string> = {
  sm: 'text-[13px]',
  md: 'text-sm',
};

export function SyntaxWordmark({
  className = '',
  size = 'md',
}: SyntaxWordmarkProps): ReactElement {
  return (
    <span
      className={`font-mono font-bold leading-none tracking-tight text-syntax-text ${SIZE_CLASS[size]} ${className}`}
    >
      Syntax<span className="text-syntax-accent">AI</span>
    </span>
  );
}
