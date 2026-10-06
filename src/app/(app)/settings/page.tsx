'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Check, AlertTriangle, Lock, Plus, Copy } from 'lucide-react';
import { AlertsSettings } from '@/components/settings/AlertsSettings';

interface ApiKey {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

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
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [disconnectingAccount, setDisconnectingAccount] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchUserPlan();
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

  async function fetchUserPlan() {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setPlan(data.user.plan || '');
        const [first, ...rest] = (data.user.name || '').split(' ');
        setFirstName(first || '');
        setLastName(rest.join(' ') || '');
        setEmail(data.user.email || '');
      }
    } catch {}
  }

  useEffect(() => {
    if (plan === 'agency') {
      fetchKeys();
    }
  }, [plan]);

  async function fetchKeys() {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {}
  }

  async function generateKey() {
    setGenerating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newKeyLabel || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedKey(data.key);
        setNewKeyLabel('');
        await fetchKeys();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function revokeKey(id: string) {
    const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl font-bold">
                  {getInitials(`${firstName} ${lastName}`.trim()) || 'U'}
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white input-focus transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
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
                      value={email}
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
            <button
              onClick={async () => {
                setProfileSaving(true);
                try {
                  const res = await fetch('/api/user', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: `${firstName} ${lastName}`.trim() }),
                  });
                  if (res.ok) {
                    setProfileSaved(true);
                    setTimeout(() => setProfileSaved(false), 2000);
                  }
                } finally {
                  setProfileSaving(false);
                }
              }}
              disabled={profileSaving}
              className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {profileSaved ? (
                <>
                  <Check className="w-4 h-4" /> Saved
                </>
              ) : profileSaving ? (
                'Saving...'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Connected Ad Accounts */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-2">Connected Ad Accounts</h2>
          <p className="text-sm text-gray-400 mb-6">
            Meta ad accounts connected to your Adynami workspace.
          </p>

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
                    <div
                      className={`p-4 flex items-center justify-between ${expired ? 'bg-amber-500/10' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${GRADIENT_COLORS[index % GRADIENT_COLORS.length]} flex items-center justify-center text-sm font-bold`}
                        >
                          {getInitials(account.metaAccountName || account.metaAdAccountId)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {account.metaAccountName || account.metaAdAccountId}
                          </p>
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
                <span className="inline-block gradient-bg px-3 py-1 rounded-lg text-sm font-semibold mb-2">
                  Current Plan
                </span>
                <p className="text-sm text-gray-400 mt-1">
                  Manage your subscription and billing details.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/billing">
                <button className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                  View Plans & Billing
                </button>
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              To cancel or download invoices, use the Stripe billing portal.
            </p>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        <AlertsSettings />

        <div className="h-px bg-white/10 mb-12"></div>

        {/* API Access */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold">API Keys</h2>
            {plan !== 'agency' && (
              <>
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">
                  Agency Plan
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Generate API keys to use Adynami programmatically or integrate with Claude AI via MCP.
          </p>

          {plan !== 'agency' ? (
            <>
              <div className="glass-card rounded-xl p-6 opacity-50 pointer-events-none">
                <div className="bg-white/5 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-500 blur-sm">
                    ady_sk_xxxxxxxxxxxxxxxxxxxx
                  </span>
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
            </>
          ) : (
            <div className="glass-card rounded-xl p-6">
              {/* Existing keys */}
              {keys.length > 0 && (
                <div className="space-y-3 mb-6">
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      className="bg-white/5 rounded-lg px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{k.label || 'Unnamed key'}</p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(k.createdAt).toLocaleDateString()}
                          {k.lastUsedAt &&
                            ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <button
                        onClick={() => revokeKey(k.id)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Newly created key warning */}
              {newlyCreatedKey && (
                <div className="mb-6 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <p className="text-sm font-medium text-amber-400 mb-2">
                    Save this key — it will not be shown again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-black/30 rounded px-3 py-2 break-all">
                      {newlyCreatedKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Generate new key */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="Key label (optional)"
                  className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white text-sm input-focus transition-all"
                />
                <button
                  onClick={generateKey}
                  disabled={generating}
                  className="gradient-bg px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate New Key'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-white/10 mb-12"></div>

        {/* Danger Zone */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-red-400">Danger Zone</h2>
          <div className="danger-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
            <p className="text-sm text-gray-400 mb-4">
              Permanently delete your Adynami account and all associated data. This cannot be
              undone.
            </p>

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
                  <label className="block text-sm text-gray-400 mb-2">
                    Type <span className="font-mono text-red-400">DELETE</span> to confirm
                  </label>
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
                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                    onClick={async () => {
                      setDeleting(true);
                      try {
                        const res = await fetch('/api/user', { method: 'DELETE' });
                        if (res.ok) {
                          await signOut({ callbackUrl: '/' });
                        }
                      } finally {
                        setDeleting(false);
                      }
                    }}
                    className="px-6 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
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
              Are you sure? This will remove Adynami&apos;s access to this Meta account. You can
              reconnect it later.
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
