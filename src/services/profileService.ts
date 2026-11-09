import { apiFetchAuthed } from './apiClient';
import { getSessionCache, saveSessionCache } from '../storage/authStorage';
import type { SyntaxAiSessionUser } from '../types/api';

export class ProfileServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ProfileServiceError';
    this.status = status;
  }
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  plan: string;
}

function parseMeResponse(body: unknown): MeResponse | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const record = body as Record<string, unknown>;

  if (
    typeof record.id !== 'string' ||
    typeof record.email !== 'string' ||
    typeof record.name !== 'string' ||
    typeof record.plan !== 'string'
  ) {
    return null;
  }

  return {
    id: record.id,
    email: record.email,
    name: record.name,
    plan: record.plan,
  };
}

/**
 * PATCH display name via api.syntaxai.app and mirror into local session cache.
 */
export async function updateDisplayName(name: string): Promise<SyntaxAiSessionUser> {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new ProfileServiceError('Name is required', 400);
  }

  const response = await apiFetchAuthed('/api/v1/me', {
    method: 'PATCH',
    body: JSON.stringify({ name: trimmed }),
  });

  if (response.status === 401) {
    throw new ProfileServiceError('Unauthorized', 401);
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      typeof (body as Record<string, unknown>).error === 'string'
        ? ((body as Record<string, unknown>).error as string)
        : 'Failed to update name';
    throw new ProfileServiceError(message, response.status);
  }

  const me = parseMeResponse(body);

  if (!me) {
    throw new ProfileServiceError('Invalid profile response', 502);
  }

  const user: SyntaxAiSessionUser = {
    id: me.id,
    email: me.email,
    name: me.name,
    plan: me.plan,
  };

  const cached = await getSessionCache();

  if (cached) {
    await saveSessionCache({
      ...cached,
      user: {
        ...cached.user,
        ...user,
      },
    });
  }

  return user;
}
