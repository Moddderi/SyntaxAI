import { API_BASE_URL } from '../constants/api';
import { getDeviceToken } from '../storage/authStorage';

export { API_BASE_URL };

const DEFAULT_TIMEOUT_MS = 10_000;
/** AI + cold Railway starts can exceed the default. */
const LONG_TIMEOUT_MS = 60_000;

export function isLongApiPath(path: string): boolean {
  return path.includes('/api/v1/ai/');
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;
  const timeoutMs = isLongApiPath(normalizedPath) ? LONG_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const externalSignal = options.signal;
  const onExternalAbort = (): void => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } finally {
    window.clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export async function apiFetchAuthed(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getDeviceToken();

  if (!token) {
    return new Response(JSON.stringify({ error: 'missing_token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return apiFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
