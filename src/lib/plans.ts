export const PLAN_LIMITS = {
  trial: { adAccounts: 1, hasMcp: false, monthlyCredits: 25 },
  basic: { adAccounts: 1, hasMcp: false, monthlyCredits: 75 },
  pro: { adAccounts: 5, hasMcp: false, monthlyCredits: 250 },
  agency: { adAccounts: Infinity, hasMcp: true, monthlyCredits: 650 },
} as const;

/** Per-credit overage rate in dollars, by plan */
export const OVERAGE_RATES: Record<Plan, number> = {
  trial: 0.9,
  basic: 0.9,
  pro: 0.75,
  agency: 0.6,
};

export type Plan = keyof typeof PLAN_LIMITS;

export function isTrialExpired(plan: string, trialEndsAt: Date | null): boolean {
  if (plan !== 'trial') return false;
  if (!trialEndsAt) return true;
  return new Date() > trialEndsAt;
}

export function canAddAccount(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].adAccounts;
}
