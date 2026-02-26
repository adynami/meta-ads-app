'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  TrendingUp,
  BarChart3,
  Target,
  Send,
  Shield,
  Lock,
} from 'lucide-react';

interface AdAccount {
  id: string;           // act_xxxxx
  name: string;
  account_status: number;
  currency: string;
}

const permissionBullets = [
  'Read campaign, ad set, and ad performance data',
  'Create and modify campaigns on your behalf',
  'Manage audiences and custom conversions',
];

const suggestionCards = [
  {
    icon: Search,
    title: 'Find underperformers',
    description: 'Which campaigns have spent over $100 with no conversions this week?',
  },
  {
    icon: TrendingUp,
    title: 'Scale winners',
    description: 'Increase budget by 20% on my top 3 ROAS campaigns.',
  },
  {
    icon: BarChart3,
    title: 'Get a breakdown',
    description: 'Show me a demographic breakdown of my best campaign this month.',
  },
  {
    icon: Target,
    title: 'Build an audience',
    description: 'Create a 1% lookalike from my website purchasers in the US.',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Fetch accounts from Meta when entering step 2
  useEffect(() => {
    if (step === 2) {
      setLoadingAccounts(true);
      fetch('/api/meta/ad-accounts')
        .then((res) => {
          if (res.status === 401) {
            window.location.href = '/login';
            return null;
          }
          if (res.ok) return res.json();
          return { accounts: [] };
        })
        .then((data) => {
          if (data) setAccounts(data.accounts || []);
        })
        .catch(() => {
          setAccounts([]);
        })
        .finally(() => {
          setLoadingAccounts(false);
        });
    }
  }, [step]);

  const getInitials = (name: string | null, id: string) => {
    if (name) {
      return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return id.slice(-2).toUpperCase();
  };

  const gradientColors = [
    'from-purple-500 to-pink-600',
    'from-cyan-500 to-blue-600',
    'from-orange-500 to-red-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
  ];

  return (
    <div className="min-h-screen bg-[#08080f] text-white overflow-hidden relative">
      {/* Aurora Background */}
      <div className="aurora">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#08080f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-white">Ady</span>
              <span className="gradient-text">nami</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Step {step} of 3</span>
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full gradient-bg rounded-full progress-bar-fill"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center pt-14 pb-8 px-6">
        <div className="w-full max-w-xl">
          {/* ── Step 1: Connect Meta Account ── */}
          {step === 1 && (
            <div className="slide-enter">
              <div className="flex justify-center mb-8">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: '#1877F2' }}
                >
                  <svg
                    className="w-10 h-10 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-center mb-3">
                Connect Your Meta Account
              </h2>
              <p className="text-gray-400 text-center mb-8">
                Adynami needs access to your Meta Ads account to read data and
                execute actions on your behalf.
              </p>

              <div className="glass-card rounded-2xl p-6 mb-8">
                <p className="text-sm font-medium text-gray-300 mb-4">
                  Permissions requested:
                </p>
                <div className="space-y-3">
                  {permissionBullets.map((perm) => (
                    <div key={perm} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-300">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full gradient-bg text-white font-semibold py-4 px-6 rounded-xl glow-btn flex items-center justify-center gap-3 text-lg mb-6"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Connect with Meta
              </button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  256-bit encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Revocable anytime
                </span>
              </div>
            </div>
          )}

          {/* ── Step 2: Select Ad Account ── */}
          {step === 2 && (
            <div className="slide-enter">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <h2 className="text-3xl font-bold mb-3">
                Which account do you want to start with?
              </h2>
              <p className="text-gray-400 mb-8">
                Select the Meta ad account you&apos;d like to manage first. You can
                add more later.
              </p>

              {loadingAccounts ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-gray-400 text-sm">
                    Loading your ad accounts...
                  </p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 mb-2">
                    No ad accounts found
                  </p>
                  <p className="text-gray-500 text-sm">
                    Make sure you have at least one Meta ad account linked to
                    your business.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mb-8">
                  {accounts.map((account, index) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccount(account.id)}
                      className={`w-full text-left glass-card rounded-xl p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer ${
                        selectedAccount === account.id
                          ? 'border-purple-500/60 bg-white/[0.06] shadow-[0_0_30px_rgba(124,58,237,0.12)]'
                          : 'hover:bg-white/[0.04] hover:border-white/15'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                          gradientColors[index % gradientColors.length]
                        } flex items-center justify-center text-sm font-bold flex-shrink-0`}
                      >
                        {getInitials(account.name, account.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {account.name || 'Unnamed Account'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {account.id}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedAccount === account.id
                            ? 'border-purple-500'
                            : 'border-white/30'
                        }`}
                      >
                        {selectedAccount === account.id && (
                          <div className="w-2.5 h-2.5 rounded-full gradient-bg" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={async () => {
                  if (!selectedAccount) return;
                  setSaving(true);
                  try {
                    const res = await fetch('/api/meta/ad-accounts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ selectedAccountId: selectedAccount }),
                    });
                    if (res.status === 401) {
                      window.location.href = '/login';
                      return;
                    }
                    if (!res.ok) {
                      const data = await res.json();
                      alert(data.error || 'Failed to save account');
                      return;
                    }
                    setStep(3);
                  } catch {
                    alert('Something went wrong. Please try again.');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={!selectedAccount || saving}
                className={`w-full font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 text-lg transition-all ${
                  selectedAccount && !saving
                    ? 'gradient-bg text-white glow-btn'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Step 3: First Conversation ── */}
          {step === 3 && (
            <div className="slide-enter">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Check className="w-8 h-8 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-center mb-3">
                You&apos;re all set. Let&apos;s start.
              </h2>
              <p className="text-gray-400 text-center mb-8">
                Try one of these to see Adynami in action, or type your own
                command.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {suggestionCards.map((card) => (
                  <div
                    key={card.title}
                    className="glass-card glass-card-hover rounded-xl p-4 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                      <card.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="font-medium text-sm mb-1">{card.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Custom Input */}
              <div className="glass-card rounded-xl p-1.5 flex items-center gap-2 mb-8">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Or type your own command..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none px-4 py-3"
                />
                <button className="gradient-bg p-3 rounded-lg flex-shrink-0 hover:opacity-90 transition-opacity">
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>

              <Link href="/chat" className="block">
                <button className="w-full gradient-bg text-white font-semibold py-4 px-6 rounded-xl glow-btn flex items-center justify-center gap-3 text-lg">
                  Go to Chat
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
