import type { ReactElement } from 'react';

const SPINNER_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};

const DOT_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

interface SyntaxNeonLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function SyntaxNeonLoader({
  size = 'md',
  label,
  className = '',
}: SyntaxNeonLoaderProps): ReactElement {
  const spinnerSize = SPINNER_SIZES[size];
  const dotSize = DOT_SIZES[size];

  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={`inline-flex flex-col items-center justify-center gap-3 ${className}`.trim()}
    >
      <div className={`relative shrink-0 ${spinnerSize}`} aria-hidden="true">
        <div
          className="absolute inset-0 animate-tech-orbit rounded-full opacity-90"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0%, color-mix(in srgb, var(--syntax-accent) 18%, transparent) 30%, var(--syntax-accent) 48%, transparent 62%)',
          }}
        />
        <div className="absolute inset-[3px] rounded-full border border-syntax-accent/25 bg-syntax-inset shadow-[var(--syntax-glow)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`${dotSize} animate-tech-pulse rounded-full bg-syntax-accent shadow-[var(--syntax-glow-strong)]`}
          />
        </div>
      </div>

      {label ? (
        <p className="max-w-[18rem] text-center font-mono text-[10px] font-medium uppercase leading-relaxed tracking-[0.16em] text-syntax-accent/80">
          {label}
        </p>
      ) : null}
    </div>
  );
}

interface SyntaxCaptureAnalyzingPanelProps {
  message: string;
  compact?: boolean;
}

export function SyntaxCaptureAnalyzingPanel({
  message,
  compact = false,
}: SyntaxCaptureAnalyzingPanelProps): ReactElement {
  const heightClass = compact ? 'h-32' : 'h-52';

  return (
    <div
      className={`syntax-capture-analyzing relative grid ${heightClass} w-full place-items-center overflow-hidden rounded-2xl border border-syntax-accent/30 bg-syntax-inset px-6`}
      role="status"
    >
      <div className="pointer-events-none absolute inset-0 animate-tech-shimmer bg-gradient-to-r from-transparent via-syntax-accent/[0.07] to-transparent" />

      <div className="relative z-10">
        <SyntaxNeonLoader label={message} size={compact ? 'md' : 'lg'} />
      </div>
    </div>
  );
}
