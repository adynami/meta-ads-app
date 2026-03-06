import { describe, it, expect } from 'vitest';
import { isTrialExpired, canAddAccount, PLAN_LIMITS, OVERAGE_RATES } from './plans';

describe('isTrialExpired', () => {
  it('returns false for non-trial plan', () => {
    expect(isTrialExpired('basic', new Date(0))).toBe(false);
    expect(isTrialExpired('pro', null)).toBe(false);
  });

  it('returns false for trial with future date', () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(isTrialExpired('trial', future)).toBe(false);
  });

  it('returns true for trial with past date', () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(isTrialExpired('trial', past)).toBe(true);
  });

  it('returns true for trial with null date', () => {
    expect(isTrialExpired('trial', null)).toBe(true);
  });
});

describe('canAddAccount', () => {
  it('trial: allows 0, blocks 1+', () => {
    expect(canAddAccount('trial', 0)).toBe(true);
    expect(canAddAccount('trial', 1)).toBe(false);
  });

  it('basic: allows 0, blocks 1+', () => {
    expect(canAddAccount('basic', 0)).toBe(true);
    expect(canAddAccount('basic', 1)).toBe(false);
  });

  it('pro: allows up to 4, blocks 5+', () => {
    expect(canAddAccount('pro', 4)).toBe(true);
    expect(canAddAccount('pro', 5)).toBe(false);
  });

  it('agency: allows any count', () => {
    expect(canAddAccount('agency', 100)).toBe(true);
  });
});

describe('PLAN_LIMITS', () => {
  it('has correct credit allotments', () => {
    expect(PLAN_LIMITS.trial.monthlyCredits).toBe(25);
    expect(PLAN_LIMITS.basic.monthlyCredits).toBe(75);
    expect(PLAN_LIMITS.pro.monthlyCredits).toBe(250);
    expect(PLAN_LIMITS.agency.monthlyCredits).toBe(650);
  });
});

describe('OVERAGE_RATES', () => {
  it('has tiered overage rates', () => {
    expect(OVERAGE_RATES.basic).toBe(0.9);
    expect(OVERAGE_RATES.pro).toBe(0.75);
    expect(OVERAGE_RATES.agency).toBe(0.6);
  });
});
