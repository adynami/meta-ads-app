'use client';

import Link from 'next/link';
import { Plug } from 'lucide-react';

export default function NoAccount() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Plug Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full gradient-outline flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#08080f] flex items-center justify-center">
              <Plug className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold mb-3">Connect Your First Ad Account</h1>

        {/* Description */}
        <p className="text-gray-400 mb-8">
          Adynami needs access to at least one Meta ad account before you can start chatting.
        </p>

        {/* Connect Button */}
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 gradient-bg px-8 py-3 rounded-xl font-semibold glow-btn transition-all"
        >
          Connect Meta Account
        </Link>

        {/* Setup Guide Link */}
        <div className="mt-4">
          <Link
            href="/docs#quick-start"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            View setup guide
          </Link>
        </div>
      </div>
    </div>
  );
}
