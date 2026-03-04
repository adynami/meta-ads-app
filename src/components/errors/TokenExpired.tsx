'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface TokenExpiredProps {
  accountName?: string;
}

export default function TokenExpired({ accountName }: TokenExpiredProps) {
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full">
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center mb-3">
          Reconnect {accountName || 'Your Account'}
        </h1>

        {/* Description */}
        <p className="text-gray-400 text-center mb-6">
          Your Meta access token has expired. Meta requires re-authentication every 60 days to keep
          your account secure.
        </p>

        {/* FAQ Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setFaqOpen(!faqOpen)}
            className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-white transition-colors py-2"
          >
            <span>Why does this happen?</span>
            {faqOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {faqOpen && (
            <div className="text-sm text-gray-500 mt-2 leading-relaxed">
              Meta access tokens expire every 60 days as a security measure. This is a standard
              requirement of the Meta Marketing API and applies to all third-party applications.
              Re-authenticating takes less than 30 seconds and restores full access to your ad
              account.
            </div>
          )}
        </div>

        {/* Reconnect Button */}
        <Link
          href="/onboarding"
          className="block w-full gradient-bg py-3 rounded-xl font-semibold glow-btn text-center transition-all mb-3"
        >
          Reconnect with Meta
        </Link>

        {/* Switch Account Button */}
        <Link
          href="/settings"
          className="block w-full py-3 rounded-xl font-semibold text-center border border-white/20 hover:bg-white/5 transition-colors"
        >
          Switch to a different account
        </Link>
      </div>
    </div>
  );
}
