import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });
  }
  return stripeClient;
}

export const PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  agency: process.env.STRIPE_AGENCY_PRICE_ID!,
} as const;

export type PricePlan = keyof typeof PRICE_IDS;

export const ANNUAL_PRICE_IDS: Record<PricePlan, string | undefined> = {
  basic: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID,
  pro: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  agency: process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID,
};

export const CREDIT_PACK_PRICE_IDS = {
  '12': process.env.STRIPE_CREDIT_PACK_12_PRICE_ID!,
  '45': process.env.STRIPE_CREDIT_PACK_45_PRICE_ID!,
  '120': process.env.STRIPE_CREDIT_PACK_120_PRICE_ID!,
} as const;

export type CreditPack = keyof typeof CREDIT_PACK_PRICE_IDS;

export const CREDIT_PACK_AMOUNTS: Record<string, number> = {
  [process.env.STRIPE_CREDIT_PACK_12_PRICE_ID!]: 12,
  [process.env.STRIPE_CREDIT_PACK_45_PRICE_ID!]: 45,
  [process.env.STRIPE_CREDIT_PACK_120_PRICE_ID!]: 120,
};
