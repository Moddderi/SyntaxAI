import type { ReactElement, ReactNode } from 'react';

interface SyntaxSectionHeadProps {
  title: ReactNode;
  icon?: ReactNode;
  trailing?: ReactNode;
  accent?: boolean;
  className?: string;
}

export function SyntaxSectionHead({
  title,
  icon,
  trailing,
  accent = false,
  className = '',
}: SyntaxSectionHeadProps): ReactElement {
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <div className={accent ? 'syntax-label text-syntax-accent' : 'syntax-label text-syntax-muted'}>
            {title}
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      <div aria-hidden="true" className="syntax-section-underline" />
    </div>
  );
}
