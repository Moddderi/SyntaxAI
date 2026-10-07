import type { ReactElement } from 'react';
import { SyntaxNeonLoader } from './SyntaxNeonLoader';

interface CapturePanelLoaderProps {
  label: string;
  headerLabel?: string;
  minHeightClass?: string;
}

export function CapturePanelLoader({
  label,
  headerLabel,
  minHeightClass = 'min-h-[160px]',
}: CapturePanelLoaderProps): ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="overflow-hidden rounded-xl border border-syntax-border bg-syntax-code"
    >
      {headerLabel ? (
        <div className="flex h-8 items-center border-b border-syntax-border bg-syntax-card px-3">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-syntax-muted">
            {headerLabel}
          </span>
        </div>
      ) : null}

      <div className={`relative grid ${minHeightClass} place-items-center overflow-hidden`}>
        <div className="pointer-events-none absolute inset-0 animate-tech-shimmer bg-gradient-to-r from-transparent via-syntax-accent/[0.06] to-transparent" />

        <div className="relative z-10">
          <SyntaxNeonLoader label={label} size="md" />
        </div>
      </div>
    </div>
  );
}
