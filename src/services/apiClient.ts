import { API_BASE_URL } from '../constants/api';
import { getDeviceToken } from '../storage/authStorage';

export { API_BASE_URL };

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
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
