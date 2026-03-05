import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MousePointerClick, Clock, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Adynami - AI-Powered Meta Ads Management',
  description:
    'Learn how Adynami replaces Ads Manager with conversational AI. Manage Meta campaigns, audiences, and analytics through natural language.',
  alternates: { canonical: '/about' },
};

export default function About() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08080f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              <span className="text-white">Ady</span>
              <span className="gradient-text">nami</span>
            </span>
            <span className="w-2 h-2 rounded-full gradient-bg pulse-dot"></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Features
            </Link>
            <Link
              href="/#use-cases"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Use Cases
            </Link>
            <Link
              href="/#pricing"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Pricing
            </Link>
            <Link href="/about" className="text-white transition-colors text-sm">
              About
            </Link>
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors text-sm">
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-400 hover:text-white transition-colors text-sm hidden md:block"
            >
              Login
            </Link>
            <Link href="/register">
              <button className="gradient-bg px-5 py-2.5 rounded-lg font-medium text-sm glow-btn">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="aurora">
          <div className="aurora-orb aurora-orb-1"></div>
          <div className="aurora-orb aurora-orb-2"></div>
          <div className="aurora-orb aurora-orb-3"></div>
        </div>
        <div className="dot-pattern absolute inset-0 opacity-30"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest gradient-text mb-6">
            About Adynami
          </p>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            What Is <span className="gradient-text">Adynami</span>?
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Adynami is a conversational interface for Meta advertising. It connects directly to your
            Meta Ads account and lets you manage campaigns, pull reports, build audiences, and
            optimize spend by typing what you want in plain English. No dashboards, no clicking
            through menus, no exports. Just results.
          </p>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-16 relative">
        <div className="dot-pattern absolute inset-0 opacity-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-10">
            The Problem We <span className="gradient-text">Solve</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
                <MousePointerClick className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Too Many Clicks</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Ads Manager requires dozens of clicks to do what should take one sentence. Pausing a
                campaign, adjusting a budget, pulling a breakdown &mdash; every action is buried in
                menus.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Hours Wasted Weekly</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Media buyers spend hours each week on routine operations: checking performance,
                pausing losers, scaling winners, exporting data. That time should go toward
                strategy.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
                <BarChart3 className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Slow Decisions</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                By the time you export a report, format it, and analyze it, the data is stale. You
                need answers in real time, not after a 15-minute workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Adynami Works */}
      <section className="py-16 relative">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-10">
            How Adynami <span className="gradient-text">Works</span>
          </h2>

          <div className="glass-card rounded-2xl p-8 md:p-12">
            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg shadow-purple-500/30">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Connect your Meta account</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Authenticate through Meta&apos;s official OAuth flow. Adynami gets read and
                    write access to your ad accounts via the Marketing API. Takes about two minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg shadow-purple-500/30">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Type what you want</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Describe your intent in plain English. &quot;Pause all campaigns with zero
                    conversions this week.&quot; &quot;Show me my top 3 ad sets by ROAS.&quot;
                    &quot;Launch a lookalike campaign at $50/day.&quot; Adynami understands how
                    media buyers think.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg shadow-purple-500/30">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">It executes via the Meta API</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Adynami translates your request into the right API calls and runs them against
                    your live account. Campaigns launch, budgets shift, reports surface &mdash; all
                    in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Built It */}
      <section className="py-16 relative">
        <div className="dot-pattern absolute inset-0 opacity-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-10">
            Why We <span className="gradient-text">Built It</span>
          </h2>

          <div className="glass-card rounded-2xl p-8 md:p-12 gradient-border">
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              Media buyers spend hours every week clicking through dashboards, exporting CSVs, and
              navigating wizard flows &mdash; just to do things they could describe in a single
              sentence.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              We built Adynami because the gap between what advertisers know they want and how long
              it takes to execute it in Ads Manager is absurd. The interface is the bottleneck, not
              the strategy.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Adynami removes the interface entirely. You say what you want. It happens. That&apos;s
              the product.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 relative overflow-hidden">
        <div className="aurora">
          <div className="aurora-orb aurora-orb-1"></div>
          <div className="aurora-orb aurora-orb-2"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Try It <span className="gradient-text">Free</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Connect your Meta account and start managing your ads with plain English. 3-day free
            trial on all plans.
          </p>
          <Link href="/login">
            <button className="gradient-bg px-10 py-5 rounded-xl font-semibold text-lg glow-btn inline-flex items-center gap-3">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                <span className="text-white">Ady</span>
                <span className="gradient-text">nami</span>
              </span>
              <span className="text-gray-500 text-sm ml-4">AI-powered Meta ads management.</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-400">
              <Link href="/#features" className="hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>

          <div className="text-center text-gray-600 text-sm mt-8">&copy; 2026 Adynami</div>
        </div>
      </footer>
    </div>
  );
}
