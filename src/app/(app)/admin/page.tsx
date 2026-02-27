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

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function fetchData() {
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

  useEffect(() => {
    fetchData();
  }, []);

  async function patchUser(userId: string, updates: Record<string, unknown>) {
    setUpdating(userId);
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });
      await fetchData();
    } finally {
      setUpdating(null);
    }
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-1">Total Users</p>
            <p className="text-2xl font-bold">{summary.totalUsers}</p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-1">API Calls</p>
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
                <th className="text-right px-4 py-3 text-gray-400 font-medium">API Calls</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Cost</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Bonus Calls</th>
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
                        const amount = window.prompt('Add bonus calls:', '10');
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
    </div>
  );
}
