export const PLAN_LIMITS = {
  trial: { adAccounts: 1, hasMcp: false },
  basic: { adAccounts: 1, hasMcp: false },
  pro: { adAccounts: 5, hasMcp: false },
  agency: { adAccounts: Infinity, hasMcp: true },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export function isTrialExpired(plan: string, trialEndsAt: Date | null): boolean {
  if (plan !== 'trial') return false;
  if (!trialEndsAt) return true;
  return new Date() > trialEndsAt;
}

export function canAddAccount(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].adAccounts;
}
