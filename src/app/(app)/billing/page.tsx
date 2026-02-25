'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    id: 'basic' as const,
    name: 'Basic',
    price: '$49/mo',
    features: ['1 ad account', 'Web chat', 'All 73 tools', 'Unlimited queries'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$149/mo',
    features: ['5 ad accounts', 'Web chat', 'All 73 tools', 'Priority support'],
    popular: true,
  },
  {
    id: 'agency' as const,
    name: 'Agency',
    price: '$349/mo',
    features: [
      'Unlimited ad accounts',
      'Web chat + Claude Desktop MCP',
      'All 73 tools',
      'API key access',
      'Dedicated support',
    ],
  },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function subscribe(plan: 'basic' | 'pro' | 'agency') {
    setLoading(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  async function manageSubscription() {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Pricing</h1>
      <p className="text-muted-foreground mb-8">
        Choose a plan that fits your advertising needs.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`p-6 flex flex-col ${
              plan.popular ? 'border-primary shadow-md' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {plan.popular && <Badge>Most Popular</Badge>}
            </div>
            <p className="text-3xl font-bold mb-4">{plan.price}</p>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <span className="text-primary">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => subscribe(plan.id)}
              disabled={loading !== null}
              variant={plan.popular ? 'default' : 'outline'}
              className="w-full"
            >
              {loading === plan.id ? 'Redirecting...' : 'Subscribe'}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button variant="link" onClick={manageSubscription}>
          Manage existing subscription
        </Button>
      </div>
    </div>
  );
}
