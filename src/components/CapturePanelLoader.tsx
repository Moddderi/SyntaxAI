import type { ReactElement } from 'react';

interface CapturePanelLoaderProps {
  label: string;
  headerLabel?: string;
  minHeightClass?: string;
}

function CaptureSpinner(): ReactElement {
  return (
    <div className="relative h-9 w-9">
      <div
        className="absolute -inset-0.5 animate-tech-orbit rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0%, rgba(0,234,255,0.35) 35%, #00eaff 50%, transparent 65%)',
        }}
      />
      <div className="absolute inset-0 rounded-full border border-syntax-border bg-syntax-inset" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 animate-tech-pulse rounded-full bg-syntax-accent shadow-[0_0_10px_rgba(0,234,255,0.5)]" />
      </div>
    </div>
  );
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

      <div className={`relative overflow-hidden ${minHeightClass}`}>
        <div className="absolute inset-0 animate-tech-shimmer bg-gradient-to-r from-transparent via-[#00eaff]/8 to-transparent" />

        <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center gap-2.5 py-8">
          <CaptureSpinner />
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-syntax-accent/60">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
