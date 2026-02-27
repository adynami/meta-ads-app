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

export const TOPUP_PRICE_IDS = {
  '25': process.env.STRIPE_TOPUP_25_PRICE_ID!,
  '100': process.env.STRIPE_TOPUP_100_PRICE_ID!,
  '250': process.env.STRIPE_TOPUP_250_PRICE_ID!,
} as const;

export type TopupPack = keyof typeof TOPUP_PRICE_IDS;

export const TOPUP_AMOUNTS: Record<string, number> = {
  [process.env.STRIPE_TOPUP_25_PRICE_ID!]: 25,
  [process.env.STRIPE_TOPUP_100_PRICE_ID!]: 100,
  [process.env.STRIPE_TOPUP_250_PRICE_ID!]: 250,
};
