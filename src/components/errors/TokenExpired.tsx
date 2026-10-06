'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface TokenExpiredProps {
  accountName?: string;
  /** Pick another connected account (shown only when one exists). */
  onSwitch?: () => void;
  /** Remove this account — for when the user no longer has access to it in Meta. */
  onDisconnect: () => Promise<void>;
}

export default function TokenExpired({ accountName, onSwitch, onDisconnect }: TokenExpiredProps) {
  const [faqOpen, setFaqOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await onDisconnect();
    } catch (e) {
      setError((e as Error).message);
      setDisconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6 overflow-y-auto py-6">
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
          Your Meta access token for this account has expired. Meta requires re-authentication every
          60 days. If you no longer have access to this ad account, disconnect it instead.
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
              account. If your access to the account was removed in Meta, reconnecting can&apos;t
              restore it — disconnect the account here.
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

        {onSwitch && (
          <button
            onClick={onSwitch}
            className="block w-full py-3 rounded-xl font-semibold text-center border border-white/20 hover:bg-white/5 transition-colors mb-3"
          >
            Switch to a different account
          </button>
        )}

        <button
          onClick={disconnect}
          disabled={disconnecting}
          className="block w-full py-2.5 rounded-xl text-sm font-medium text-center text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          {disconnecting ? 'Disconnecting…' : 'I no longer have access — disconnect it'}
        </button>
        {error && <p className="text-xs text-red-400 text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}
