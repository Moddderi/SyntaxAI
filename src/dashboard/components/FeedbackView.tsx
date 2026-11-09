import { useState, type FormEvent, type ReactElement } from 'react';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useTranslation } from '../../hooks/useTranslation';
import {
  FeedbackServiceError,
  submitSupportForm,
} from '../../services/feedbackService';
import { PRO_PLAN } from '../../utils/usageLimits';
import { SparklesIcon } from './icons';

const TEXTAREA_CLASS =
  'min-h-[120px] w-full resize-y rounded-xl border border-syntax-border bg-syntax-inset px-4 py-3 text-sm leading-relaxed text-syntax-text outline-none transition placeholder:text-syntax-muted focus:border-syntax-accent/40 disabled:opacity-60';

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-syntax-border bg-syntax-inset px-4 text-sm text-syntax-text outline-none transition placeholder:text-syntax-muted focus:border-syntax-accent/40 disabled:opacity-60';

export function FeedbackView(): ReactElement {
  const { t, locale } = useTranslation();
  const { billingEnabled, user } = useAuthSession();
  const [email, setEmail] = useState(user?.email ?? '');
  const [workedWell, setWorkedWell] = useState('');
  const [confusing, setConfusing] = useState('');
  const [featureWish, setFeatureWish] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const resetForm = (): void => {
    setWorkedWell('');
    setConfusing('');
    setFeatureWish('');
    setValidationError(null);
    setSubmitError(null);
    setIsSent(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const hasContent =
      workedWell.trim().length > 0 ||
      confusing.trim().length > 0 ||
      featureWish.trim().length > 0;

    if (!hasContent) {
      setValidationError(t('feedbackValidation'));
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await submitSupportForm({
        type: 'feedback',
        locale,
        email: email.trim() || undefined,
        workedWell,
        confusing,
        featureWish,
      });
      setIsSent(true);
    } catch (error) {
      setSubmitError(
        error instanceof FeedbackServiceError
          ? error.message
          : t('feedbackSendError'),
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
            <SparklesIcon className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold text-syntax-text">{t('feedbackSentTitle')}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-syntax-muted">
            {t('feedbackSentHint')}
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
          <SparklesIcon className="h-5 w-5" />
        </div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-syntax-accent">
          {t('betaModalEarlyAccess')}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-syntax-text">
          {t('feedbackPageTitle')}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-syntax-muted">
          {t('feedbackPageSubtitle')}
        </p>
      </header>

      <div className="mb-8 rounded-2xl border border-syntax-accent/20 bg-syntax-accent/5 p-5">
        {billingEnabled ? (
          <>
            <p className="text-sm font-medium text-syntax-text">{t('betaModalRewardTitle')}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-syntax-muted">
              {t('betaModalRewardBody', {
                reward: t('betaModalRewardHighlight'),
                price: PRO_PLAN.priceLabel,
                period: PRO_PLAN.periodLabel,
              })}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-syntax-text">{t('betaModalThanksTitle')}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-syntax-muted">
              {t('betaModalThanksBody')}
            </p>
          </>
        )}
      </div>

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
            {t('feedbackFieldWorkedWell')}
          </span>
          <textarea
            className={TEXTAREA_CLASS}
            disabled={isSubmitting}
            onChange={(event) => setWorkedWell(event.target.value)}
            placeholder={t('feedbackFieldPlaceholder')}
            value={workedWell}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-syntax-text">
            {t('feedbackFieldConfusing')}
          </span>
          <textarea
            className={TEXTAREA_CLASS}
            disabled={isSubmitting}
            onChange={(event) => setConfusing(event.target.value)}
            placeholder={t('feedbackFieldPlaceholder')}
            value={confusing}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-syntax-text">
            {t('feedbackFieldFeature')}
          </span>
          <textarea
            className={TEXTAREA_CLASS}
            disabled={isSubmitting}
            onChange={(event) => setFeatureWish(event.target.value)}
            placeholder={t('feedbackFieldPlaceholder')}
            value={featureWish}
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
            {isSubmitting ? t('feedbackSubmitting') : t('feedbackSubmit')}
          </button>
          <p className="text-xs text-syntax-muted">{t('feedbackSubmitHint')}</p>
        </div>
      </form>
    </div>
  );
}
