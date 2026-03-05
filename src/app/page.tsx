'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Send,
  Plus,
  Check,
  Zap,
  BarChart3,
  Users,
  Shield,
  Search,
  Layers,
  ArrowRight,
  LayoutDashboard,
  ImagePlus,
  MessageSquare,
  Paperclip,
  Settings,
  LogOut,
} from 'lucide-react';

export default function Home() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [typingDots, setTypingDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const faqs = [
    {
      q: 'Does Adynami actually write to my Meta account, or is it just reporting?',
      a: "Adynami reads and writes. When you say 'pause this campaign' or 'launch a new ad set,' it executes that action directly via the Meta Ads API. This is a full command interface, not a reporting layer.",
    },
    {
      q: 'Do I need technical skills or API knowledge to use it?',
      a: "No. You speak to Adynami like you'd brief a colleague. Say what you want in plain English. It handles the API calls, targeting logic, and budget math.",
    },
    {
      q: 'How does it connect to my Meta account securely?',
      a: "You authenticate via Meta's official OAuth flow. Adynami requests the standard Marketing API permissions. Your credentials are never stored. We use token-based access that you can revoke anytime from your Meta Business Settings.",
    },
    {
      q: 'What is the Claude MCP Integration on the Agency plan?',
      a: "MCP (Model Context Protocol) lets you use Adynami's Meta tools directly inside Claude AI. If your team already works in Claude, you can run Meta ad operations without switching apps. It's for technical teams who want native integration.",
    },
    {
      q: 'Can I manage multiple ad accounts?',
      a: 'Yes. Starter supports 1 account, Pro supports up to 5, and Agency supports unlimited accounts. Switch between accounts instantly from the sidebar. No switching logins.',
    },
    {
      q: 'How is my data handled? Can Adynami see my customer data?',
      a: 'Adynami processes your Meta Ads data to respond to your queries. We don\u2019t store your campaign data beyond the session. For CAPI events, PII is hashed before transmission. We never sell or share your data.',
      link: '/privacy',
    },
  ];

  const useCases = [
    'Performance Analysis & Reporting',
    'Campaign Launch & Setup',
    'Creative Testing & A/B Tests',
    'Audience Building & Retargeting',
    'Budget & Bidding Optimization',
    'Lead Generation',
    'E-commerce & Dynamic Product Ads',
    'iOS Signal Recovery (CAPI)',
    'Compliance & Account Health',
    'Competitive Intelligence (Coming Soon)',
    'Zero-Conversion Diagnostics',
    'Advanced Bid Rules',
  ];

  const exampleConversations = [
    {
      prompt: 'Pause all campaigns that have spent over $200 with zero conversions this week',
      outcome: 'Identifies and pauses 3 campaigns, saves $524 in projected weekly waste',
    },
    {
      prompt:
        "My campaign has been running 5 days with no purchases. Walk me through what's wrong.",
      outcome:
        'Runs pixel funnel audit, creative scoring, demographic breakdown, and placement analysis in sequence',
    },
    {
      prompt:
        'Create a 1% lookalike of my purchasers in the US and launch a $75/day traffic campaign',
      outcome: 'Builds audience, estimates reach, deploys campaign with UTM tracking',
    },
    {
      prompt: 'Which ad set has the best ROAS this month? Increase its budget by 25%.',
      outcome: 'Pulls campaign-level insights, identifies winner, executes budget update',
    },
    {
      prompt: 'Show me what Allbirds is running in the US right now. Summarize their hooks.',
      outcome: 'Searches Meta Ads Library, surfaces active ads, summarises creative angles',
      comingSoon: true,
    },
    {
      prompt:
        'Send a purchase event to my pixel for an order that just came in. Email: jane@example.com, order value $127.50',
      outcome: 'Hashes PII, fires CAPI event with deduplication ID, confirms receipt',
    },
    {
      prompt:
        'Duplicate my best-performing campaign for the UK market. Swap in UK landing pages and set $25/day per ad set.',
      outcome: 'Clones campaign, swaps URLs per ad set, sets budget, leaves in PAUSED for review',
    },
    {
      prompt:
        'Break down our last 30 days by age and gender. Which segments are profitable and which are burning money?',
      outcome:
        'Returns demographic breakdown sorted by CPA, flags unprofitable segments for exclusion',
    },
  ];

  return (
    <div className="min-h-screen bg-[#08080f] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08080f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              <span className="text-white">Ady</span>
              <span className="gradient-text">nami</span>
            </span>
            <span className="w-2 h-2 rounded-full gradient-bg pulse-dot"></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('use-cases')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Use Cases
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Pricing
            </button>
            <Link
              href="/about"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
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

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-12 overflow-hidden">
        <div className="aurora">
          <div className="aurora-orb aurora-orb-1"></div>
          <div className="aurora-orb aurora-orb-2"></div>
          <div className="aurora-orb aurora-orb-3"></div>
        </div>
        <div className="dot-pattern absolute inset-0 opacity-30"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest gradient-text mb-6">
              Conversational AI for Meta Advertising
            </p>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Your Meta Ads.
              <br />
              <span className="gradient-text">Managed in Minutes.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              Adynami connects to your Meta account and turns hours of dashboard work into simple
              text commands. Launch campaigns, kill wasted spend, and pull reports by typing what
              you want. No dashboards. No Ads Manager. No manual reports.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/login">
                <button className="gradient-bg px-8 py-4 rounded-xl font-semibold text-lg glow-btn flex items-center justify-center gap-2">
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <button
                onClick={() => scrollToSection('features')}
                className="px-8 py-4 rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/5 transition-colors"
              >
                See It In Action
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Connects to Meta Ads API · Reads and writes your live account · 3-day free trial
            </p>
          </div>

          {/* Chat Mockup */}
          <div className="chat-mockup rounded-2xl overflow-hidden gradient-border max-w-5xl mx-auto bg-[#0d0d14] border border-white/10">
            <div className="flex">
              {/* Sidebar */}
              <div className="hidden md:flex md:flex-col w-56 bg-[#0a0a10] border-r border-white/5">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold">
                      <span className="text-white">Ady</span>
                      <span className="gradient-text">nami</span>
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full gradient-bg pulse-dot"></span>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 text-sm font-medium gradient-border rounded-lg px-3 py-2 mb-6 hover:bg-white/5 transition-colors">
                    <Plus className="w-4 h-4" /> New Chat
                  </button>

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-3">
                    Ad Accounts
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border-l-2 border-purple-500">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                        LS
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Luxe Skincare Co.</p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span className="text-[10px] text-gray-500">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xs font-bold">
                        TB
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-400">
                          TrailBlaze Apparel
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold">
                        NT
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-400">
                          NovaTech Solutions
                        </p>
                      </div>
                    </div>
                  </div>

                  <button className="mt-4 flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    <Plus className="w-4 h-4" /> Connect Account
                  </button>

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mt-6 mb-3">
                    Recent Chats
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <p className="text-xs text-white truncate flex-1">Campaign waste audit</p>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      <p className="text-xs text-gray-400 truncate flex-1">Budget reallocation</p>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">3h</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      <p className="text-xs text-gray-400 truncate flex-1">
                        Audience targeting review
                      </p>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">1d</span>
                    </div>
                  </div>
                </div>

                {/* User profile pinned at bottom */}
                <div className="border-t border-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      S
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Sarah M.</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col min-h-[500px] md:min-h-[550px]">
                {/* Header Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                  {/* Left: account badge */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
                      LS
                    </div>
                    <span className="text-xs text-gray-300 font-medium hidden sm:inline">
                      Luxe Skincare Co.
                    </span>
                  </div>

                  {/* Center: pill toggle */}
                  <div className="bg-white/5 rounded-lg p-1 flex">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white text-xs font-medium">
                      <MessageSquare className="w-3 h-3" />
                      Chat
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-400 text-xs">
                      <LayoutDashboard className="w-3 h-3" />
                      Dashboard
                    </div>
                  </div>

                  {/* Right: settings */}
                  <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* User Message 1 */}
                  <div className="flex justify-end">
                    <div className="gradient-bg rounded-2xl rounded-br-sm px-5 py-3 max-w-md">
                      <p className="text-sm">
                        Which campaigns are spending but not converting this week?
                      </p>
                    </div>
                  </div>

                  {/* Tool call card */}
                  <div className="flex justify-start">
                    <div className="tool-card rounded-lg px-4 py-2.5 text-xs flex items-center gap-2">
                      <span>&#x1f4ca;</span>
                      <span className="text-cyan-300 font-medium">get campaign insights</span>
                      <span className="text-green-400">&#x2713;</span>
                      <span className="text-gray-500">&mdash; 3 campaigns flagged</span>
                    </div>
                  </div>

                  {/* Adynami Response 1 */}
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-5 py-4 max-w-lg shadow-lg shadow-purple-500/5">
                      <p className="text-sm text-gray-300 mb-3">
                        Here are campaigns with spend but zero conversions in the last 7 days:
                      </p>
                      <div className="mono text-xs bg-black/30 rounded-lg p-4 mb-3 border border-white/5">
                        <p className="text-red-400">
                          &#x1f534; Prospecting: Broad US <span className="text-white">$284</span> ·
                          0 conversions
                        </p>
                        <p className="text-red-400">
                          &#x1f534; Retargeting: 30 Day Window{' '}
                          <span className="text-white">$97</span> · 0 conversions
                        </p>
                        <p className="text-red-400">
                          &#x1f534; TOF Video: 18-34 <span className="text-white">$143</span> · 0
                          conversions
                        </p>
                        <p className="text-yellow-400 mt-2">
                          Total wasted spend this week:{' '}
                          <span className="text-white font-semibold">$524</span>
                        </p>
                      </div>
                      <p className="text-sm text-gray-300">
                        Want me to pause these and reallocate budget to your ROAS winners?
                      </p>
                    </div>
                  </div>

                  {/* User Message 2 */}
                  <div className="flex justify-end">
                    <div className="gradient-bg rounded-2xl rounded-br-sm px-5 py-3">
                      <p className="text-sm">Yes. Do it.</p>
                    </div>
                  </div>

                  {/* Tool call cards */}
                  <div className="flex justify-start">
                    <div className="space-y-2">
                      <div className="tool-card rounded-lg px-4 py-2.5 text-xs flex items-center gap-2">
                        <span>&#x23F8;</span>
                        <span className="text-cyan-300 font-medium">pause campaigns</span>
                        <span className="text-green-400">&#x2713;</span>
                        <span className="text-gray-500">&mdash; 3 campaigns paused</span>
                      </div>
                      <div className="tool-card rounded-lg px-4 py-2.5 text-xs flex items-center gap-2">
                        <span>&#x1f4b0;</span>
                        <span className="text-cyan-300 font-medium">update ad set</span>
                        <span className="text-green-400">&#x2713;</span>
                        <span className="text-gray-500">&mdash; Budget reallocated: +$87/day</span>
                      </div>
                    </div>
                  </div>

                  {/* Adynami Response 2 */}
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-5 py-4 max-w-lg shadow-lg shadow-purple-500/5">
                      <p className="text-sm text-gray-300 mb-3">
                        Done. Paused all 3. Reallocated $174/day to your top performers:
                      </p>
                      <div className="mono text-xs space-y-1 mb-3">
                        <p className="text-green-400">&#x2705; Summer Hero: ROAS 4.2x</p>
                        <p className="text-cyan-400 ml-4">
                          +$87/day &#x2192; now{' '}
                          <span className="text-white font-semibold">$195/day</span>
                        </p>
                      </div>
                      <p className="text-sm text-gray-300">
                        Your blended ROAS should recover within 24–48 hours.
                      </p>
                    </div>
                  </div>

                  {/* User Typing */}
                  <div className="flex justify-end">
                    <div className="gradient-bg rounded-2xl rounded-br-sm px-5 py-3 max-w-md">
                      <p className="text-sm">
                        Now find me a demographic I&apos;m missing
                        <span className="typing-cursor">|</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                    <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Ask anything about your Meta ads..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                      readOnly
                    />
                    <button className="gradient-bg p-2 rounded-lg">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 relative">
        <div className="dot-pattern absolute inset-0 opacity-20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-10">
            Ads Manager Was Built for Clicking.
            <br />
            <span className="gradient-text">Adynami Was Built for Thinking.</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card rounded-2xl p-8 border-l-4 border-red-500/50">
              <h3 className="text-xl font-semibold mb-6 text-red-400">The Old Way</h3>
              <ul className="space-y-4">
                {[
                  '6 screens to pause one campaign',
                  'Export a CSV to find your worst performers',
                  'Click through a wizard to build an audience',
                  'Manually adjust budgets one ad set at a time',
                  'Guess which creative is winning',
                  'Hours of repetitive work every single week',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-400">
                    <span className="text-red-500 mt-1">&#x2715;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card rounded-2xl p-8 gradient-border">
              <h3 className="text-xl font-semibold mb-6 gradient-text">With Adynami</h3>
              <ul className="space-y-4">
                {[
                  { prompt: '"Pause everything with ROAS under 1.5"', result: '→ done' },
                  { prompt: '"Which campaigns are bleeding?"', result: '→ answered in seconds' },
                  { prompt: '"Build a lookalike from my top customers"', result: '→ done' },
                  { prompt: '"Scale my winners by 20%"', result: '→ one sentence' },
                  { prompt: '"Which creative has the best hook?"', result: '→ shown immediately' },
                  { prompt: 'Your hours back.', result: 'Your results up.' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">&#x2713;</span>
                    <span>
                      <span className="text-cyan-400 mono text-sm">{item.prompt}</span>
                      <span className="text-gray-400 ml-2">{item.result}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-400 text-center mb-10 text-lg">Three steps. Full control.</p>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 step-line"></div>

            {[
              {
                num: '1',
                title: 'Connect Your Account',
                desc: 'Link your Meta Ads account securely. API credentials, 2 minutes, then Adynami has full read and write access.',
              },
              {
                num: '2',
                title: 'Describe What You Want',
                desc: "Type like you'd brief a colleague. Metrics, tactics, plain English. Adynami understands how advertisers think and gets straight to work.",
              },
              {
                num: '3',
                title: 'It Executes',
                desc: 'Adynami hits the Meta API directly. Campaigns launch, budgets shift, audiences build, reports surface in real time. No extra screens. No waiting.',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="glass-card glass-card-hover rounded-2xl p-8 text-center relative"
              >
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg shadow-purple-500/30">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section id="features" className="py-16 relative">
        <div className="dot-pattern absolute inset-0 opacity-20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Everything You Can Do From <span className="gradient-text">One Conversation</span>
          </h2>
          <p className="text-gray-400 text-center mb-10 text-lg">
            Everything Ads Manager does, without the clicking.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'Campaign Operations',
                desc: 'Launch, pause, duplicate, and optimize campaigns from a single instruction. Full creation including targeting, creative, budget, and UTM tracking.',
              },
              {
                icon: BarChart3,
                title: 'Performance Diagnostics',
                desc: 'Zero conversions? Ask Adynami to run the full diagnostic: pixel funnel audit, creative scoring by engagement, demographic breakdown, placement analysis, frequency check.',
              },
              {
                icon: Layers,
                title: 'Creative Testing & DCO',
                desc: 'Score creatives by CTR and outbound clicks before purchase data arrives. Run Dynamic Creative Optimization tests across headline and image combinations.',
              },
              {
                icon: Users,
                title: 'Audience Building',
                desc: 'Website retargeting, video view audiences, page engagement segments, customer list lookalikes. Built on demand, with reach estimates before you spend.',
              },
              {
                icon: Shield,
                title: 'Signal Recovery (iOS 14+)',
                desc: 'Send server-side conversion events via CAPI to recover attribution lost to iOS opt-outs. Full funnel: ViewContent, AddToCart, InitiateCheckout, Purchase.',
              },
              {
                icon: Search,
                title: 'Competitive Intelligence',
                desc: "Search the Meta Ads Library for competitor creatives. See what's been running for 90+ days. Those are the ones worth studying.",
                comingSoon: true,
              },
              {
                icon: LayoutDashboard,
                title: 'Visual Dashboard',
                desc: 'Browse campaigns, ad sets, and ads in a sortable table. Filter by date range, sort by any metric — spend, ROAS, CPA, CTR — and spot your winners and losers at a glance.',
              },
              {
                icon: ImagePlus,
                title: 'Creative Analysis',
                desc: 'Upload ad images and videos directly into chat. Get AI-powered visual feedback on your creatives — analyze hooks, compositions, and copy before spending a dollar.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`glass-card glass-card-hover rounded-2xl p-8 group ${'comingSoon' in item && item.comingSoon ? 'opacity-60' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                  <item.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {item.title}
                  {'comingSoon' in item && item.comingSoon && (
                    <span className="ml-2 bg-purple-500/20 text-purple-400 text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wider">
                      Coming Soon
                    </span>
                  )}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Built for Every Situation
          </h2>
          <p className="text-gray-400 text-center mb-12 text-lg">
            12 workflow categories. One chat window.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {useCases.map((useCase, i) => (
              <span
                key={i}
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all cursor-pointer"
              >
                {useCase}
              </span>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm">
            Full use case library with example prompts available in the docs.
          </p>
        </div>
      </section>

      {/* Example Conversations */}
      <section className="py-16 relative">
        <div className="dot-pattern absolute inset-0 opacity-20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Just Say What You Want
          </h2>
          <p className="text-gray-400 text-center mb-10 text-lg">Real prompts. Real outcomes.</p>

          <div className="grid md:grid-cols-2 gap-6">
            {exampleConversations.map((conv, i) => (
              <div
                key={i}
                className={`glass-card rounded-xl p-6 border-l-4 border-purple-500/50 relative ${'comingSoon' in conv && conv.comingSoon ? 'opacity-60' : ''}`}
              >
                {'comingSoon' in conv && conv.comingSoon && (
                  <span className="absolute top-3 right-3 bg-purple-500/20 text-purple-400 text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wider">
                    Coming Soon
                  </span>
                )}
                <div className="gradient-bg rounded-lg px-4 py-3 mb-4 inline-block">
                  <p className="text-sm font-medium">&quot;{conv.prompt}&quot;</p>
                </div>
                <p className="text-gray-400 text-sm flex items-start gap-2">
                  <span className="text-cyan-400">&#x2192;</span>
                  {conv.outcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 relative">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Simple Pricing. Serious Capability.
          </h2>
          <p className="text-gray-400 text-center mb-8 text-lg">
            Generous limits on every plan. No feature gates on core functionality. Just a tool that
            pays for itself.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-white/5 rounded-full p-1 flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'monthly' ? 'gradient-bg' : 'text-gray-400'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'annual' ? 'gradient-bg' : 'text-gray-400'}`}
              >
                Annual <span className="text-green-400 ml-1">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="glass-card glass-card-hover rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <p className="text-gray-400 text-sm mb-6">Best for solo founders and small teams</p>
              <div className="mb-6">
                {billingPeriod === 'annual' && (
                  <span className="text-gray-500 line-through text-lg mr-2">$49</span>
                )}
                <span className="text-4xl font-bold">
                  ${billingPeriod === 'annual' ? '39' : '49'}
                </span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  '1 Meta ad account',
                  '100 AI conversations/month',
                  'Campaign creation & management',
                  'Performance reporting & breakdowns',
                  'Visual campaign dashboard',
                  'Audience builder',
                  'Automated rules',
                  'Email support',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/billing">
                <button className="w-full py-3 rounded-xl border border-white/20 font-medium hover:bg-white/5 transition-colors">
                  Start Free Trial
                </button>
              </Link>
            </div>

            {/* Pro */}
            <div className="glass-card glass-card-hover rounded-2xl p-8 gradient-border relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 gradient-bg px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-gray-400 text-sm mb-6">Best for growth teams and media buyers</p>
              <div className="mb-6">
                {billingPeriod === 'annual' && (
                  <span className="text-gray-500 line-through text-lg mr-2">$149</span>
                )}
                <span className="text-4xl font-bold">
                  ${billingPeriod === 'annual' ? '119' : '149'}
                </span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  'Up to 5 Meta ad accounts',
                  '400 AI conversations/month',
                  'Everything in Starter',
                  'Bulk operations across accounts',
                  'Zero-conversion diagnostic workflows',
                  'Creative performance analysis',
                  'Image & video creative analysis',
                  'Advanced demographic & placement breakdowns',
                  'Priority support',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/billing">
                <button className="w-full py-3 rounded-xl gradient-bg font-medium glow-btn">
                  Start Free Trial
                </button>
              </Link>
            </div>

            {/* Agency */}
            <div className="glass-card glass-card-hover rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-2">Agency</h3>
              <p className="text-gray-400 text-sm mb-6">
                Best for agencies and teams managing clients
              </p>
              <div className="mb-6">
                {billingPeriod === 'annual' && (
                  <span className="text-gray-500 line-through text-lg mr-2">$349</span>
                )}
                <span className="text-4xl font-bold">
                  ${billingPeriod === 'annual' ? '279' : '349'}
                </span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  'Unlimited Meta ad accounts',
                  '1,000 AI conversations/month',
                  'Everything in Pro',
                  'Team seats (up to 5 users)',
                  'White-label reporting exports',
                  'Competitive intelligence (coming soon)',
                  'Claude MCP Integration',
                  'Dedicated support',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/billing">
                <button className="w-full py-3 rounded-xl border border-white/20 font-medium hover:bg-white/5 transition-colors">
                  Start Free Trial
                </button>
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            3-day free trial on all plans · Cancel anytime
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 relative">
        <div className="dot-pattern absolute inset-0 opacity-20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-10">
            Trusted by Performance Marketers
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "The zero-conversion diagnostic is worth the subscription alone. I went from guessing why a campaign wasn't working to having a structured answer in 90 seconds.",
                author: 'Sarah K.',
                role: 'Head of Growth, DTC Brand',
                detail: '$150k/mo spend',
              },
              {
                quote:
                  "Managing 14 client accounts used to mean 14 dashboards. Now it's one window and I'm done in an hour.",
                author: 'Marcus T.',
                role: 'Senior Media Buyer',
                detail: '',
              },
              {
                quote:
                  "I described the targeting I wanted, it estimated reach, told me the budget I'd need, and launched it. That used to take me 20 minutes minimum.",
                author: 'James R.',
                role: 'Founder',
                detail: '$200k/mo ad spend',
              },
            ].map((testimonial, i) => (
              <div key={i} className="glass-card rounded-2xl p-8">
                <p className="text-gray-300 mb-6 leading-relaxed">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                  {testimonial.detail && (
                    <p className="text-xs text-purple-400 mt-1">{testimonial.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-medium pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed">
                    {faq.a}
                    {'link' in faq && faq.link && (
                      <>
                        {' '}
                        <Link
                          href={faq.link}
                          className="text-purple-400 hover:text-purple-300 underline"
                        >
                          Read our privacy policy
                        </Link>
                        .
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 relative overflow-hidden">
        <div className="aurora">
          <div className="aurora-orb aurora-orb-1"></div>
          <div className="aurora-orb aurora-orb-2"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Stop Clicking.
            <br />
            <span className="gradient-text">Start Scaling.</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Start your free trial today. Your first conversation could save you hours and improve
            your ROAS before the week is out.
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
              <button
                onClick={() => scrollToSection('features')}
                className="hover:text-white transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('use-cases')}
                className="hover:text-white transition-colors"
              >
                Use Cases
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="hover:text-white transition-colors"
              >
                Pricing
              </button>
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

      {/* FAQ structured data for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
