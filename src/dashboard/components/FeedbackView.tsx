import { useState, type FormEvent, type ReactElement } from 'react';
import { buildFeedbackMailto } from '../../constants/support';
import { useTranslation } from '../../hooks/useTranslation';
import { PRO_PLAN } from '../../utils/usageLimits';
import { SparklesIcon } from './icons';

const TEXTAREA_CLASS =
  'min-h-[120px] w-full resize-y rounded-xl border border-syntax-border bg-syntax-inset px-4 py-3 text-sm leading-relaxed text-syntax-text outline-none transition placeholder:text-syntax-muted focus:border-syntax-accent/40';

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-syntax-border bg-syntax-inset px-4 text-sm text-syntax-text outline-none transition placeholder:text-syntax-muted focus:border-syntax-accent/40';

export function FeedbackView(): ReactElement {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [workedWell, setWorkedWell] = useState('');
  const [confusing, setConfusing] = useState('');
  const [featureWish, setFeatureWish] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
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

    const mailtoUrl = buildFeedbackMailto({
      email,
      workedWell,
      confusing,
      featureWish,
    });

    window.location.href = mailtoUrl;
  };

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
        <p className="text-sm font-medium text-syntax-text">{t('betaModalRewardTitle')}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-syntax-muted">
          {t('betaModalRewardBody', {
            reward: t('betaModalRewardHighlight'),
            price: PRO_PLAN.priceLabel,
            period: PRO_PLAN.periodLabel,
          })}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-syntax-text">
            {t('feedbackFieldEmail')}
          </span>
          <input
            autoComplete="email"
            className={INPUT_CLASS}
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
            onChange={(event) => setFeatureWish(event.target.value)}
            placeholder={t('feedbackFieldPlaceholder')}
            value={featureWish}
          />
        </label>

        {validationError ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {validationError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <button
            className="h-12 rounded-full bg-syntax-accent px-8 text-sm font-semibold text-syntax-accent-fg transition hover:bg-syntax-accent/90"
            type="submit"
          >
            {t('feedbackSubmit')}
          </button>
          <p className="text-xs text-syntax-muted">{t('feedbackSentHint')}</p>
        </div>
      </form>
    </div>
  );
}
