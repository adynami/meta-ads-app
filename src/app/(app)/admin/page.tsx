'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  bonusCalls: number;
  isAdmin: boolean;
  createdAt: string;
  apiCalls: number;
  estimatedCostCents: number;
}

interface Summary {
  totalUsers: number;
  totalCostCents: number;
  totalApiCalls: number;
  month: string;
}

interface WaitlistEntry {
  id: number;
  email: string;
  source: string | null;
  createdAt: string;
}

type Tab = 'users' | 'waitlist';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        router.replace('/chat');
        return;
      }
      const data = await res.json();
      setUsers(data.users);
      setSummary(data.summary);
    } catch {
      router.replace('/chat');
    } finally {
      setLoading(false);
    }
  }

  async function fetchWaitlist() {
    setWaitlistLoading(true);
    try {
      const res = await fetch('/api/admin/waitlist');
      if (res.ok) {
        const data = await res.json();
        setWaitlistEntries(data.entries);
        setWaitlistCount(data.count);
      }
    } finally {
      setWaitlistLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (tab === 'waitlist' && waitlistEntries.length === 0 && !waitlistLoading) {
      fetchWaitlist();
    }
  }, [tab]);

  async function patchUser(userId: string, updates: Record<string, unknown>) {
    setUpdating(userId);
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });
      await fetchUsers();
    } finally {
      setUpdating(null);
    }
  }

  function exportCsv() {
    const header = 'Email,Source,Date';
    const rows = waitlistEntries.map(
      (e) => `"${e.email}","${e.source ?? ''}","${new Date(e.createdAt).toISOString()}"`,
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'users'
              ? 'bg-purple-500/20 text-purple-300'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab('waitlist')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'waitlist'
              ? 'bg-purple-500/20 text-purple-300'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          Waitlist
          {waitlistCount > 0 && (
            <span className="bg-purple-500/30 text-purple-200 text-xs px-2 py-0.5 rounded-full">
              {waitlistCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'users' && (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-card rounded-xl p-5">
                <p className="text-sm text-gray-400 mb-1">Total Users</p>
                <p className="text-2xl font-bold">{summary.totalUsers}</p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <p className="text-sm text-gray-400 mb-1">Credits Used</p>
                <p className="text-2xl font-bold">{summary.totalApiCalls.toLocaleString()}</p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <p className="text-sm text-gray-400 mb-1">Total Cost</p>
                <p className="text-2xl font-bold">${(summary.totalCostCents / 100).toFixed(2)}</p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <p className="text-sm text-gray-400 mb-1">Month</p>
                <p className="text-2xl font-bold">{summary.month}</p>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Plan</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Credits</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Cost</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">
                      Bonus Credits
                    </th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Admin</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{user.name || '—'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.plan}
                          onChange={(e) => patchUser(user.id, { plan: e.target.value })}
                          disabled={updating === user.id}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
                        >
                          <option value="trial">Trial</option>
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                          <option value="agency">Agency</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {user.apiCalls.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        ${(user.estimatedCostCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums">{user.bonusCalls}</span>
                        <button
                          onClick={() => {
                            const amount = window.prompt('Add bonus credits:', '10');
                            if (amount && !isNaN(Number(amount))) {
                              patchUser(user.id, { bonusCalls: user.bonusCalls + Number(amount) });
                            }
                          }}
                          disabled={updating === user.id}
                          className="ml-2 text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                        >
                          + Add
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => patchUser(user.id, { isAdmin: !user.isAdmin })}
                          disabled={updating === user.id}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            user.isAdmin
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {user.isAdmin ? 'Admin' : 'User'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {updating === user.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'waitlist' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              {waitlistCount} {waitlistCount === 1 ? 'entry' : 'entries'}
            </p>
            {waitlistEntries.length > 0 && (
              <button
                onClick={exportCsv}
                className="text-sm px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                Export CSV
              </button>
            )}
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            {waitlistLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500" />
              </div>
            ) : waitlistEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No waitlist entries yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Source</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlistEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">{entry.email}</td>
                        <td className="px-4 py-3 text-gray-400">{entry.source ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(entry.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
