'use client';

import { useState, useEffect } from 'react';
import { Check, Lock, Plus } from 'lucide-react';
import { PLAN_LIMITS } from '@/lib/plans';

const plans = {
  basic: {
    name: 'Starter',
    monthly: 49,
    annual: 39,
    features: [
      '1 Meta ad account',
      '100 AI conversations/month',
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
      '400 AI conversations/month',
      'Everything in Starter',
      'Zero-conversion diagnostics',
      'Creative performance analysis',
      'Priority support',
    ],
  },
  agency: {
    name: 'Agency',
    monthly: 349,
    annual: 279,
    features: [
      'Unlimited ad accounts',
      '1,000 AI conversations/month',
      'Everything in Pro',
      'Team seats (5 users)',
      'Claude MCP Integration',
      'Dedicated support',
    ],
  },
};

type PlanId = keyof typeof plans;

const topupPacks = [
  { pack: '25' as const, calls: 25, price: 19 },
  { pack: '100' as const, calls: 100, price: 59 },
  { pack: '250' as const, calls: 250, price: 119 },
];

interface UserData {
  plan: string;
  bonusCalls: number;
}

interface UsageData {
  apiCalls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostCents: number;
}

export default function BillingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/user').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/usage').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([userRes, usageRes]) => {
        if (userRes?.user) {
          setUserData({ plan: userRes.user.plan, bonusCalls: userRes.user.bonusCalls ?? 0 });
        }
        if (usageRes) {
          setUsageData({
            apiCalls: usageRes.apiCalls ?? 0,
            inputTokens: usageRes.inputTokens ?? 0,
            outputTokens: usageRes.outputTokens ?? 0,
            estimatedCostCents: usageRes.estimatedCostCents ?? 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  const currentPlan = (userData?.plan ?? 'trial') as PlanId | 'trial';
  const currentPlanConfig =
    currentPlan !== 'trial' && currentPlan in plans ? plans[currentPlan as PlanId] : null;
  const planLimits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.trial;

  const getPrice = (plan: (typeof plans)[PlanId]) =>
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

  async function buyTopup(pack: string) {
    setLoading(`topup-${pack}`);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'topup', pack }),
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

  const apiCalls = usageData?.apiCalls ?? 0;
  const callLimit = planLimits.monthlyApiCalls;
  const bonusCalls = userData?.bonusCalls ?? 0;
  const usagePercent = Math.min(100, Math.round((apiCalls / callLimit) * 100));

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
                    {currentPlanConfig ? `${currentPlanConfig.name} Plan` : 'Trial'}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Current
                  </span>
                </div>
                {currentPlanConfig ? (
                  <p className="text-2xl font-bold">
                    ${currentPlanConfig.monthly}
                    <span className="text-base text-gray-400 font-normal"> / month</span>
                  </p>
                ) : (
                  <p className="text-2xl font-bold">Free Trial</p>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  {callLimit} AI conversations/month
                  {bonusCalls > 0 && ` + ${bonusCalls} bonus calls`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {currentPlan !== 'agency' && (
                <button
                  onClick={() => {
                    if (currentPlan === 'trial' || currentPlan === 'basic') subscribe('pro');
                    else subscribe('agency');
                  }}
                  className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  {currentPlan === 'trial' || currentPlan === 'basic'
                    ? 'Upgrade to Pro'
                    : 'Upgrade to Agency'}
                </button>
              )}
              {currentPlan !== 'trial' && (
                <button
                  onClick={manageSubscription}
                  className="px-6 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors font-medium text-sm"
                >
                  Manage Subscription
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Usage */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">
            Usage — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">AI Conversations</h3>
              {dataLoading ? (
                <p className="text-3xl font-bold mb-1">—</p>
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1">
                    {apiCalls}{' '}
                    <span className="text-base text-gray-400 font-normal">/ {callLimit}</span>
                  </p>
                  <div className="w-full bg-white/10 rounded-full h-2 mt-3 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-purple-500'}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{usagePercent}% used this month</p>
                </>
              )}
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Bonus Calls</h3>
              {dataLoading ? (
                <p className="text-3xl font-bold mb-1">—</p>
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1">{bonusCalls}</p>
                  <p className="text-xs text-gray-500">
                    {bonusCalls > 0
                      ? 'Available credits (never expire)'
                      : 'Purchase credit packs below'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Top Up */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-2">Top Up</h2>
          <p className="text-sm text-gray-400 mb-6">
            Need more conversations? Buy credit packs — they never expire and are used after your
            monthly allowance runs out.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {topupPacks.map(({ pack, calls, price }) => (
              <div
                key={pack}
                className="glass-card rounded-xl p-5 flex flex-col items-center text-center"
              >
                <div className="flex items-center gap-1 mb-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span className="text-2xl font-bold">{calls}</span>
                </div>
                <p className="text-sm text-gray-400 mb-3">conversations</p>
                <p className="text-lg font-semibold mb-4">${price}</p>
                <button
                  onClick={() => buyTopup(pack)}
                  disabled={loading !== null}
                  className="w-full py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors font-medium text-sm"
                >
                  {loading === `topup-${pack}` ? 'Redirecting...' : 'Buy'}
                </button>
              </div>
            ))}
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
            {(Object.entries(plans) as [PlanId, (typeof plans)[PlanId]][]).map(([id, plan]) => (
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
                  {id === 'basic'
                    ? '3-day free trial · Then billed monthly'
                    : 'Billed monthly · Cancel anytime'}
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
                      (id === 'pro' && (currentPlan === 'basic' || currentPlan === 'trial')) ||
                      id === 'agency'
                        ? 'gradient-bg hover:opacity-90'
                        : 'border border-white/20 hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    {loading === id
                      ? 'Redirecting...'
                      : Object.keys(plans).indexOf(id) >
                          Object.keys(plans).indexOf(currentPlan as PlanId)
                        ? `Upgrade to ${plan.name}`
                        : `Switch to ${plan.name}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Payment Method */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
          <div className="glass-card rounded-xl p-6">
            <p className="font-medium mb-2">Manage via Stripe</p>
            <p className="text-sm text-gray-400 mb-6">
              View and update your payment method, download invoices, and manage your subscription
              through the Stripe billing portal.
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
              Are you sure? You&apos;ll lose access to your current plan features at the end of the
              billing period.
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
