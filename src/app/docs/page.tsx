'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Search,
  ArrowLeft,
  Book,
  Code,
  CreditCard,
  Zap,
} from 'lucide-react';

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: { id: string; label: string }[];
}

const sections: SidebarSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quick-start', label: 'Quick Start' },
    ],
  },
  {
    id: 'use-cases',
    title: 'Use Cases',
    icon: Zap,
    items: [
      { id: 'performance-analysis', label: 'Performance Analysis' },
      { id: 'campaign-launch', label: 'Campaign Launch' },
      { id: 'creative-testing', label: 'Creative Testing' },
      { id: 'audience-building', label: 'Audience Building' },
      { id: 'budget-optimization', label: 'Budget Optimization' },
      { id: 'lead-generation', label: 'Lead Generation' },
    ],
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: Code,
    items: [
      { id: 'authentication', label: 'Authentication' },
      { id: 'mcp-integration', label: 'MCP Integration' },
      { id: 'available-tools', label: 'Available Tools' },
    ],
  },
  {
    id: 'account-billing',
    title: 'Account & Billing',
    icon: CreditCard,
    items: [
      { id: 'plans-overview', label: 'Plans Overview' },
      { id: 'managing-subscription', label: 'Managing Subscription' },
      { id: 'token-refresh', label: 'Token Refresh' },
    ],
  },
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'getting-started': true,
    'use-cases': true,
    'api-reference': true,
    'account-billing': true,
  });
  const [activeItem, setActiveItem] = useState('introduction');

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            section.title.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const scrollToSection = (id: string) => {
    setActiveItem(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08080f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                <span className="text-white">Ady</span>
                <span className="gradient-text">nami</span>
              </span>
              <span className="w-2 h-2 rounded-full gradient-bg pulse-dot"></span>
            </Link>
            <span className="text-gray-600">|</span>
            <span className="text-sm text-gray-400 font-medium">Documentation</span>
          </div>
          <Link
            href="/chat"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to app
          </Link>
        </div>
      </nav>

      <div className="flex pt-[73px]">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 fixed top-[73px] left-0 bottom-0 border-r border-white/5 overflow-y-auto scrollbar-thin p-4">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Sections */}
          <nav className="space-y-1">
            {filteredSections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <section.icon className="w-4 h-4 text-gray-500" />
                  <span className="flex-1 text-left">{section.title}</span>
                  {expandedSections[section.id] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {expandedSections[section.id] && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          activeItem === item.id
                            ? 'text-white bg-white/5 border-l-2 border-purple-500'
                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 px-6 md:px-12 py-12 max-w-4xl">
          {/* Getting Started */}
          <section id="introduction" className="mb-16">
            <h2 className="text-3xl font-bold mb-4">
              <span className="gradient-text">Introduction</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Adynami is a conversational AI interface for Meta advertising. Instead of navigating
              through Ads Manager dashboards and clicking through multi-step wizards, you describe
              what you want in plain English and Adynami executes it directly via the Meta Ads API.
            </p>
            <p className="text-gray-400 leading-relaxed">
              It reads and writes your live Meta ad account. You can launch campaigns, pause
              underperformers, build audiences, pull performance reports, run creative tests, send
              server-side events, and more -- all from a single chat window.
            </p>
          </section>

          <section id="quick-start" className="mb-16">
            <h3 className="text-xl font-semibold mb-4">Quick Start</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Getting up and running takes about two minutes. Connect your Meta account using the
              secure OAuth flow, and you are ready to send your first message.
            </p>
            <div className="glass-card rounded-xl p-6 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-3">Step-by-step:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
                <li>Sign up and start your 7-day free trial.</li>
                <li>Click <span className="text-purple-400">Connect Meta Account</span> and authorize via Facebook OAuth.</li>
                <li>Select the ad account you want to manage from the sidebar.</li>
                <li>Type your first message -- try <span className="mono text-cyan-400">&quot;Show me my top 5 campaigns by ROAS this month.&quot;</span></li>
              </ol>
            </div>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5">
              <p className="text-gray-500 mb-1"># Example first message</p>
              <p className="text-cyan-400">&quot;Which campaigns are spending but not converting this week?&quot;</p>
            </div>
          </section>

          {/* Use Cases */}
          <div className="mb-4">
            <h2 className="text-3xl font-bold">
              <span className="gradient-text">Use Cases</span>
            </h2>
          </div>

          {[
            { id: 'performance-analysis', title: 'Performance Analysis', desc: 'Pull breakdowns by age, gender, placement, device, or time of day. Identify profitable segments and run zero-conversion diagnostics that audit your pixel funnel, creative engagement, and audience overlap.' },
            { id: 'campaign-launch', title: 'Campaign Launch', desc: 'Describe targeting, budget, creative, and objective in natural language. Adynami creates the full campaign structure with UTM tracking, naming conventions, and your specified bid strategy.' },
            { id: 'creative-testing', title: 'Creative Testing', desc: 'Set up A/B tests across headlines, images, and ad copy. Score creatives by CTR and engagement before purchase data accumulates for early signals on which variants to scale.' },
            { id: 'audience-building', title: 'Audience Building', desc: 'Build retargeting audiences, video viewer segments, page engagement custom audiences, and lookalikes from customer lists. Estimate reach before you commit budget.' },
            { id: 'budget-optimization', title: 'Budget Optimization', desc: 'Reallocate spend from underperformers to winners in one command. Set automated rules that scale budgets when ROAS thresholds are met or pause ad sets when frequency exceeds a cap.' },
            { id: 'lead-generation', title: 'Lead Generation', desc: 'Create lead form campaigns with custom questions and CRM integration. Monitor cost-per-lead across ad sets and shift budget to the highest-converting forms.' },
          ].map((uc) => (
            <section key={uc.id} id={uc.id} className="mb-12">
              <h3 className="text-xl font-semibold mb-3">{uc.title}</h3>
              <p className="text-gray-400 leading-relaxed">{uc.desc}</p>
            </section>
          ))}

          {/* API Reference */}
          <div className="mb-4 mt-16">
            <h2 className="text-3xl font-bold">
              <span className="gradient-text">API Reference</span>
            </h2>
            <p className="text-gray-400 text-sm mt-2">Available on the Agency plan.</p>
          </div>

          <section id="authentication" className="mb-12">
            <h3 className="text-xl font-semibold mb-3">Authentication</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              API access is authenticated via API keys generated from your Adynami dashboard.
              Include your key in the <span className="mono text-cyan-400">Authorization</span> header
              of every request.
            </p>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5">
              <p className="text-gray-500"># Include your API key in the Authorization header</p>
              <p><span className="text-purple-400">Authorization:</span> <span className="text-cyan-400">Bearer your_api_key_here</span></p>
            </div>
          </section>

          <section id="mcp-integration" className="mb-12">
            <h3 className="text-xl font-semibold mb-3">MCP Integration</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              The Claude MCP (Model Context Protocol) integration lets you use Adynami&apos;s Meta Ads
              tools directly inside Claude. This is ideal for technical teams who already work in
              Claude and want native access to ad operations without switching apps.
            </p>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5 mb-4">
              <p className="text-gray-500"># claude_desktop_config.json</p>
              <p>{'{'}</p>
              <p className="ml-4"><span className="text-purple-400">&quot;mcpServers&quot;</span>: {'{'}</p>
              <p className="ml-8"><span className="text-purple-400">&quot;adynami&quot;</span>: {'{'}</p>
              <p className="ml-12"><span className="text-purple-400">&quot;url&quot;</span>: <span className="text-cyan-400">&quot;https://mcp.adynami.com/sse&quot;</span></p>
              <p className="ml-8">{'}'}</p>
              <p className="ml-4">{'}'}</p>
              <p>{'}'}</p>
            </div>
            <div className="glass-card rounded-xl p-4 border-l-4 border-purple-500/50">
              <p className="text-sm text-gray-300">
                After connecting, all 73 Meta Ads tools become available as MCP tools in your Claude
                session. You will be prompted to authorize on first use.
              </p>
            </div>
          </section>

          <section id="available-tools" className="mb-12">
            <h3 className="text-xl font-semibold mb-3">Available Tools</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Adynami exposes 73 tools covering the full Meta Marketing API surface. These are
              grouped into the following categories:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Campaign Management', count: 12 },
                { name: 'Ad Set Operations', count: 10 },
                { name: 'Ad Creative', count: 8 },
                { name: 'Audience & Targeting', count: 9 },
                { name: 'Insights & Reporting', count: 11 },
                { name: 'Conversions API (CAPI)', count: 5 },
                { name: 'Ads Library', count: 4 },
                { name: 'Account & Pixel', count: 6 },
                { name: 'Automated Rules', count: 4 },
                { name: 'Utilities', count: 4 },
              ].map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between px-4 py-3 bg-white/3 rounded-lg border border-white/5 text-sm"
                >
                  <span className="text-gray-300">{cat.name}</span>
                  <span className="text-gray-500 mono">{cat.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Account & Billing */}
          <div className="mb-4 mt-16">
            <h2 className="text-3xl font-bold">
              <span className="gradient-text">Account & Billing</span>
            </h2>
          </div>

          <section id="plans-overview" className="mb-12">
            <h3 className="text-xl font-semibold mb-3">Plans Overview</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Adynami offers three plans to match your scale. All plans include unlimited
              conversations and commands -- no message caps.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { plan: 'Starter', price: '$49/mo', accounts: '1 account' },
                { plan: 'Pro', price: '$149/mo', accounts: 'Up to 5 accounts' },
                { plan: 'Agency', price: '$349/mo', accounts: 'Unlimited accounts' },
              ].map((p) => (
                <div key={p.plan} className="glass-card rounded-xl p-4 text-center">
                  <p className="font-semibold mb-1">{p.plan}</p>
                  <p className="text-purple-400 text-lg font-bold mb-1">{p.price}</p>
                  <p className="text-gray-500 text-xs">{p.accounts}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="managing-subscription" className="mb-12">
            <h3 className="text-xl font-semibold mb-3">Managing Subscription</h3>
            <p className="text-gray-400 leading-relaxed">
              You can upgrade, downgrade, or cancel your subscription at any time from the{' '}
              <Link href="/billing" className="text-purple-400 hover:underline">
                Billing page
              </Link>
              . Upgrades take effect immediately. Downgrades apply at the end of your current
              billing cycle. All plans start with a 7-day free trial.
            </p>
          </section>

          <section id="token-refresh" className="mb-16">
            <h3 className="text-xl font-semibold mb-3">Token Refresh</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Meta access tokens expire periodically. If Adynami loses access to your account, you
              will see a prompt to re-authenticate. Click the reconnect button in your account
              settings to generate a fresh token via Facebook OAuth.
            </p>
            <div className="glass-card rounded-xl p-4 border-l-4 border-yellow-500/50">
              <p className="text-sm text-gray-300">
                Tip: If your commands start returning permission errors, a token refresh is usually
                the fix. Navigate to Settings and click <span className="text-purple-400">Reconnect Meta Account</span>.
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/5 pt-8 mt-8 text-center">
            <p className="text-gray-500 text-sm">
              &copy; 2026 Adynami. Need help?{' '}
              <Link href="/chat" className="text-purple-400 hover:underline">
                Ask in the app
              </Link>
              .
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
