import { type ReactElement, type ReactNode } from 'react';

interface CaptureSectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export function CaptureSectionHeader({ title, action }: CaptureSectionHeaderProps): ReactElement {
  return (
    <div className="mb-2 flex min-h-[28px] items-center justify-between gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        {title}
      </span>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AnalyzingBadge(): ReactElement {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[#00eaff]/20 bg-[#00eaff]/5 px-2.5 py-1 text-[10px] text-[#00eaff]/90">
      <span
        aria-hidden="true"
        className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#1c1c20] border-t-[#00eaff]"
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
      className="rounded-lg border border-[#1c1c20] px-2.5 py-1 text-[11px] text-gray-400 transition hover:border-[#00eaff]/40 hover:text-[#00eaff]"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
