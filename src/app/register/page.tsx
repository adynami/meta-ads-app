'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    period: '/mo',
    description: 'Best for solo founders and small teams managing a single ad account.',
    accounts: '1 ad account',
    features: [
      '100 conversations/month',
      'Campaign creation & management',
      'Performance reporting & breakdowns',
      'Audience builder',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    period: '/mo',
    description: 'Best for growth teams and media buyers running multiple accounts.',
    accounts: '5 ad accounts',
    features: [
      '400 conversations/month',
      'Everything in Starter',
      'Bulk operations across accounts',
      'Zero-conversion diagnostics',
      'Creative performance analysis',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 349,
    period: '/mo',
    description: 'Best for agencies and teams managing client portfolios at scale.',
    accounts: 'Unlimited accounts',
    features: [
      '1,000 conversations/month',
      'Everything in Pro',
      'Team seats (up to 5 users)',
      'White-label reporting exports',
      'Claude MCP Integration',
      'Dedicated support',
    ],
    popular: false,
  },
];

export default function RegisterPage() {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  return (
    <div className="min-h-screen bg-[#08080f] text-white overflow-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#08080f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-white">Ady</span>
              <span className="gradient-text">nami</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Step 1 of 2</span>
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="w-1/2 h-full gradient-bg rounded-full progress-bar-fill" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen pt-14">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-12">
          <div className="aurora">
            <div className="aurora-orb aurora-orb-1" />
            <div className="aurora-orb aurora-orb-2" />
            <div className="aurora-orb aurora-orb-3" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-16">
              <span className="text-3xl font-bold">
                <span className="text-white">Ady</span>
                <span className="gradient-text">nami</span>
              </span>
            </div>

            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Start controlling your
              <br />
              Meta ads with <span className="gradient-text">conversation</span>
            </h1>
            <p className="text-gray-400 text-lg mb-12">
              Pick a plan, connect your account, and launch your first campaign in minutes.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium mb-1">Full API access</p>
                  <p className="text-gray-400 text-sm">
                    Read and write to your Meta Ads account directly from chat.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium mb-1">7-day free trial</p>
                  <p className="text-gray-400 text-sm">
                    No credit card required to start. Cancel anytime.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium mb-1">73 ad tools, one interface</p>
                  <p className="text-gray-400 text-sm">
                    Campaigns, audiences, creatives, diagnostics, reporting, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <p className="text-gray-400 italic mb-3">
                &quot;I cut my weekly Ads Manager time from 6 hours to under 30 minutes.&quot;
              </p>
              <p className="text-sm text-gray-500">— Sarah K., Head of Growth</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Plan Selector */}
        <div className="w-full lg:w-[58%] flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg slide-enter">
            <h2 className="text-3xl font-bold mb-3">Choose your plan</h2>
            <p className="text-gray-400 mb-8">
              All plans include a 7-day free trial. No credit card required.
            </p>

            <div className="space-y-4 mb-8">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left glass-card rounded-2xl p-6 relative transition-all duration-300 cursor-pointer ${
                    selectedPlan === plan.id
                      ? 'border-purple-500/60 bg-white/[0.06] shadow-[0_0_40px_rgba(124,58,237,0.15)]'
                      : 'hover:bg-white/[0.04] hover:border-white/15'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 right-6 gradient-bg px-3 py-0.5 rounded-full text-xs font-semibold">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Radio selector */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selectedPlan === plan.id ? 'border-purple-500' : 'border-white/30'
                          }`}
                        >
                          {selectedPlan === plan.id && (
                            <div className="w-2.5 h-2.5 rounded-full gradient-bg" />
                          )}
                        </div>
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                      </div>
                      <p className="text-gray-400 text-sm ml-8 mb-3">{plan.description}</p>
                      <div className="ml-8 flex flex-wrap gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                          {plan.accounts}
                        </span>
                        {plan.features.slice(0, 2).map((feature) => (
                          <span
                            key={feature}
                            className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-400 text-sm">{plan.period}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected plan features */}
            <div className="glass-card rounded-xl p-5 mb-8">
              <p className="text-sm font-medium mb-3 gradient-text">
                {plans.find((p) => p.id === selectedPlan)?.name} plan includes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plans
                  .find((p) => p.id === selectedPlan)
                  ?.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
              </div>
            </div>

            {/* Continue Button */}
            <Link href="/login" className="block">
              <button className="w-full gradient-bg text-white font-semibold py-4 px-6 rounded-xl glow-btn flex items-center justify-center gap-3 text-lg">
                Continue with {plans.find((p) => p.id === selectedPlan)?.name}
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>

            <p className="text-xs text-gray-500 text-center mt-4">
              7-day free trial. You&apos;ll connect your Meta account on the next step.
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-6 flex-wrap">
              <span className="flex items-center gap-1">&#x1F512; 256-bit encryption</span>
              <span>·</span>
              <span className="flex items-center gap-1">&#x1F6E1; Meta API Partner</span>
              <span>·</span>
              <span>Cancel anytime</span>
            </div>

            <p className="text-center mt-6">
              <span className="text-sm text-gray-400">Already have an account? </span>
              <Link href="/login" className="text-sm gradient-text font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
