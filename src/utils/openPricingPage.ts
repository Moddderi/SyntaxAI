import { PRICING_URL } from '../constants/api';

export function openPricingPage(): void {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    void chrome.tabs.create({ url: PRICING_URL });
    return;
  }

  window.open(PRICING_URL, '_blank', 'noopener,noreferrer');
}
