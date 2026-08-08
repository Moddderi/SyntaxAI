import type { SiteType } from '../types/context';

export function resolveSiteType(url: string): SiteType {
  let hostname = '';

  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return 'general';
  }

  if (hostname.includes('github.com')) {
    return 'github';
  }

  if (hostname.includes('stackoverflow.com') || hostname.includes('stackexchange.com')) {
    return 'stackoverflow';
  }

  if (hostname.includes('developer.mozilla.org') || hostname === 'mdn.dev') {
    return 'mdn';
  }

  if (hostname.includes('dev.to')) {
    return 'devto';
  }

  return 'general';
}
