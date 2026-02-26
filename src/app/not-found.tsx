import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        {/* 404 Gradient Number */}
        <h1 className="text-[10rem] leading-none font-bold gradient-text mono mb-4">
          404
        </h1>

        {/* Heading */}
        <h2 className="text-2xl font-bold mb-3">
          This page doesn&apos;t exist.
        </h2>

        {/* Description */}
        <p className="text-gray-400 mb-8">
          The URL you visited isn&apos;t valid. Head back to the chat to
          continue.
        </p>

        {/* Back to Chat Button */}
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 gradient-bg px-6 py-3 rounded-xl font-semibold glow-btn transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Chat
        </Link>

        {/* Settings Link */}
        <div className="mt-4">
          <Link
            href="/settings"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Go to settings
          </Link>
        </div>
      </div>

      {/* Terminal Block */}
      <div className="mt-16 w-full max-w-lg">
        <div className="glass-card rounded-xl p-6">
          <div className="mono text-sm space-y-1">
            <p className="text-gray-400">
              <span className="text-gray-500">&gt;</span> GET /unknown-path
              HTTP/1.1
            </p>
            <p className="text-gray-400">
              <span className="text-gray-500">&gt;</span> 404 Not Found
            </p>
            <p className="text-purple-400">
              <span className="text-gray-500">&gt;</span> No ad campaigns were
              harmed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
