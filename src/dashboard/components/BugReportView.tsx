import { useState, type FormEvent, type ReactElement } from 'react';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useTranslation } from '../../hooks/useTranslation';
import {
  FeedbackServiceError,
  submitSupportForm,
} from '../../services/feedbackService';
import { BugIcon } from './icons';

const TEXTAREA_CLASS =
  'min-h-[120px] w-full resize-y rounded-xl border border-syntax-border bg-syntax-inset px-4 py-3 text-sm leading-relaxed text-syntax-text outline-none transition placeholder:text-syntax-muted focus:border-syntax-accent/40 disabled:opacity-60';

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-syntax-border bg-syntax-inset px-4 text-sm text-syntax-text outline-none transition placeholder:text-syntax-muted focus:border-syntax-accent/40 disabled:opacity-60';

export function BugReportView(): ReactElement {
  const { t, locale } = useTranslation();
  const { user } = useAuthSession();
  const [email, setEmail] = useState(user?.email ?? '');
  const [whatHappened, setWhatHappened] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedVsActual, setExpectedVsActual] = useState('');
  const [browserOs, setBrowserOs] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const resetForm = (): void => {
    setWhatHappened('');
    setStepsToReproduce('');
    setExpectedVsActual('');
    setBrowserOs('');
    setValidationError(null);
    setSubmitError(null);
    setIsSent(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const hasContent =
      whatHappened.trim().length > 0 ||
      stepsToReproduce.trim().length > 0 ||
      expectedVsActual.trim().length > 0;

    if (!hasContent) {
      setValidationError(t('bugValidation'));
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await submitSupportForm({
        type: 'bug',
        locale,
        email: email.trim() || undefined,
        whatHappened,
        stepsToReproduce,
        expectedVsActual,
        browserOs,
      });
      setIsSent(true);
    } catch (error) {
      setSubmitError(
        error instanceof FeedbackServiceError ? error.message : t('bugSendError'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="mx-auto w-full max-w-2xl animate-fade-in">
        <div className="rounded-3xl border border-syntax-accent/25 bg-syntax-accent/5 px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-syntax-accent/30 bg-syntax-accent/10 text-syntax-accent">
            <BugIcon className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold text-syntax-text">{t('bugSentTitle')}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-syntax-muted">
            {t('bugSentHint')}
          </p>
          <button
            className="mt-6 h-11 rounded-full border border-syntax-border bg-syntax-card px-6 text-sm font-medium text-syntax-text transition hover:border-syntax-accent/30"
            onClick={resetForm}
            type="button"
          >
            {t('supportSendAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl animate-fade-in">
      <header className="mb-8">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-syntax-accent/25 bg-syntax-accent/10 text-syntax-accent">
          <BugIcon className="h-5 w-5" />
        </div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-syntax-accent">
          {t('topBarReportBug')}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-syntax-text">
          {t('bugPageTitle')}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-syntax-muted">
          {t('bugPageSubtitle')}
        </p>
      </header>

      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-syntax-text">
            {t('feedbackFieldEmail')}
          </span>
          <input
            autoComplete="email"
            className={INPUT_CLASS}
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('feedbackFieldEmailPlaceholder')}
            type="email"
            value={email}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-syntax-text">
            {t('bugFieldWhatHappened')}
          </span>
          <textarea
            className={TEXTAREA_CLASS}
            disabled={isSubmitting}
            onChange={(event) => setWhatHappened(event.target.value)}
            placeholder={t('bugFieldPlaceholder')}
            value={whatHappened}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-syntax-text">
            {t('bugFieldSteps')}
          </span>
          <textarea
            className={TEXTAREA_CLASS}
            disabled={isSubmitting}
            onChange={(event) => setStepsToReproduce(event.target.value)}
            placeholder={t('bugFieldPlaceholder')}
            value={stepsToReproduce}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-syntax-text">
            {t('bugFieldExpected')}
          </span>
          <textarea
            className={TEXTAREA_CLASS}
            disabled={isSubmitting}
            onChange={(event) => setExpectedVsActual(event.target.value)}
            placeholder={t('bugFieldPlaceholder')}
            value={expectedVsActual}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-syntax-text">
            {t('bugFieldBrowser')}
          </span>
          <input
            className={INPUT_CLASS}
            disabled={isSubmitting}
            onChange={(event) => setBrowserOs(event.target.value)}
            placeholder={t('bugFieldBrowserPlaceholder')}
            type="text"
            value={browserOs}
          />
        </label>

        {validationError || submitError ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {validationError ?? submitError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <button
            className="h-12 rounded-full bg-syntax-accent px-8 text-sm font-semibold text-syntax-accent-fg transition hover:bg-syntax-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t('bugSubmitting') : t('bugSubmit')}
          </button>
          <p className="text-xs text-syntax-muted">{t('bugSubmitHint')}</p>
        </div>
      </form>
    </div>
  );
}
