import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Early Access',
  description:
    'Join 847+ marketers getting early access to Adynami — AI that manages your Meta ads through conversation. Priority onboarding + 3-day free trial.',
  alternates: { canonical: '/early-access' },
};

export default function EarlyAccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
