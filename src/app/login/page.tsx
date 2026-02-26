import { signIn } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white overflow-hidden">
      <div className="flex min-h-screen">
        {/* Left Panel - Hidden on mobile */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12">
          <div className="aurora">
            <div className="aurora-orb aurora-orb-1"></div>
            <div className="aurora-orb aurora-orb-2"></div>
            <div className="aurora-orb aurora-orb-3"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-16">
              <span className="text-3xl font-bold">
                <span className="text-white">Ady</span>
                <span className="gradient-text">nami</span>
              </span>
            </div>

            <h1 className="text-4xl font-bold mb-12 leading-tight">
              The fastest way to<br />
              <span className="gradient-text">run Meta ads</span>
            </h1>

            <div className="space-y-6 mb-16">
              <div className="flex items-start gap-4">
                <span className="text-2xl">&#x26A1;</span>
                <p className="text-gray-300 text-lg">Launch campaigns in seconds</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">&#x1F3AF;</span>
                <p className="text-gray-300 text-lg">Diagnose zero-conversion campaigns instantly</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">&#x1F4CA;</span>
                <p className="text-gray-300 text-lg">Demographic and placement breakdowns on demand</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-2xl">&#x1F501;</span>
                <p className="text-gray-300 text-lg">Audience building, creative testing, signal recovery — all in chat</p>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <p className="text-gray-400 italic mb-3">
                &quot;I cut my weekly Ads Manager time from 6 hours to under 30 minutes.&quot;
              </p>
              <p className="text-sm text-gray-500">
                — Sarah K., Head of Growth
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 lg:p-10 shadow-2xl">
              <div className="flex items-center gap-2 mb-8">
                <span className="text-xl font-bold">
                  <span className="text-white">Ady</span>
                  <span className="gradient-text">nami</span>
                </span>
              </div>

              <h2 className="text-3xl font-bold mb-3">Sign in to Adynami</h2>
              <p className="text-gray-400 mb-8">
                Connect your Meta account to get started. No Ads Manager required.
              </p>

              {/* Meta OAuth Button */}
              <form
                action={async () => {
                  'use server';
                  await signIn('facebook', { redirectTo: '/chat' });
                }}
              >
                <button
                  type="submit"
                  className="w-full gradient-bg text-white font-semibold py-4 px-6 rounded-xl glow-btn flex items-center justify-center gap-3 mb-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Meta
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mb-6">
                We request read and write access to your Meta Ads account. You can revoke access at any time from your Meta Business settings.
              </p>

              {/* Trust Signals */}
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-8 flex-wrap">
                <span className="flex items-center gap-1">
                  &#x1F512; 256-bit encryption
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  &#x1F6E1; Meta API Partner
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  &#x2713; SOC 2 Compliant
                </span>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">
                  7-day free trial. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
