import { API_BASE_URL } from '../constants/api';

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
