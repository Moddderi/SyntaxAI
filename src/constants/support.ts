export const SUPPORT_EMAIL = 'hello@syntaxai.app';

export const BETA_FEEDBACK_EMAIL = 'olegk9813@gmail.com';

export interface FeedbackFormPayload {
  email: string;
  workedWell: string;
  confusing: string;
  featureWish: string;
}

export function buildBugReportMailto(): string {
  const subject = encodeURIComponent('SyntaxAI — Bug report');
  const body = encodeURIComponent(
    [
      'Describe what happened:',
      '',
      '',
      'Steps to reproduce:',
      '1.',
      '2.',
      '',
      'Expected vs actual:',
      '',
      '',
      'Browser / OS:',
    ].join('\n'),
  );

  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export function buildFeedbackMailto(payload: FeedbackFormPayload): string {
  const subject = encodeURIComponent('SyntaxAI — Beta feedback');
  const lines = [
    payload.email.trim() ? `From: ${payload.email.trim()}` : '',
    '',
    'What worked well:',
    payload.workedWell.trim(),
    '',
    'What felt confusing or broken:',
    payload.confusing.trim(),
    '',
    'One feature I wish SyntaxAI had:',
    payload.featureWish.trim(),
  ];

  const body = encodeURIComponent(lines.join('\n'));

  return `mailto:${BETA_FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}
