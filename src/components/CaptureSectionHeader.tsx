import { type ReactElement, type ReactNode } from 'react';

interface CaptureSectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export function CaptureSectionHeader({ title, action }: CaptureSectionHeaderProps): ReactElement {
  return (
    <div className="mb-2 flex min-h-[28px] items-center justify-between gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-syntax-muted">
        {title}
      </span>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AnalyzingBadge(): ReactElement {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-syntax-accent/20 bg-syntax-accent/5 px-2.5 py-1 text-[10px] text-syntax-accent/90">
      <span
        aria-hidden="true"
        className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-syntax-border border-t-[#00eaff]"
      />
      Analyzing…
    </div>
  );
}

interface SectionEditButtonProps {
  label: string;
  onClick: () => void;
}

export function SectionEditButton({ label, onClick }: SectionEditButtonProps): ReactElement {
  return (
    <button
      className="rounded-lg border border-syntax-border px-2.5 py-1 text-[11px] text-syntax-muted transition hover:border-syntax-accent/40 hover:text-syntax-accent"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
