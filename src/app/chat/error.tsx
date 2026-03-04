'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#08080f] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full gradient-outline flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#08080f] flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">Chat encountered an error</h1>

        <p className="text-gray-400 mb-2">Something went wrong during your conversation.</p>
        {error.message && <p className="text-sm text-gray-500 mb-8 break-words">{error.message}</p>}

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 gradient-bg px-8 py-3 rounded-xl font-semibold glow-btn transition-all"
          >
            Retry
          </button>
          <Link href="/chat" className="text-sm text-gray-400 hover:text-white transition-colors">
            New Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
