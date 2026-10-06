'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Settings, CreditCard, LogOut, Menu, X, Shield } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.isAdmin) setIsAdmin(true);
        if (data.user?.name) setUserName(data.user.name);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/billing', label: 'Billing', icon: CreditCard },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <div className="h-dvh bg-[#08080f] text-white flex overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-white/5 p-2 rounded-lg border border-white/10"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`w-[260px] h-dvh bg-[#0d0d1a] border-r border-white/5 flex flex-col fixed z-40 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold">
                <span className="text-white">Ady</span>
                <span className="gradient-text">nami</span>
              </span>
            </Link>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/5 border-l-2 border-purple-500 text-white'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-1" />

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-bold">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName || 'User'}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      {/* The shell is h-dvh + overflow-hidden, so the content column must scroll itself. */}
      <div className="flex-1 min-w-0 h-dvh overflow-y-auto lg:ml-[260px]">{children}</div>
    </div>
  );
}
