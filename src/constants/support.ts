export const SUPPORT_EMAIL = 'hello@syntaxai.app';

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

export function buildBetaFeedbackMailto(): string {
  const subject = encodeURIComponent('SyntaxAI — Beta feedback');
  const body = encodeURIComponent(
    [
      'What I liked:',
      '',
      '',
      'What felt confusing or broken:',
      '',
      '',
      'One feature I wish SyntaxAI had:',
      '',
    ].join('\n'),
  );

  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
