'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Clock,
  Send,
  Plus,
  BarChart3,
  MessageSquare,
  LayoutDashboard,
  Paperclip,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface EmailFormProps {
  id?: string;
  email: string;
  setEmail: (email: string) => void;
  status: 'idle' | 'loading' | 'success' | 'error';
  handleSubmit: (e: React.FormEvent) => void;
  errorMsg: string;
}

function EmailForm({ id, email, setEmail, status, handleSubmit, errorMsg }: EmailFormProps) {
  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-4" id={id}>
      {status === 'success' ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <p className="text-lg font-semibold mb-1">You&apos;re on the list.</p>
          <p className="text-gray-400 text-sm">
            We&apos;ll email you when your spot opens up. Check your inbox for a confirmation.
          </p>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="gradient-bg px-6 py-3.5 rounded-xl font-semibold text-sm glow-btn inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {status === 'loading' ? (
              'Joining...'
            ) : (
              <>
                Get Early Access <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
      {status === 'error' && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
    </form>
  );
}

export default function EarlyAccess() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [count, setCount] = useState(847);

  useEffect(() => {
    const target = 847;
    let current = 800;
    const interval = setInterval(() => {
      current += Math.ceil((target - current) * 0.15);
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setCount(current);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'early-access' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const timeCards = [
    { time: '2.5 hrs', task: 'Pulling reports and exporting CSVs' },
    { time: '2.0 hrs', task: 'Building and duplicating campaigns' },
    { time: '1.5 hrs', task: 'Adjusting budgets across ad sets' },
    { time: '1.5 hrs', task: 'Diagnosing why campaigns aren\u2019t converting' },
    { time: '1.0 hr', task: 'Creating and managing audiences' },
    { time: '1.0 hr', task: 'Navigating between accounts' },
    { time: '1.0 hr', task: 'Reviewing creative performance' },
    { time: '0.5 hr', task: 'Checking competitor ads' },
  ];

  const commandGroups = [
    {
      name: 'Campaigns',
      commands: [
        { prompt: 'Pause everything with CPA over $40', result: '3 ad sets paused instantly' },
        {
          prompt: 'Launch a conversion campaign targeting US women 25-45, $50/day',
          result: 'Campaign live in 8 seconds',
        },
        {
          prompt: 'Duplicate my best campaign for the UK market with £30/day budget',
          result: 'Cloned, geo-swapped, budgeted, set to PAUSED for review',
        },
      ],
    },
    {
      name: 'Reporting',
      commands: [
        {
          prompt: 'Break down last 30 days by age and gender',
          result: 'Demographic table sorted by CPA',
        },
        {
          prompt: 'Which ad sets have ROAS above 3x this month?',
          result: 'Filtered performance table with spend and revenue',
        },
        {
          prompt: 'Compare this week vs last week across all campaigns',
          result: 'WoW delta table with trend arrows',
        },
      ],
    },
    {
      name: 'Audiences',
      commands: [
        {
          prompt: 'Build a 1% lookalike from my purchasers in the US',
          result: 'Audience created, estimated reach 2.1M',
        },
        {
          prompt: 'Create a retargeting audience from 30-day website visitors',
          result: 'Custom audience ready, 14K users matched',
        },
        {
          prompt: 'Exclude everyone who purchased in the last 7 days from prospecting',
          result: 'Exclusion applied across 4 ad sets',
        },
      ],
    },
    {
      name: 'Diagnostics',
      commands: [
        {
          prompt: 'My campaign has 0 conversions after 5 days. What\u2019s wrong?',
          result: 'Pixel audit, creative score, placement analysis',
        },
        {
          prompt: 'Why did my CPM spike yesterday?',
          result: 'Auction overlap detected, frequency at 4.2x',
        },
        {
          prompt: 'Which placements are wasting money?',
          result: 'Placement breakdown with cost-per-result comparison',
        },
      ],
    },
    {
      name: 'Intelligence',
      commands: [
        {
          prompt: 'Show me what Allbirds is running in the US right now',
          result: 'Ad Library results with creative thumbnails and run dates',
        },
        {
          prompt: 'What hooks are skincare brands using this month?',
          result: 'Top-performing angles across 200+ active ads',
        },
        {
          prompt: 'Find competitors spending on "meal kit delivery" in the US',
          result: '12 advertisers found, sorted by estimated spend',
        },
      ],
    },
  ];

  const testimonials = [
    {
      quote:
        'I used to blow my entire Monday morning pulling reports across 3 accounts. Now I ask one question and get a better breakdown than I could build myself. Got 4 hours back the first week.',
      name: 'Performance Marketer',
      role: 'DTC Brand, $80K/mo spend',
    },
    {
      quote:
        'We manage 14 client accounts. Being able to say "pause all underperformers across accounts" instead of clicking through each one separately is the single biggest time save we\'ve found.',
      name: 'Senior Media Buyer',
      role: 'Agency, 14 accounts',
    },
    {
      quote:
        "I described the targeting I wanted, it estimated reach, told me the budget I'd need, and launched it. Twelve seconds. That used to take me 45 minutes in Ads Manager minimum.",
      name: 'Growth Lead',
      role: 'SaaS, Series A',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* 1. Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold">
              <span className="text-white">Ady</span>
              <span className="gradient-text">nami</span>
            </span>
          </Link>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      {/* 2. Hero — "The Hook" */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="aurora">
          <div className="aurora-orb aurora-orb-1"></div>
          <div className="aurora-orb aurora-orb-2"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-6">
            EARLY ACCESS &mdash; LIMITED SPOTS
          </p>

          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-[#0a0a14] gradient-bg"
                />
              ))}
            </div>
            <span className="text-sm text-gray-300">
              <span className="text-white font-semibold">{count}+</span> marketers on the waitlist
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
            Stop Managing Ads.
            <br />
            <span className="gradient-text">Start Telling Them What To Do.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-4 leading-relaxed">
            Adynami replaces Ads Manager with a single conversation. Launch campaigns, kill wasted
            spend, pull any report &mdash; by typing what you want. 76 tools. One chat window. Full
            read + write access to your Meta account.
          </p>

          <p className="text-sm text-purple-400 font-medium mb-10">
            Early access members get priority onboarding + a 3-day free trial.
          </p>

          <EmailForm
            id="hero-form"
            email={email}
            setEmail={setEmail}
            status={status}
            handleSubmit={handleSubmit}
            errorMsg={errorMsg}
          />

          <p className="text-xs text-gray-600">No credit card required. Takes 5 seconds.</p>
        </div>
      </section>

      {/* 3. Chat Mockup — "Show Don't Tell" */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="chat-mockup rounded-2xl overflow-hidden gradient-border bg-[#0d0d14] border border-white/10">
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
                      <p className="text-xs text-white truncate flex-1">
                        Ad set performance review
                      </p>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      <p className="text-xs text-gray-400 truncate flex-1">
                        Campaign budget optimization
                      </p>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">2h</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      <p className="text-xs text-gray-400 truncate flex-1">
                        Audience targeting analysis
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
                      <p className="text-sm">How are my 4 new ad sets performing this week?</p>
                    </div>
                  </div>

                  {/* Tool call card */}
                  <div className="flex justify-start">
                    <div className="tool-card rounded-lg px-4 py-2.5 text-xs flex items-center gap-2">
                      <span>&#x1f4ca;</span>
                      <span className="text-cyan-300 font-medium">get ad set insights</span>
                      <span className="text-green-400">&#x2713;</span>
                      <span className="text-gray-500">&mdash; 4 results</span>
                    </div>
                  </div>

                  {/* Adynami Response 1 — Data table */}
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-5 py-4 max-w-lg shadow-lg shadow-purple-500/5">
                      <p className="text-sm text-gray-300 mb-3">
                        Here&apos;s the performance breakdown for your 4 new ad sets (last 7 days):
                      </p>
                      <div className="mono text-xs bg-black/30 rounded-lg p-4 mb-3 border border-white/5 space-y-1.5">
                        <p className="text-green-400">
                          &#x1f7e2; Retargeting: Cart Abandoners &nbsp;
                          <span className="text-white">$312 spent</span> &middot; ROAS 4.8x &middot;
                          CPA $18
                          <span className="text-green-500 ml-2">SCALING</span>
                        </p>
                        <p className="text-green-400">
                          &#x1f7e2; TOF: Interest Stack (25-44) &nbsp;
                          <span className="text-white">$245 spent</span> &middot; ROAS 3.1x &middot;
                          CPA $31
                          <span className="text-green-500 ml-2">SCALING</span>
                        </p>
                        <p className="text-yellow-400">
                          &#x1f7e1; Broad: US Women 18-65 &nbsp;
                          <span className="text-white">$189 spent</span> &middot; ROAS 1.4x &middot;
                          CPA $39
                          <span className="text-yellow-500 ml-2">WATCH</span>
                        </p>
                        <p className="text-red-400">
                          &#x1f534; Lookalike: Email List 1% &nbsp;
                          <span className="text-white">$276 spent</span> &middot; ROAS 0.6x &middot;
                          CPA $94
                          <span className="text-red-500 ml-2">BLEEDING</span>
                        </p>
                      </div>
                      <p className="text-sm text-gray-300">
                        The lookalike is burning money &mdash;{' '}
                        <span className="text-red-400 font-semibold">
                          $94 CPA vs your $42 target
                        </span>
                        . I&apos;d recommend pausing it and reallocating that $276/wk to the
                        retargeting ad set which is crushing it at 4.8x ROAS. Want me to do that?
                      </p>
                    </div>
                  </div>

                  {/* User Message 2 */}
                  <div className="flex justify-end">
                    <div className="gradient-bg rounded-2xl rounded-br-sm px-5 py-3 max-w-md">
                      <p className="text-sm">Yes. And increase the retargeting budget by 50%.</p>
                    </div>
                  </div>

                  {/* Tool call cards */}
                  <div className="flex justify-start">
                    <div className="space-y-2">
                      <div className="tool-card rounded-lg px-4 py-2.5 text-xs flex items-center gap-2">
                        <span>&#x1f3af;</span>
                        <span className="text-cyan-300 font-medium">update ad set</span>
                        <span className="text-green-400">&#x2713;</span>
                        <span className="text-gray-500">
                          &mdash; Paused: Lookalike: Email List 1%
                        </span>
                      </div>
                      <div className="tool-card rounded-lg px-4 py-2.5 text-xs flex items-center gap-2">
                        <span>&#x1f3af;</span>
                        <span className="text-cyan-300 font-medium">update ad set</span>
                        <span className="text-green-400">&#x2713;</span>
                        <span className="text-gray-500">
                          &mdash; Budget updated: $45/day &rarr; $67/day
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Adynami Response 2 — Confirmation */}
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-5 py-4 max-w-lg shadow-lg shadow-purple-500/5">
                      <p className="text-sm text-gray-300 mb-3">
                        Done. Here&apos;s what I executed:
                      </p>
                      <div className="mono text-xs space-y-1.5 mb-3">
                        <p className="text-red-400">
                          &#x23F8; Paused: Lookalike: Email List 1%{' '}
                          <span className="text-gray-500">($276/wk freed)</span>
                        </p>
                        <p className="text-green-400">&#x2705; Retargeting: Cart Abandoners</p>
                        <p className="text-cyan-400 ml-4">
                          Budget +50% &#x2192; now{' '}
                          <span className="text-white font-semibold">$67/day</span> (was $45/day)
                        </p>
                      </div>
                      <p className="text-sm text-gray-300">
                        Projected daily savings:{' '}
                        <span className="text-green-400 font-semibold">~$39/day</span> by cutting
                        the loser. Your blended ROAS should improve within 24&ndash;48 hours.
                      </p>
                    </div>
                  </div>

                  {/* User Typing */}
                  <div className="flex justify-end">
                    <div className="gradient-bg rounded-2xl rounded-br-sm px-5 py-3 max-w-md">
                      <p className="text-sm">
                        Show me what competitors in skincare are running right n
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

      {/* 4. Pain Amplification — "The Time Theft" */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              You Spent 11 Hours Last Week Inside Ads Manager.
            </h2>
            <p className="text-gray-400 text-lg">Here&apos;s where that time went.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — time cards */}
            <div className="space-y-3">
              {timeCards.map((item, i) => (
                <div key={i} className="flex items-center gap-4 glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <Clock className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-mono text-sm font-semibold">
                      {item.time}
                    </span>
                  </div>
                  <span className="text-gray-300 text-sm">{item.task}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 glass-card rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 min-w-[90px]">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 font-mono text-sm font-bold">~11 hrs</span>
                </div>
                <span className="text-white text-sm font-semibold">Total per week</span>
              </div>
            </div>

            {/* Right — punchline */}
            <div className="text-center md:text-left">
              <p className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                <span className="gradient-text">
                  With Adynami, that&apos;s a 20-minute conversation.
                </span>
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                Not an exaggeration. Not a marketing claim. You type what you need. It executes.
                That&apos;s it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Command Wall — "76 Tools. One Sentence Each." */}
      <section className="py-20 border-t border-white/5 relative">
        <div className="dot-pattern absolute inset-0 opacity-20"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">76 Tools. One Sentence Each.</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you&apos;d do in Ads Manager, as a single typed instruction.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {commandGroups.map((group, gi) => (
              <div key={gi} className={group.name === 'Intelligence' ? 'opacity-60' : ''}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-400 mb-4">
                  {group.name}
                  {group.name === 'Intelligence' && (
                    <span className="ml-2 bg-purple-500/20 text-purple-400 text-[10px] font-semibold rounded-full px-2 py-0.5 normal-case tracking-wider">
                      Coming Soon
                    </span>
                  )}
                </h3>
                <div className="space-y-4">
                  {group.commands.map((cmd, ci) => (
                    <div key={ci}>
                      <p className="font-mono text-sm text-purple-400 mb-1">
                        <span className="text-purple-500">&gt;</span> &ldquo;{cmd.prompt}&rdquo;
                      </p>
                      <p className="font-mono text-xs text-cyan-400">
                        <span className="text-gray-600">&rarr;</span> {cmd.result}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Testimonials — "Built for People Who Actually Run Ads" */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Built for People Who Actually <span className="gradient-text">Run Ads</span>.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <div className="text-purple-400 text-2xl mb-3">&ldquo;</div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{t.quote}</p>
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. How It Works — "Three Steps. Thirty Seconds." */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Three Steps. Thirty Seconds.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 step-line"></div>

            {[
              {
                num: '1',
                title: 'Connect Your Meta Account',
                desc: 'One-click OAuth. Read + write permissions. Revoke anytime from Meta Business Settings.',
              },
              {
                num: '2',
                title: 'Tell It What You Need',
                desc: 'Speak naturally, like briefing a colleague. Metrics, tactics, strategy \u2014 plain English.',
              },
              {
                num: '3',
                title: 'Watch It Execute',
                desc: 'Adynami calls the Meta API directly. Campaigns launch, budgets shift, reports surface. All actions are logged and reversible.',
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

      {/* 8. Early Access Benefits */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">
            What You Get With <span className="gradient-text">Early Access</span>
          </h2>

          <div className="space-y-5 mb-10 text-left max-w-lg mx-auto">
            {[
              {
                title: 'Priority onboarding',
                desc: 'We personally walk you through setup and your first conversation.',
              },
              {
                title: '3-day free trial',
                desc: 'Full access to all 76 tools. No credit card. No commitment.',
              },
              {
                title: 'Shape the roadmap',
                desc: 'Your feedback directly influences what we build next.',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mb-8">
            Early access is limited. We onboard in batches to ensure quality.
          </p>

          <EmailForm
            id="benefits-form"
            email={email}
            setEmail={setEmail}
            status={status}
            handleSubmit={handleSubmit}
            errorMsg={errorMsg}
          />
        </div>
      </section>

      {/* 9. Final CTA — "The Close" */}
      <section className="py-20 relative overflow-hidden border-t border-white/5">
        <div className="aurora">
          <div className="aurora-orb aurora-orb-1"></div>
          <div className="aurora-orb aurora-orb-2"></div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Every Hour in Ads Manager Is an Hour You&apos;re Not{' '}
            <span className="gradient-text">Scaling</span>.
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
            Join {count}+ marketers who decided they&apos;d rather talk to their ads than click
            through them.
          </p>

          <EmailForm
            id="final-form"
            email={email}
            setEmail={setEmail}
            status={status}
            handleSubmit={handleSubmit}
            errorMsg={errorMsg}
          />
          <p className="text-xs text-gray-600">
            Priority onboarding + 3-day trial. No credit card.
          </p>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Link href="/">
                <span className="text-xl font-bold">
                  <span className="text-white">Ady</span>
                  <span className="gradient-text">nami</span>
                </span>
              </Link>
              <span className="text-gray-500 text-sm ml-4">AI-powered Meta ads management.</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/about" className="hover:text-white transition-colors">
                About
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
