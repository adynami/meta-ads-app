'use client';

import { useState } from 'react';
import { Check, Lock } from 'lucide-react';

const plans = {
  basic: {
    name: 'Starter',
    monthly: 49,
    annual: 39,
    features: [
      '1 Meta ad account',
      'Unlimited conversations',
      'Campaign management',
      'Performance reporting',
      'Audience builder',
      'Automated rules',
    ],
  },
  pro: {
    name: 'Pro',
    monthly: 149,
    annual: 119,
    features: [
      '5 Meta ad accounts',
      'Everything in Starter',
      'Zero-conversion diagnostics',
      'Creative performance analysis',
      'Advanced breakdowns',
      'Priority support',
    ],
  },
  agency: {
    name: 'Agency',
    monthly: 349,
    annual: 279,
    features: [
      'Unlimited ad accounts',
      'Everything in Pro',
      'Team seats (5 users)',
      'White-label exports',
      'Claude MCP Integration',
      'Dedicated support',
    ],
  },
};

type PlanId = keyof typeof plans;

export default function BillingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // In production, this would come from the session/API
  const [currentPlan] = useState<PlanId>('pro');

  const getPrice = (plan: typeof plans[PlanId]) =>
    billingPeriod === 'monthly' ? plan.monthly : plan.annual;

  async function subscribe(plan: PlanId) {
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
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1000px] p-8 lg:p-12">
        <h1 className="text-3xl font-bold mb-8">Billing</h1>

        {/* Current Plan */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Current Plan</h2>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-block gradient-bg px-3 py-1 rounded-lg text-sm font-semibold">
                    {plans[currentPlan].name} Plan
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Current
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  ${plans[currentPlan].monthly}
                  <span className="text-base text-gray-400 font-normal"> / month</span>
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {currentPlan === 'basic' && '1 ad account · Unlimited conversations · Campaign management'}
                  {currentPlan === 'pro' && 'Up to 5 ad accounts · Unlimited conversations · Creative diagnostics · Priority support'}
                  {currentPlan === 'agency' && 'Unlimited ad accounts · Team seats · White-label exports · Dedicated support'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {currentPlan !== 'agency' && (
                <button
                  onClick={() => subscribe(currentPlan === 'basic' ? 'pro' : 'agency')}
                  className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  {currentPlan === 'basic' ? 'Upgrade to Pro' : 'Upgrade to Agency'}
                </button>
              )}
              <button
                onClick={manageSubscription}
                className="px-6 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors font-medium text-sm"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Plan Comparison */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Compare Plans</h2>
            <div className="flex gap-2 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingPeriod === 'monthly' ? 'gradient-bg' : 'hover:bg-white/5'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingPeriod === 'annual' ? 'gradient-bg' : 'hover:bg-white/5'
                }`}
              >
                Annual <span className="text-green-400 ml-1">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(Object.entries(plans) as [PlanId, typeof plans[PlanId]][]).map(([id, plan]) => (
              <div
                key={id}
                className={`glass-card rounded-xl p-6 ${currentPlan === id ? 'current-plan-card relative' : ''}`}
              >
                {currentPlan === id && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/30">
                    Current Plan
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  {billingPeriod === 'annual' && (
                    <span className="text-gray-500 line-through text-sm mr-2">${plan.monthly}</span>
                  )}
                  <span className="text-3xl font-bold">${getPrice(plan)}</span>
                  <span className="text-gray-400 text-sm"> /mo</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  {id === 'basic' ? '7-day free trial · Then billed monthly' : 'Billed monthly · Cancel anytime'}
                </p>
                <ul className="space-y-2 mb-6 min-h-[200px]">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {currentPlan === id ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg bg-white/5 font-medium text-sm text-gray-500 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => subscribe(id)}
                    disabled={loading !== null}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-opacity ${
                      (id === 'pro' && currentPlan === 'basic') || (id === 'agency')
                        ? 'gradient-bg hover:opacity-90'
                        : 'border border-white/20 hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    {loading === id
                      ? 'Redirecting...'
                      : Object.keys(plans).indexOf(id) > Object.keys(plans).indexOf(currentPlan)
                        ? `Upgrade to ${plan.name}`
                        : `Downgrade to ${plan.name}`
                    }
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Usage */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Usage — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">&#x1F4AC;</div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Conversations</h3>
              <p className="text-3xl font-bold mb-1">—</p>
              <p className="text-xs text-gray-500">this month</p>
              <p className="text-xs text-purple-400 mt-2">No limit on {plans[currentPlan].name}</p>
            </div>

            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">&#x26A1;</div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Commands Executed</h3>
              <p className="text-3xl font-bold mb-1">—</p>
              <p className="text-xs text-gray-500">this month</p>
              <p className="text-xs text-purple-400 mt-2">No limit on {plans[currentPlan].name}</p>
            </div>

            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">&#x1F4CA;</div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">API Calls</h3>
              <p className="text-3xl font-bold mb-1">—</p>
              <p className="text-xs text-gray-500">this month</p>
              <p className="text-xs text-purple-400 mt-2">No limit on {plans[currentPlan].name}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">No limits on Pro or Agency plans.</p>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Payment Method */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
          <div className="glass-card rounded-xl p-6">
            <p className="font-medium mb-2">Manage via Stripe</p>
            <p className="text-sm text-gray-400 mb-6">
              View and update your payment method, download invoices, and manage your subscription through the Stripe billing portal.
            </p>
            <button
              onClick={manageSubscription}
              className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity mb-4"
            >
              Open Billing Portal
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              <span>Payments secured by</span>
              <span className="font-semibold text-purple-400">Stripe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="glass-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Cancel Subscription?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure? You&apos;ll lose access to your current plan features at the end of the billing period.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-6 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium text-sm"
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-6 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors font-medium text-sm"
              >
                Keep Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
