import { apiFetchAuthed } from './apiClient';
import type { Locale } from '../storage/localeStorage';

export type FeedbackType = 'feedback' | 'bug';

export interface FeedbackPayload {
  type: 'feedback';
  locale: Locale;
  email?: string;
  workedWell?: string;
  confusing?: string;
  featureWish?: string;
}

export interface BugReportPayload {
  type: 'bug';
  locale: Locale;
  email?: string;
  whatHappened?: string;
  stepsToReproduce?: string;
  expectedVsActual?: string;
  browserOs?: string;
}

export type SupportFormPayload = FeedbackPayload | BugReportPayload;

export class FeedbackServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedbackServiceError';
  }
}

interface FeedbackApiResponse {
  ok?: boolean;
  error?: string;
}

export async function submitSupportForm(payload: SupportFormPayload): Promise<void> {
  const response = await apiFetchAuthed('/api/v1/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new FeedbackServiceError('Sign in to SyntaxAI to send feedback.');
  }

  if (response.status === 503) {
    throw new FeedbackServiceError('Feedback is temporarily unavailable. Try again later.');
  }

  let body: FeedbackApiResponse = {};

  try {
    body = (await response.json()) as FeedbackApiResponse;
  } catch {
    // ignore parse errors
  }

  if (!response.ok) {
    throw new FeedbackServiceError(
      typeof body.error === 'string' && body.error.trim()
        ? body.error
        : `Failed to send (${response.status}).`,
    );
  }
}
