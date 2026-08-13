import { useEffect, type ReactElement } from 'react';
import { buildBetaFeedbackMailto } from '../../constants/support';
import { PRO_PLAN, PRO_PLAN_FEATURES } from '../../utils/usageLimits';
import { SparklesIcon } from './icons';

interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEEDBACK_PROMPTS = [
  'What worked well while capturing notes from pages?',
  'Where did the flow feel slow, confusing, or broken?',
  'Which feature would make SyntaxAI a daily tool for you?',
] as const;

export function BetaFeedbackModal({
  isOpen,
  onClose,
}: BetaFeedbackModalProps): ReactElement | null {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSendFeedback = (): void => {
    window.open(buildBetaFeedbackMailto(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-syntax-overlay p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="beta-feedback-title"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-syntax-border bg-syntax-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="border-b border-syntax-border bg-gradient-to-br from-syntax-accent/10 via-syntax-card to-syntax-card px-6 pb-5 pt-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-syntax-accent/25 bg-syntax-accent/10 text-syntax-accent">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <button
              aria-label="Close beta feedback"
              className="rounded-lg px-2 py-1 text-syntax-muted transition hover:bg-syntax-hover hover:text-syntax-text"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-syntax-accent">
            Early access
          </p>
          <h2 className="text-lg font-semibold text-syntax-text" id="beta-feedback-title">
            Help us polish SyntaxAI
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-syntax-muted">
            You&apos;re using a pre-release build. Honest feedback on bugs, UX, and missing
            features directly shapes what we ship next.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-syntax-accent/20 bg-syntax-accent/5 p-4">
            <p className="text-sm font-medium text-syntax-text">Beta tester reward</p>
            <p className="mt-1.5 text-sm leading-relaxed text-syntax-muted">
              Send thoughtful feedback during the test period and get{' '}
              <span className="font-medium text-syntax-accent">1 month of Pro free</span> when
              accounts launch — unlimited notes, captures, and photo reads (
              {PRO_PLAN.priceLabel}
              {PRO_PLAN.periodLabel} value).
            </p>
          </div>

          <div>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-syntax-muted">
              What to share
            </p>
            <ul className="space-y-2">
              {FEEDBACK_PROMPTS.map((prompt) => (
                <li
                  key={prompt}
                  className="flex gap-2.5 text-sm leading-relaxed text-syntax-muted"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-syntax-accent" />
                  <span>{prompt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-syntax-border bg-syntax-bg p-3.5">
            <p className="mb-2 text-xs font-medium text-syntax-text">Pro includes</p>
            <ul className="space-y-1.5">
              {PRO_PLAN_FEATURES.slice(0, 3).map((feature) => (
                <li key={feature} className="text-xs leading-relaxed text-syntax-muted">
                  · {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              className="h-11 flex-1 rounded-full bg-syntax-accent text-sm font-semibold text-black transition hover:opacity-90"
              onClick={handleSendFeedback}
              type="button"
            >
              Send feedback
            </button>
            <button
              className="h-11 rounded-full border border-syntax-border px-5 text-sm text-syntax-muted transition hover:border-syntax-accent/30 hover:text-syntax-text"
              onClick={onClose}
              type="button"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
