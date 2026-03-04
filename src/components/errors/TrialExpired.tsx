'use client';

import Link from 'next/link';
import { Lock, X } from 'lucide-react';

export default function TrialExpired() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white flex items-center justify-center px-6">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full gradient-outline flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#08080f] flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold mb-3">Your Trial Has Ended</h1>

        {/* Description */}
        <p className="text-gray-400 mb-8">
          Your 7-day free trial has expired. Upgrade to a plan to continue managing your Meta ad
          accounts with Adynami.
        </p>

        {/* What you'll lose */}
        <div className="text-left mb-8">
          <p className="text-sm font-semibold text-gray-300 mb-3">What you&apos;ll lose</p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-gray-400">
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
              Access to connected ad accounts
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-400">
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
              Conversation history
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-400">
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
              Campaign management capabilities
            </li>
          </ul>
        </div>

        {/* Choose a Plan Button */}
        <Link
          href="/billing"
          className="block w-full gradient-bg py-3 rounded-xl font-semibold glow-btn text-center transition-all"
        >
          Choose a Plan
        </Link>

        {/* Talk to us */}
        <button className="mt-4 text-sm text-gray-400 hover:text-white transition-colors">
          Talk to us
        </button>

        {/* Reassurance */}
        <p className="mt-6 text-xs text-gray-500">
          Your data and conversation history are preserved for 30 days.
        </p>
      </div>
    </div>
  );
}
