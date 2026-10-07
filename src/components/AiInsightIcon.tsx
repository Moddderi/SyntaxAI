import type { ReactElement } from 'react';

interface AiInsightIconProps {
  className?: string;
}

export function AiInsightIcon({ className = 'h-4 w-4' }: AiInsightIconProps): ReactElement {
  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 text-syntax-accent ${className}`.trim()}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3l1.2 3.6L17 7.8l-3.6 1.2L12 12.6 10.8 9 7.2 7.8l3.6-1.2L12 3z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M5 14l.8 2.4L8.2 17l-2.4.8L5 20.2 4.2 17.8 1.8 17l2.4-.8L5 14z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M19 13l.7 2.1L21.8 16l-2.1.7L19 18.8l-.7-2.1L16.2 16l2.1-.7L19 13z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}
