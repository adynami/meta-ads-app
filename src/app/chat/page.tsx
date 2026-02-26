'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ChevronDown, Bell, Settings, Menu, X, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import NoAccount from '@/components/errors/NoAccount';
import TokenExpired from '@/components/errors/TokenExpired';
import TrialExpired from '@/components/errors/TrialExpired';

interface AdAccount {
  id: string;
  metaAdAccountId: string;
  metaAccountName: string | null;
  isActive: boolean;
  tokenExpiresAt: string | null;
}

interface UserStatus {
  plan: string;
  trialEndsAt: string | null;
  name: string | null;
  image: string | null;
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

function isTokenExpiredCheck(account: AdAccount): boolean {
  if (!account.tokenExpiresAt) return false;
  return new Date(account.tokenExpiresAt) < new Date();
}

function isTrialExpiredCheck(user: UserStatus | null): boolean {
  if (!user || user.plan !== 'trial') return false;
  if (!user.trialEndsAt) return true;
  return new Date() > new Date(user.trialEndsAt);
}

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/accounts').then((r) => (r.ok ? r.json() : { accounts: [] })),
      fetch('/api/user').then((r) => (r.ok ? r.json() : { user: null })),
    ])
      .then(([accountsData, userData]) => {
        const accts = accountsData.accounts || [];
        setAccounts(accts);
        if (accts.length > 0) {
          setSelectedAccountId(accts[0].id);
        }
        setUserStatus(userData.user || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const tokenExpired = selectedAccount && isTokenExpiredCheck(selectedAccount);

  // Full-page error states (shown instead of chat)
  if (!loading && isTrialExpiredCheck(userStatus)) {
    return <TrialExpired />;
  }

  if (!loading && accounts.length === 0) {
    return <NoAccount />;
  }

  const userName = userStatus?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#08080f] text-white flex overflow-hidden">
      {/* TokenExpired modal overlay — shown on top of the chat layout */}
      {tokenExpired && (
        <TokenExpired
          accountName={selectedAccount!.metaAccountName || selectedAccount!.metaAdAccountId}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`w-[260px] h-screen bg-[#0d0d1a] border-r border-white/5 flex flex-col transition-all duration-300 fixed z-40 lg:relative ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo & New Chat */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold">
                <span className="text-white">Ady</span>
                <span className="gradient-text">nami</span>
              </span>
            </Link>
            <button className="block lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <button
            className="w-full py-2.5 px-4 rounded-lg border border-white/20 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium gradient-border"
            onClick={() => window.location.reload()}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Ad Accounts */}
          <div className="p-4 border-b border-white/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-3">
              Ad Accounts
            </p>
            <div className="space-y-1">
              {accounts.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No accounts connected</p>
              ) : (
                accounts.map((account, i) => (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                      selectedAccountId === account.id
                        ? 'bg-white/5 border-l-2 border-purple-500'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]} flex items-center justify-center text-xs font-bold`}
                    >
                      {getInitials(account.metaAccountName || account.metaAdAccountId)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {account.metaAccountName || account.metaAdAccountId}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-500'}`}
                        ></span>
                        <span className="text-[10px] text-gray-500">
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/onboarding">
              <button className="mt-4 flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                <Plus className="w-4 h-4" /> Connect Account
              </button>
            </Link>
          </div>
        </div>

        {/* User Profile - Pinned Bottom */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-bold">
              {userInitial}
            </div>
            <div>
              <p className="text-sm font-medium">{userName}</p>
            </div>
          </div>
          <Link href="/settings">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Chat Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="block lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="w-5 h-5 text-gray-400" />
            </button>

            {selectedAccount ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <div
                  className={`w-6 h-6 rounded bg-gradient-to-br ${GRADIENT_COLORS[accounts.indexOf(selectedAccount) % GRADIENT_COLORS.length]} flex items-center justify-center text-[10px] font-bold`}
                >
                  {getInitials(
                    selectedAccount.metaAccountName || selectedAccount.metaAdAccountId,
                  )}
                </div>
                <span className="text-sm font-medium">
                  {selectedAccount.metaAccountName || selectedAccount.metaAdAccountId}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-400">Adynami</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
            <Link href="/billing" className="text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Chat Area */}
        <main className="flex-1 min-h-0">
          <ChatWindow />
        </main>
      </div>
    </div>
  );
}
