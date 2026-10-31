let billingLimitsEnforced = false;

export function setBillingLimitsEnforced(enabled: boolean): void {
  billingLimitsEnforced = enabled;
}

/** When false (beta), Free/Pro caps are ignored. */
export function areBillingLimitsEnforced(): boolean {
  return billingLimitsEnforced;
}
