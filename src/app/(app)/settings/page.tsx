'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Check, AlertTriangle, Lock, ChevronDown, Plus, X } from 'lucide-react';

interface AdAccount {
  id: string;
  metaAdAccountId: string;
  metaAccountName: string | null;
  isActive: boolean;
  tokenExpiresAt: string | null;
}

const GRADIENT_COLORS = [
  'from-pink-500 to-purple-600',
  'from-orange-500 to-red-600',
  'from-cyan-500 to-blue-600',
  'from-green-500 to-teal-600',
  'from-yellow-500 to-orange-600',
];

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('adynami_theme') || 'dark';
    return 'dark';
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('adynami_email_notif') !== 'false';
    return true;
  });
  const [timeRange, setTimeRange] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('adynami_time_range') || '7';
    return '7';
  });
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [disconnectingAccount, setDisconnectingAccount] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function disconnectAccount(id: string) {
    await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setDisconnectingAccount(null);
  }

  function isTokenExpired(account: AdAccount): boolean {
    if (!account.tokenExpiresAt) return false;
    return new Date(account.tokenExpiresAt) < new Date();
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[800px] p-8 lg:p-12">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Profile Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Profile</h2>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl font-bold mb-2">
                  U
                </div>
                <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 mx-auto">
                  <Upload className="w-3 h-3" />
                  Upload photo
                </button>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="First name"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white input-focus transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Last name"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white input-focus transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      placeholder="email@example.com"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white opacity-60"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-400">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Connected Ad Accounts */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-2">Connected Ad Accounts</h2>
          <p className="text-sm text-gray-400 mb-6">Meta ad accounts connected to your Adynami workspace.</p>

          {loading ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-gray-400">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-gray-400 mb-4">No ad accounts connected yet.</p>
              <Link href="/onboarding">
                <button className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                  Connect Meta Account
                </button>
              </Link>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden mb-4">
              {accounts.map((account, index) => {
                const expired = isTokenExpired(account);
                return (
                  <div key={account.id}>
                    <div className={`p-4 flex items-center justify-between ${expired ? 'bg-amber-500/10' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]} flex items-center justify-center text-sm font-bold`}>
                          {getInitials(account.metaAccountName || account.metaAdAccountId)}
                        </div>
                        <div>
                          <p className="font-medium">{account.metaAccountName || account.metaAdAccountId}</p>
                          <p className="text-xs text-gray-500">ID: {account.metaAdAccountId}</p>
                          {expired && (
                            <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              Access token expired. Click Reconnect to reauthorize.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!expired ? (
                          <>
                            <span className="flex items-center gap-1.5 text-xs text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Active
                            </span>
                            <button
                              onClick={() => setDisconnectingAccount(account.id)}
                              className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-1.5 text-xs text-amber-400">
                              <AlertTriangle className="w-3 h-3" />
                              Expired
                            </span>
                            <Link href="/onboarding">
                              <button className="px-4 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors">
                                Reconnect
                              </button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                    {index < accounts.length - 1 && <div className="h-px bg-white/5"></div>}
                  </div>
                );
              })}
            </div>
          )}

          <Link href="/onboarding">
            <button className="w-full py-3 px-4 rounded-lg border border-white/20 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4" />
              Connect Another Meta Account
            </button>
          </Link>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Plan & Subscription */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Plan & Subscription</h2>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block gradient-bg px-3 py-1 rounded-lg text-sm font-semibold mb-2">Current Plan</span>
                <p className="text-sm text-gray-400 mt-1">Manage your subscription and billing details.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/billing">
                <button className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                  View Plans & Billing
                </button>
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">To cancel or download invoices, use the Stripe billing portal.</p>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* API Access */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">Agency Plan</span>
          </div>
          <p className="text-sm text-gray-400 mb-6">Generate API keys to use Adynami programmatically or integrate with Claude AI via MCP.</p>

          <div className="glass-card rounded-xl p-6 opacity-50 pointer-events-none">
            <div className="bg-white/5 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-sm font-mono text-gray-500 blur-sm">ady_sk_xxxxxxxxxxxxxxxxxxxx</span>
              <button className="text-sm text-gray-500">Copy</button>
            </div>
            <button className="px-6 py-2.5 rounded-lg border border-white/20 text-sm font-medium">
              Generate New Key
            </button>
          </div>

          <Link href="/billing">
            <button className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity mt-4">
              Upgrade to Agency to unlock
            </button>
          </Link>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Preferences */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Preferences</h2>
          <div className="glass-card rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Theme</label>
              <div className="flex gap-2">
                {['dark', 'light', 'system'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      theme === t
                        ? 'gradient-bg'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Summaries</p>
                <p className="text-xs text-gray-400">Receive weekly performance summaries via email</p>
              </div>
              <div
                className={`toggle-switch ${emailNotifications ? 'active' : ''}`}
                onClick={() => setEmailNotifications(!emailNotifications)}
              >
                <div className="toggle-knob"></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Default Time Range</label>
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white appearance-none cursor-pointer input-focus"
                >
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('adynami_theme', theme);
                localStorage.setItem('adynami_email_notif', String(emailNotifications));
                localStorage.setItem('adynami_time_range', timeRange);
                setPrefsSaved(true);
                setTimeout(() => setPrefsSaved(false), 2000);
              }}
              className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {prefsSaved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Preferences'}
            </button>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Danger Zone */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-red-400">Danger Zone</h2>
          <div className="danger-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
            <p className="text-sm text-gray-400 mb-4">Permanently delete your Adynami account and all associated data. This cannot be undone.</p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2.5 rounded-lg border-2 border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors font-medium text-sm"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type <span className="font-mono text-red-400">DELETE</span> to confirm</label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-white/5 border border-red-500/50 rounded-lg px-4 py-2 text-white input-focus"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    disabled={deleteConfirmText !== 'DELETE'}
                    className="px-6 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="px-6 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {disconnectingAccount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="glass-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Disconnect Account?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure? This will remove Adynami&apos;s access to this Meta account. You can reconnect it later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => disconnectAccount(disconnectingAccount)}
                className="flex-1 px-6 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium text-sm"
              >
                Yes, Disconnect
              </button>
              <button
                onClick={() => setDisconnectingAccount(null)}
                className="flex-1 px-6 py-2.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
