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
  BarChart3,
  Rocket,
  Palette,
  Users,
  DollarSign,
  FileText,
  ShoppingCart,
  Shield,
  Eye,
  Activity,
  TrendingUp,
  Clock,
  Lightbulb,
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
      { id: 'performance-analysis', label: '1. Performance Analysis' },
      { id: 'campaign-launch', label: '2. Campaign Launch & Setup' },
      { id: 'creative-testing', label: '3. Creative Testing' },
      { id: 'audience-building', label: '4. Audience & Retargeting' },
      { id: 'budget-optimization', label: '5. Budget & Bidding' },
      { id: 'lead-generation', label: '6. Lead Generation' },
      { id: 'ecommerce-dpa', label: '7. E-commerce & DPA' },
      { id: 'signal-recovery', label: '8. Signal Recovery (iOS 14+)' },
      { id: 'compliance-health', label: '9. Compliance & Health' },
      { id: 'competitive-intel', label: '10. Competitive Intelligence' },
      { id: 'zero-conversion', label: '11. Zero-Conversion Diagnostics' },
      { id: 'value-rules', label: '12. Value Rules' },
      { id: 'budget-schedules', label: '13. Scheduled Budget Boosts' },
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

/* ── tiny reusable components ─────────────────────────────────── */

function PromptBlock({ children }: { children: string }) {
  return (
    <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5 mb-3">
      <p className="text-cyan-400">&quot;{children}&quot;</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-4 border-l-4 border-purple-500/50 mb-4">
      <p className="text-sm text-gray-300">{children}</p>
    </div>
  );
}

function SectionIcon({ icon: Icon }: { icon: React.ElementType }) {
  return <Icon className="w-5 h-5 text-purple-400 inline mr-2 -mt-0.5" />;
}

/* ── main page ────────────────────────────────────────────────── */

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
          (item) => item.label.toLowerCase().includes(q) || section.title.toLowerCase().includes(q),
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
          {/* ─── GETTING STARTED ─────────────────────────────── */}

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
                <li>
                  Click <span className="text-purple-400">Connect Meta Account</span> and authorize
                  via Facebook OAuth.
                </li>
                <li>Select the ad account you want to manage from the sidebar.</li>
                <li>
                  Type your first message -- try{' '}
                  <span className="mono text-cyan-400">
                    &quot;Show me my top 5 campaigns by ROAS this month.&quot;
                  </span>
                </li>
              </ol>
            </div>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5">
              <p className="text-gray-500 mb-1"># Example first message</p>
              <p className="text-cyan-400">
                &quot;Which campaigns are spending but not converting this week?&quot;
              </p>
            </div>
          </section>

          {/* ─── USE CASES ───────────────────────────────────── */}

          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              <span className="gradient-text">Use Cases</span>
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Practical examples of what you can accomplish in Adynami. Each scenario shows example
              prompts you can type and what happens behind the scenes.
            </p>
          </div>

          {/* ── 1. Performance Analysis ──────────────────────── */}

          <section id="performance-analysis" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={BarChart3} />
              1. Performance Analysis &amp; Reporting
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Pull breakdowns by age, gender, placement, device, or time of day. Identify profitable
              segments, compare attribution windows, and run full account health checks -- all from
              a single prompt.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Weekly Account Health Check</h4>
            <p className="text-gray-400 text-sm mb-3">
              Get a fast summary of how your entire account performed this week versus last week --
              without pulling a manual report.
            </p>
            <PromptBlock>How are my ads doing this week?</PromptBlock>
            <PromptBlock>
              Give me a performance summary for the last 7 days. Flag anything that looks off.
            </PromptBlock>
            <p className="text-gray-500 text-xs mb-4">
              Example output: Spend $1,240 (+8% vs prior week) / ROAS 3.2x (down from 3.8x) / Top
              campaign &quot;Summer Sale -- Retargeting&quot; at 5.1x ROAS / Bleeder: &quot;Broad
              Prospecting v3&quot; -- $180 spent, 0 conversions.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Campaign-Level Breakdown</h4>
            <p className="text-gray-400 text-sm mb-3">
              Drill into a specific campaign to understand which ad sets and ads are dragging down
              results.
            </p>
            <PromptBlock>
              Break down performance for my &quot;Black Friday 2025&quot; campaign by ad set for the
              last 14 days.
            </PromptBlock>
            <PromptBlock>
              Show me ad-level results for campaign 120210001234567 -- I want to see CPA and ROAS
              for each ad.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Demographic Breakdown Report</h4>
            <p className="text-gray-400 text-sm mb-3">
              Discover which age/gender segments are driving the most efficient conversions.
            </p>
            <PromptBlock>
              Break down my last 30 days of spend by age and gender. Which segments have the best
              CPA?
            </PromptBlock>
            <PromptBlock>
              Show me a country breakdown for my &quot;EU Expansion&quot; campaign over the last
              month.
            </PromptBlock>
            <p className="text-gray-500 text-xs mb-4">
              Example insight: Women 25-34 CPA $18.40, ROAS 4.1x (best) / Men 55-64 CPA $61.20, ROAS
              0.9x (unprofitable).
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Attribution Window Comparison
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Post-iOS 14, reported conversions can differ dramatically across attribution windows.
              Compare them before reporting to stakeholders.
            </p>
            <PromptBlock>
              Compare my conversion numbers using 1-day click vs 7-day click attribution for last
              month.
            </PromptBlock>

            <Tip>
              A large gap between 1-day and 7-day click usually means your customers have a longer
              consideration cycle. Always document which window you used when presenting ROAS
              numbers.
            </Tip>
          </section>

          {/* ── 2. Campaign Launch & Setup ────────────────────── */}

          <section id="campaign-launch" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={Rocket} />
              2. Campaign Launch &amp; Setup
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Describe targeting, budget, creative, and objective in natural language. Adynami
              creates the full campaign structure with UTM tracking, naming conventions, and your
              specified bid strategy -- usually in under a minute.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Launch a Sales Campaign (Image Ad)
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Have a new promotion? Get a full campaign live -- targeting, budget, creative and all
              -- within minutes.
            </p>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5 mb-3">
              <p className="text-cyan-400">
                &quot;Upload the image at /Desktop/summer-sale-banner.jpg and launch a sales
              </p>
              <p className="text-cyan-400">
                campaign targeting US women aged 28-45, $50/day budget:
              </p>
              <p className="text-cyan-400 ml-4">
                Headline: &quot;Finally, leggings that last&quot;
              </p>
              <p className="text-cyan-400 ml-4">
                Body: &quot;Shop our summer collection -- free shipping over $75.&quot;
              </p>
              <p className="text-cyan-400 ml-4">URL: https://mystore.com/summer</p>
              <p className="text-cyan-400 ml-4">CTA: SHOP_NOW&quot;</p>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              Creates: Campaign (OUTCOME_SALES, CBO, $50/day) + Ad Set (women 28-45, US) + Ad (image
              creative). If any step fails, the entire operation rolls back -- no zombie campaigns.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Video Awareness Campaign</h4>
            <p className="text-gray-400 text-sm mb-3">
              Launch a brand awareness push across multiple countries with lifetime budgets.
            </p>
            <PromptBlock>
              Run a brand awareness campaign in Canada and Australia for the next 30 days with a
              $3,000 total budget. Target all adults 18-54.
            </PromptBlock>
            <Tip>
              Lifetime budgets require an end date. Awareness campaigns optimize for reach -- expect
              lower CPC but meaningful frequency caps.
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Campaign with UTM Tracking</h4>
            <p className="text-gray-400 text-sm mb-3">
              Ensure every click is tracked with UTM parameters so GA4 attribution matches Meta
              reporting.
            </p>
            <PromptBlock>
              Launch a traffic campaign for our blog post. Target US 25-44, $30/day, with UTM tags:
              source=facebook, medium=paid_social, campaign=blog-promo-feb.
            </PromptBlock>
            <Tip>
              UTM tags are appended to the destination URL automatically -- you do not need to
              modify the link URL itself. Include utm_content with the ad name to distinguish
              variants in GA4.
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Duplicate a Campaign for a New Market
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Clone a performing US campaign for the UK market, swap landing page URLs, and set a
              test budget.
            </p>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5 mb-3">
              <p className="text-cyan-400">
                &quot;Duplicate campaign 120210009876543 for the UK market.
              </p>
              <p className="text-cyan-400">
                Name it &quot;UK Test -- Spring Launch&quot;. Set $25/day per ad set.
              </p>
              <p className="text-cyan-400">Use these landing pages:</p>
              <p className="text-cyan-400 ml-4">- https://mystore.co.uk/spring-sale</p>
              <p className="text-cyan-400 ml-4">
                - https://mystore.co.uk/spring-sale?variant=b&quot;
              </p>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              Duplicated campaigns are created in PAUSED status so you can review before activating.
              The original campaign is left untouched.
            </p>
          </section>

          {/* ── 3. Creative Testing ──────────────────────────── */}

          <section id="creative-testing" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={Palette} />
              3. Creative Testing
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Set up A/B tests across headlines, images, and ad copy. Score creatives by CTR and
              engagement before purchase data accumulates for early signals on which variants to
              scale.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Add a Creative Variant</h4>
            <p className="text-gray-400 text-sm mb-3">
              Frequency climbing past 4.0? Introduce a fresh creative to combat ad fatigue without
              restructuring the campaign.
            </p>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5 mb-3">
              <p className="text-cyan-400">&quot;Add a new ad to ad set 23856789012345:</p>
              <p className="text-cyan-400 ml-4">
                Ad name: &quot;Spring Hero v2 -- Lifestyle Shot&quot;
              </p>
              <p className="text-cyan-400 ml-4">Headline: &quot;Spring is here. Are you?&quot;</p>
              <p className="text-cyan-400 ml-4">
                Body: &quot;New arrivals just dropped. Shop before it sells out.&quot;
              </p>
              <p className="text-cyan-400 ml-4">URL: https://mystore.com/new-arrivals</p>
              <p className="text-cyan-400">Start it paused so I can review first.&quot;</p>
            </div>
            <Tip>
              Avoid running more than 3-5 active ads per ad set. Meta&apos;s delivery system needs
              volume to learn which creative wins. Use naming conventions like [Hook Type] --
              [Visual] -- [Date].
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Run a Formal A/B Split Test</h4>
            <p className="text-gray-400 text-sm mb-3">
              Scientifically test whether a testimonial creative outperforms your product-feature
              creative, with statistical confidence before scaling the winner.
            </p>
            <PromptBlock>
              Set up an A/B test between campaign 120210001111111 and campaign 120210002222222. Test
              variable: creative. Run it for 14 days with 95% confidence.
            </PromptBlock>
            <Tip>
              Both campaigns should be PAUSED before creating the test. Do not modify either
              campaign while the test is running -- changes invalidate the split. Run for at least 7
              days with 50+ conversions per variant.
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Preview an Ad Before Launch</h4>
            <p className="text-gray-400 text-sm mb-3">
              Generate a shareable preview link for client approval without giving Ads Manager
              access.
            </p>
            <PromptBlock>
              Generate a preview of ad 23856790000001 in mobile feed format.
            </PromptBlock>
            <PromptBlock>
              Show me what ad 23856790000001 looks like as an Instagram Story.
            </PromptBlock>
            <p className="text-gray-500 text-xs mb-4">
              Preview links expire after approximately 24 hours. Always preview in the placements
              you are actually targeting -- a 1:1 image that looks great in feed can appear cropped
              in Stories.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Audit Creative Performance</h4>
            <p className="text-gray-400 text-sm mb-3">
              Before a quarterly refresh, identify top performers to replicate and dead weight to
              retire.
            </p>
            <PromptBlock>
              Show me ad-level performance for the last 30 days. Top 10 and bottom 10 ads ranked by
              ROAS.
            </PromptBlock>
            <Tip>
              Archive ads with zero conversions after 14+ days and $50+ spend -- they drain learning
              budget. Use creative details on your best ads to extract the exact copy and spec for
              future briefing.
            </Tip>
          </section>

          {/* ── 4. Audience Building & Retargeting ────────────── */}

          <section id="audience-building" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={Users} />
              4. Audience Building &amp; Retargeting
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Build retargeting audiences, video viewer segments, page engagement custom audiences,
              and lookalikes from customer lists. Estimate reach before you commit budget.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Website Retargeting Audience</h4>
            <p className="text-gray-400 text-sm mb-3">
              Retarget everyone who visited your website in the last 30 days but did not purchase.
            </p>
            <PromptBlock>
              Create a custom audience of people who visited my website in the last 30 days using
              pixel 858047089973360. Name it &quot;Website Visitors -- 30d&quot;.
            </PromptBlock>
            <Tip>
              For an abandoned-cart audience, scope the rule to the /cart or /checkout URL path.
              Website audiences take 24-48 hours to populate -- create them in advance of your
              launch.
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Customer List Lookalike</h4>
            <p className="text-gray-400 text-sm mb-3">
              Have a list of high-value customers? Find new people on Facebook who look like them.
            </p>
            <PromptBlock>
              Create a lookalike audience based on customer list audience 6123456789012. Target the
              US, 1% similarity. Name it &quot;US LAL 1% -- High Value Customers&quot;.
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">
                Audience sizing by similarity (US):
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>1% LAL: ~2.1M people -- highest similarity, best for initial testing</li>
                <li>3% LAL: ~6.3M people -- broader, useful for scaling</li>
                <li>10% LAL: ~21M people -- volume play, lowest similarity</li>
              </ul>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Page &amp; Instagram Engagement
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Retarget users who engaged with your Facebook Page or Instagram profile with a
              conversion offer.
            </p>
            <PromptBlock>
              Create an audience of everyone who engaged with our Facebook Page in the last 60 days.
              Page ID is 1234567890.
            </PromptBlock>
            <PromptBlock>
              Build an Instagram engagement audience for the last 90 days from IG account
              9876543210.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Video View Retargeting</h4>
            <p className="text-gray-400 text-sm mb-3">
              Retarget the most engaged viewers -- people who watched 75%+ of a top-of-funnel video
              -- with a direct conversion offer.
            </p>
            <PromptBlock>
              Create an audience of people who watched at least 75% of video 1234567890123456 in the
              last 14 days.
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Video engagement types:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>video_opened -- any play</span>
                <span>video_25_watched -- 25%+</span>
                <span>video_50_watched -- 50%+ (mid-funnel)</span>
                <span>video_75_watched -- 75%+ (high intent)</span>
                <span className="col-span-2">
                  video_95_watched -- nearly completed, most qualified viewers
                </span>
              </div>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Predict Reach Before Launching
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Estimate audience size and expected daily reach before committing budget.
            </p>
            <PromptBlock>
              Estimate the reach for this targeting at $75/day: US women 30-50, interested in yoga
              and wellness.
            </PromptBlock>
            <Tip>
              If estimated reach is under 10,000, your targeting is too narrow and will struggle to
              win auctions. Use predictions to size budgets: if you want 50,000 daily impressions
              and CPM is ~$12, you need ~$600/day.
            </Tip>
          </section>

          {/* ── 5. Budget & Bidding ──────────────────────────── */}

          <section id="budget-optimization" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={DollarSign} />
              5. Budget &amp; Bidding Optimization
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Reallocate spend from underperformers to winners in one command. Set automated rules
              that scale budgets when ROAS thresholds are met or pause ad sets when frequency
              exceeds a cap.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Identify Waste &amp; Pause Non-Performers
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Quickly find which campaigns are spending money without generating returns.
            </p>
            <PromptBlock>
              Show me all active campaigns and their ROAS for the last 14 days. Flag any spending
              more than $100 with ROAS below 1.5x.
            </PromptBlock>
            <PromptBlock>
              Pause campaigns 120210001111111, 120210002222222, and 120210003333333 -- they have
              been underperforming for two weeks.
            </PromptBlock>
            <Tip>
              Bulk status updates handle up to 50 IDs in one call. Before pausing, diagnose a sample
              ad from each campaign -- sometimes the issue is a disapproved ad, not the strategy
              itself.
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Meta&apos;s Optimization Recommendations
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              See what Meta&apos;s own algorithm thinks you should change to improve performance.
            </p>
            <PromptBlock>
              What optimization recommendations does Meta have for my account right now?
            </PromptBlock>
            <p className="text-gray-500 text-xs mb-4">
              Example: &quot;Increase budget on Summer Retargeting -- audience saturation is
              low&quot; / &quot;Enable Advantage+ Audience on Prospecting v4 -- estimated 23% CPA
              improvement&quot; / &quot;Add more ad variations to Brand Awareness Q1 -- only 1
              active ad is limiting learning.&quot;
            </p>
            <Tip>
              Treat these as informed suggestions, not mandates -- Meta&apos;s recommendations are
              naturally biased toward increased spend. &quot;Learning Limited&quot; warnings are
              worth acting on immediately.
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Check Billing &amp; Remaining Budget
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Confirm how much has been spent, your spend cap, and whether the account will
              auto-pause before month-end.
            </p>
            <PromptBlock>
              How much have we spent this month and what is our remaining budget?
            </PromptBlock>
          </section>

          {/* ── 6. Lead Generation ───────────────────────────── */}

          <section id="lead-generation" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={FileText} />
              6. Lead Generation
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Create lead form campaigns with custom questions and CRM integration. Monitor
              cost-per-lead across ad sets and shift budget to the highest-converting forms.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Launch a Lead Gen Campaign with Instant Form
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Capture qualified leads directly on Facebook without sending traffic to an external
              site.
            </p>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5 mb-3">
              <p className="text-cyan-400">
                &quot;Create a lead generation form for our mortgage campaign:
              </p>
              <p className="text-cyan-400 ml-4">
                Headline: &quot;Get Your Personalized Rate in 60 Seconds&quot;
              </p>
              <p className="text-cyan-400 ml-4">Questions: first name, last name, email, phone</p>
              <p className="text-cyan-400 ml-4">
                Also ask: &quot;What&apos;s your estimated home value?&quot;
              </p>
              <p className="text-cyan-400 ml-4">
                Options: Under $300K, $300K-$600K, $600K-$1M, Over $1M
              </p>
              <p className="text-cyan-400 ml-4">Privacy URL: https://example.com/privacy</p>
              <p className="text-cyan-400 ml-4">
                Thank you: &quot;A specialist will call within 1 business day.&quot;&quot;
              </p>
            </div>
            <Tip>
              Optimizing for quality adds a friction screen before the form -- it reduces volume by
              ~20% but significantly improves lead quality. Facebook pre-fills name and email from
              the user&apos;s profile; the fewer additional fields you add, the higher the
              completion rate.
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Multi-Language Lead Forms</h4>
            <p className="text-gray-400 text-sm mb-3">
              Running a pan-European campaign? Create separate lead forms in the local language for
              each market.
            </p>
            <PromptBlock>
              Create a French lead form for our Paris event: locale fr_FR, headline
              &quot;Rejoignez-nous a Paris&quot;. Then create a Spanish version for Madrid: locale
              es_ES.
            </PromptBlock>
            <p className="text-gray-500 text-xs mb-4">
              Supported locales include: en_US, en_GB, es_ES, es_LA, fr_FR, de_DE, pt_BR, it_IT,
              ja_JP, ko_KR, zh_CN, zh_TW. For Spanish, use es_ES for Spain and es_LA for Latin
              America.
            </p>
          </section>

          {/* ── 7. E-commerce & DPA ──────────────────────────── */}

          <section id="ecommerce-dpa" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={ShoppingCart} />
              7. E-commerce &amp; Dynamic Product Ads
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Browse and validate your product catalog, check inventory health, and confirm your
              setup before launching Dynamic Product Ad campaigns.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Browse Your Product Catalog</h4>
            <p className="text-gray-400 text-sm mb-3">
              Verify your catalog is healthy and understand which product sets are available for
              targeting.
            </p>
            <PromptBlock>
              List my product catalogs and show me how many products are in each one.
            </PromptBlock>
            <PromptBlock>
              Show me the product sets available in catalog 987654321098765.
            </PromptBlock>
            <PromptBlock>Show me 20 in-stock products from catalog 987654321098765.</PromptBlock>
            <p className="text-gray-500 text-xs mb-4">
              Example: Catalog &quot;Main Store&quot; -- 1,847 total / 1,602 in stock / 245 out of
              stock (13% -- consider excluding from DPA targeting).
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Inspect Catalog Before Launching DPA
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Confirm the catalog is properly configured -- correct vertical, live products, valid
              images -- before pointing campaign spend at it.
            </p>
            <PromptBlock>
              Get full details for catalog 987654321098765 -- I want to confirm it is set up
              correctly before launching DPA ads.
            </PromptBlock>
            <Tip>
              DPA campaigns require the catalog to be connected to a pixel firing ViewContent,
              AddToCart, and Purchase events. If product count seems low, check your feed&apos;s
              ingestion schedule in Commerce Manager.
            </Tip>
          </section>

          {/* ── 8. Signal Recovery (iOS 14+) ─────────────────── */}

          <section id="signal-recovery" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={Shield} />
              8. Signal Recovery (iOS 14+)
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              iOS 14+ ATT opt-outs mean your browser pixel may be missing ~40% of conversions. Send
              server-side events via Meta&apos;s Conversions API (CAPI) to recover that signal and
              give the algorithm a fuller picture of your funnel.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Send a Server-Side Purchase Event
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Send purchase events directly to Meta&apos;s Conversions API when server-side order
              tracking fires.
            </p>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5 mb-3">
              <p className="text-cyan-400">&quot;Send a purchase event to pixel 858047089973360:</p>
              <p className="text-cyan-400 ml-4">Email: jane.doe@example.com</p>
              <p className="text-cyan-400 ml-4">Order value: $127.50, currency USD</p>
              <p className="text-cyan-400 ml-4">Page: https://mystore.com/checkout/confirmation</p>
              <p className="text-cyan-400 ml-4">
                Event ID: order_88291 (for deduplication with browser pixel)&quot;
              </p>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              PII (email, phone, name) is SHA-256 hashed before the request leaves your environment.
              Plain-text PII is never transmitted to Meta.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Send Mid-Funnel Events</h4>
            <p className="text-gray-400 text-sm mb-3">
              Recover AddToCart, InitiateCheckout, and Lead signals that are also being lost to ATT.
            </p>
            <PromptBlock>
              Send an AddToCart event for a customer who added our &quot;Premium Annual Plan&quot;
              to their cart. Email: buyer@email.com, Value: $49.99 USD.
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Full e-commerce CAPI funnel:</p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>ViewContent -- product page view</li>
                <li>AddToCart -- cart addition</li>
                <li>InitiateCheckout -- checkout started</li>
                <li>Purchase -- order completed</li>
              </ol>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Verify Pixel Setup</h4>
            <PromptBlock>
              Show me all pixels on my ad account so I can confirm which one is active and tied to
              the right campaigns.
            </PromptBlock>
            <Tip>
              Always include event_id matching your browser pixel&apos;s eventID -- this is the
              deduplication key that prevents double-counting. Include fbc (from the _fbc cookie)
              and fbp (from the _fbp cookie) when available to improve match rates on iOS. Send
              events within 7 days -- older events are not attributed.
            </Tip>
          </section>

          {/* ── 9. Compliance & Account Health ────────────────── */}

          <section id="compliance-health" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={Activity} />
              9. Compliance &amp; Account Health
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Diagnose disapproved ads, declare special ad categories for regulated campaigns, and
              run full account audits when onboarding a new team member or returning from a break.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Diagnose a Non-Delivering Ad</h4>
            <p className="text-gray-400 text-sm mb-3">
              A campaign suddenly stopped delivering overnight? Find out why without clicking
              through every layer.
            </p>
            <PromptBlock>
              Why has ad 23856790123456 stopped delivering? Diagnose the issue.
            </PromptBlock>
            <PromptBlock>
              Ad 23856790000001 is not getting any impressions after 48 hours. What is wrong?
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Diagnostic checks include:</p>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Ad review status (DISAPPROVED / PENDING_REVIEW / WITH_ISSUES)</li>
                <li>Learning phase status (LEARNING / LEARNING_LIMITED)</li>
                <li>Budget exhaustion at ad set and campaign level</li>
                <li>Whether parent entities (ad set or campaign) are paused</li>
                <li>Performance red flags: zero impressions in 3 days, CTR below 0.5%</li>
              </ul>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Special Ad Categories</h4>
            <p className="text-gray-400 text-sm mb-3">
              Running housing, credit, employment, or political ads? Declare the special ad category
              at campaign creation.
            </p>
            <PromptBlock>
              Launch a housing ad campaign. It&apos;s for apartment rentals so mark it as Special Ad
              Category: HOUSING. Budget: $75/day, Target: US, age 18+.
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">
                Categories requiring declaration:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>
                  <span className="text-purple-400">HOUSING</span> -- rentals, home sales, mortgages
                </span>
                <span>
                  <span className="text-purple-400">CREDIT</span> -- credit cards, loans, BNPL
                </span>
                <span>
                  <span className="text-purple-400">EMPLOYMENT</span> -- job postings, recruitment
                </span>
                <span>
                  <span className="text-purple-400">ISSUES_ELECTIONS_POLITICS</span> -- political
                  ads
                </span>
              </div>
            </div>
            <Tip>
              Special ad categories cannot be added to an existing campaign -- they must be set at
              creation time. Failing to declare can result in ad disapproval or account restriction.
              When in doubt, declare the category.
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Full Account Audit</h4>
            <p className="text-gray-400 text-sm mb-3">
              New team member taking over? Get a complete orientation: active campaigns, budget
              situation, and anything needing immediate attention.
            </p>
            <PromptBlock>
              Give me a full account overview: account status, active campaigns, total monthly
              spend, billing info, and anything that needs immediate attention.
            </PromptBlock>
          </section>

          {/* ── 10. Competitive Intelligence ──────────────────── */}

          <section id="competitive-intel" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={Eye} />
              10. Competitive Intelligence
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Research competitor ad creative, messaging, and offers using Meta&apos;s public Ads
              Library -- directly from the chat interface.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Research Competitor Creatives
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Understand what messaging, offers, and creative formats competitors are running right
              now.
            </p>
            <PromptBlock>
              Search the Meta Ads Library for ads from &quot;Allbirds&quot; in the US. Show me 10
              results.
            </PromptBlock>
            <PromptBlock>
              What ads is &quot;Casper&quot; running right now in the UK? Summarize their current
              messaging angles.
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">What you can learn:</p>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Whether an ad is currently active (still running = likely working)</li>
                <li>When the ad started (90+ days without pausing = almost always profitable)</li>
                <li>Ad format (image, video, carousel) and platforms (FB, IG, Audience Network)</li>
                <li>Full ad copy, headline, and creative approach</li>
              </ul>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Monitor Category Trends</h4>
            <p className="text-gray-400 text-sm mb-3">
              Entering a new market? Understand creative trends and common offers across the
              category before writing creative briefs.
            </p>
            <PromptBlock>
              Search the Ads Library for &quot;meal kit delivery&quot; ads in the US and Canada.
              Give me 15 results and summarize the common offers and creative angles.
            </PromptBlock>
            <PromptBlock>
              Based on those results, what are the 3 most common hooks? What offers keep appearing?
              Video or image dominant?
            </PromptBlock>
            <Tip>
              Long-running ads (90+ days) are the most valuable to study -- they have survived
              budget scrutiny. Run separate searches for each major competitor for more targeted
              results. Use findings to brief your creative team.
            </Tip>
          </section>

          {/* ── 11. Zero-Conversion Diagnostics ──────────────── */}

          <section id="zero-conversion" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={Lightbulb} />
              11. Zero-Conversion Diagnostics &amp; Creative Iteration
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Traffic is flowing, money is being spent, but purchases are not happening. Before
              killing the campaign or blindly swapping creatives, use the data you already have --
              engagement signals, funnel events, demographic splits, video retention, and placement
              performance -- to find out exactly what is working and why conversions are not
              closing.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Pixel Funnel Audit</h4>
            <p className="text-gray-400 text-sm mb-3">
              Find exactly where people drop off in your conversion funnel.
            </p>
            <PromptBlock>
              Show me the full conversion funnel breakdown for campaign 120210001234567 over the
              last 7 days. I want view_content, add_to_cart, initiate_checkout, and purchase counts.
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">How to read the funnel:</p>
              <div className="space-y-2 text-xs text-gray-400">
                <p>
                  <span className="text-purple-400">High view_content, zero add_to_cart:</span> Ad
                  is relevant but the product page is not selling. Fix the landing page.
                </p>
                <p>
                  <span className="text-purple-400">High add_to_cart, zero initiate_checkout:</span>{' '}
                  People want it but abandon before checkout. Check shipping costs, forced account
                  creation.
                </p>
                <p>
                  <span className="text-purple-400">High initiate_checkout, zero purchase:</span>{' '}
                  Checkout is the friction point. Simplify payment flow.
                </p>
                <p>
                  <span className="text-purple-400">Zero view_content:</span> Clicks are not
                  reaching your pixel. Fix tracking before spending more.
                </p>
              </div>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Score Creatives by Engagement (Before Conversions)
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Launched 5 creative angles and have zero purchases after 3 days? 3 days is plenty of
              time for statistically meaningful CTR data. Rank the angles before they have proven
              themselves on conversions.
            </p>
            <PromptBlock>
              Show me insights for all ads in campaign 120210001234567 for the last 3 days. I want
              CTR, unique CTR, outbound_clicks, CPC, and CPM -- sorted by CTR.
            </PromptBlock>
            <PromptBlock>
              Which of our 5 ads is generating the most genuine interest? Compare link click rates.
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">
                Engagement signals explained:
              </p>
              <div className="space-y-1 text-xs text-gray-400">
                <p>
                  <span className="text-purple-400">outbound_clicks</span> -- clicks that leave
                  Facebook to your site. The most purchase-intent signal.
                </p>
                <p>
                  <span className="text-purple-400">Gap between CTR and outbound_clicks</span> --
                  large gap means people engage within Facebook but do not visit your site.
                </p>
                <p>
                  <span className="text-purple-400">High CTR, low outbound_clicks</span> -- the hook
                  works but the call-to-action does not.
                </p>
              </div>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Video Hook Analysis</h4>
            <p className="text-gray-400 text-sm mb-3">
              Running multiple video ads with different opening hooks? Completion data tells you
              which angle actually holds attention -- the leading indicator of conversion intent.
            </p>
            <PromptBlock>
              Show me video performance for all ads in campaign 120210009999999. I want views at
              25%, 50%, 75%, 100%, average watch time, and completion rate.
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">
                Reading the video retention curve:
              </p>
              <div className="space-y-1 text-xs text-gray-400">
                <p>
                  <span className="text-purple-400">&lt;25% watch:</span> Opening hook is not
                  grabbing attention. Test new first 3 seconds.
                </p>
                <p>
                  <span className="text-purple-400">25-50%:</span> Hook works but message does not
                  sustain interest. Get to the core benefit faster.
                </p>
                <p>
                  <span className="text-purple-400">50-75%:</span> Story is working but close does
                  not land. Sharpen the CTA in the final 25%.
                </p>
                <p>
                  <span className="text-purple-400">High 75%+ but no clicks:</span> People watch but
                  do not act. Add a stronger CTA mid-video.
                </p>
              </div>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Demographic Surprise</h4>
            <p className="text-gray-400 text-sm mb-3">
              Before abandoning your targeting, run a demographic breakdown. You might discover your
              actual buyers are a completely different segment than you assumed.
            </p>
            <PromptBlock>
              Break down campaign 120210001234567 by age and gender for the last 14 days. I want CTR
              and spend per segment -- looking for unexpected high-performers.
            </PromptBlock>
            <p className="text-gray-500 text-xs mb-4">
              Real-world discoveries: Women 35-44 clicking at 3x the rate of men 25-34 / Australia
              CTR 4x higher than US despite tiny spend / Age 55+ has lowest CPC despite being
              excluded from the brief.
            </p>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Placement Intelligence</h4>
            <p className="text-gray-400 text-sm mb-3">
              A blended 0.6% CTR looks mediocre. But check if that is the average of one placement
              performing brilliantly and another dragging it down.
            </p>
            <PromptBlock>
              Break down campaign 120210007654321 by placement for the last 10 days. Show me CTR,
              CPC, and spend per placement.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Time-of-Day &amp; Day-of-Week Patterns
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Your product may have a natural purchase window. Identify peak engagement hours and
              schedule spend accordingly.
            </p>
            <PromptBlock>
              Show me a daily breakdown of campaign 120210008888888 over the last 30 days. Which
              days of the week have the best CTR and lowest CPA?
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Common patterns:</p>
              <div className="space-y-1 text-xs text-gray-400">
                <p>
                  <span className="text-purple-400">Peaks Tue-Thu, drops Fri-Sun:</span> B2B
                  audience. Run ads Mon-Fri 8am-6pm only.
                </p>
                <p>
                  <span className="text-purple-400">Conversions spike Sunday evening:</span> Weekend
                  consideration. Increase bids Sunday afternoon.
                </p>
                <p>
                  <span className="text-purple-400">Consistent all days:</span> Evergreen product.
                  Do not daypart -- you will lose reach for no gain.
                </p>
              </div>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Frequency &amp; Audience Exhaustion
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              CTR declining steadily? Before changing the creative, check whether the audience has
              simply seen the ad too many times.
            </p>
            <PromptBlock>
              Show me a daily time series for campaign 120210006543210 over the last 21 days. I want
              CTR and frequency per day.
            </PromptBlock>
            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Frequency thresholds:</p>
              <div className="space-y-1 text-xs text-gray-400">
                <p>
                  <span className="text-purple-400">1.0-2.0:</span> Normal -- keep running.
                </p>
                <p>
                  <span className="text-purple-400">2.0-3.5:</span> Slight CTR decline is normal.
                  Monitor weekly.
                </p>
                <p>
                  <span className="text-purple-400">3.5-5.0:</span> CTR drops 20-40%. Refresh
                  creative or expand audience.
                </p>
                <p>
                  <span className="text-purple-400">5.0+:</span> Severe degradation. Pause and
                  replace -- audience is saturated.
                </p>
              </div>
            </div>
            <Tip>
              Frequency rising AND CTR falling = audience exhaustion (expand targeting). Frequency
              stable AND CTR falling = creative fatigue (new images/copy). Frequency and CTR both
              stable = look elsewhere (landing page, checkout, product-market fit).
            </Tip>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Build DCO from Winners</h4>
            <p className="text-gray-400 text-sm mb-3">
              After running the analyses above, systematically test the best combinations in a
              single Dynamic Creative Optimization campaign.
            </p>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5 mb-3">
              <p className="text-cyan-400">
                &quot;The social proof angle has the best outbound CTR.
              </p>
              <p className="text-cyan-400">Deploy a DCO campaign testing 3 headlines:</p>
              <p className="text-cyan-400 ml-4">
                1. &quot;Join 14,000 customers who switched&quot;
              </p>
              <p className="text-cyan-400 ml-4">
                2. &quot;The only supplement backed by 3 clinical studies&quot;
              </p>
              <p className="text-cyan-400 ml-4">
                3. &quot;Results in 30 days or your money back&quot;
              </p>
              <p className="text-cyan-400">
                Target: US women 35-50, $60/day, paused to start.&quot;
              </p>
            </div>
            <Tip>
              Meta tests all combinations and automatically weights delivery toward the best
              performer. DCO requires ~5,000 impressions per combination for reliable results. Once
              a winner emerges, extract the winning creative spec and use it in a standard ad set
              for more control.
            </Tip>
          </section>

          {/* ── 12. Value Rules ───────────────────────────────── */}

          <section id="value-rules" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={TrendingUp} />
              12. Value Rules -- Advanced Bid Adjustment
            </h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Value Rules tell Meta&apos;s auction algorithm how much a conversion from a specific
              audience segment is worth to your business. Unlike automated rules that act after the
              fact, Value Rules act during the auction -- Meta adjusts your effective bid in real
              time so you win more impressions from high-value users.
            </p>
            <div className="glass-card rounded-xl p-4 border-l-4 border-yellow-500/50 mb-6">
              <p className="text-sm text-gray-300">
                <span className="text-yellow-400 font-medium">Note:</span> Value Rules are an
                advanced feature. Overall CPA may increase because you are constraining the auction.
                Best suited for businesses with genuine differences in customer lifetime value
                across segments.
              </p>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Boost Bids for High-LTV Platforms
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              iOS customers have 2x higher 90-day LTV than Android? Bid more aggressively for iOS
              without running separate campaigns.
            </p>
            <PromptBlock>
              Create a value rule that boosts bids by 80% for iOS users, priority 1.
            </PromptBlock>
            <PromptBlock>
              Create a second rule that reduces bids by 30% for Android users, priority 2.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Top Geographic Markets</h4>
            <p className="text-gray-400 text-sm mb-3">
              Customers from certain cities convert at 3x the rate? Allocate more budget to those
              markets automatically.
            </p>
            <PromptBlock>
              Create a value rule that increases bids by 50% for users in New York, Los Angeles, and
              San Francisco.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Age-Based Bid Adjustment</h4>
            <p className="text-gray-400 text-sm mb-3">
              35-54 year olds have 60% higher subscription retention? Prioritize them in the
              auction.
            </p>
            <PromptBlock>
              Create a value rule: boost bids by 60% for users aged 35-44 and 45-54, priority 1.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Suppress Low-Value Placements
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Rather than excluding Audience Network entirely (which reduces reach), bid less for
              it.
            </p>
            <PromptBlock>
              Create a value rule that reduces bids by 40% for Audience Network placements.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Campaign-Specific Rules</h4>
            <p className="text-gray-400 text-sm mb-3">
              Test Value Rules on one campaign before rolling out account-wide.
            </p>
            <PromptBlock>
              Apply a value rule only to campaign 120210001234567 -- boost iOS users by 40%.
            </PromptBlock>

            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Value Rules quick reference:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-400">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-4 text-gray-300">Goal</th>
                      <th className="text-left py-2 pr-4 text-gray-300">Condition</th>
                      <th className="text-left py-2 text-gray-300">Multiplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-1.5 pr-4">Boost iOS users</td>
                      <td className="py-1.5 pr-4">user_os: IOS</td>
                      <td className="py-1.5">1.5-2.0</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">Suppress Android</td>
                      <td className="py-1.5 pr-4">user_os: ANDROID</td>
                      <td className="py-1.5">0.6-0.8</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">Top-market boost</td>
                      <td className="py-1.5 pr-4">country: US, GB, AU</td>
                      <td className="py-1.5">1.3-1.8</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">High-LTV age band</td>
                      <td className="py-1.5 pr-4">age: 35-44, 45-54</td>
                      <td className="py-1.5">1.4-1.8</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">Suppress low-quality placement</td>
                      <td className="py-1.5 pr-4">publisher_platform: audience_network</td>
                      <td className="py-1.5">0.5-0.7</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">Female audience premium</td>
                      <td className="py-1.5 pr-4">gender: 2</td>
                      <td className="py-1.5">1.3-1.6</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <Tip>
              Always list existing rules before creating new ones to avoid conflicts. Priority order
              matters -- the first matching rule wins, others are skipped. You can update
              multipliers or delete rules at any time.
            </Tip>
          </section>

          {/* ── 13. Scheduled Budget Boosts ───────────────────── */}

          <section id="budget-schedules" className="mb-16">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <SectionIcon icon={Clock} />
              13. High Demand Periods -- Scheduled Budget Boosts
            </h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Pre-schedule automatic budget boosts for specific time windows. Instead of waking up
              at midnight to manually increase your Black Friday budget, set it once and Meta
              handles the rest -- activating the boost on schedule and reverting when the period
              ends.
            </p>
            <div className="glass-card rounded-xl p-4 border-l-4 border-yellow-500/50 mb-6">
              <p className="text-sm text-gray-300">
                <span className="text-yellow-400 font-medium">Requires:</span> Campaign Budget
                Optimization (CBO) enabled. Two modes:{' '}
                <span className="text-purple-400">MULTIPLIER</span> (e.g. 2.0 = double your daily
                budget) or <span className="text-purple-400">ABSOLUTE</span> (explicit spend cap in
                cents, max 8x daily budget). Min 3 hours per period, max 50 schedules per campaign.
              </p>
            </div>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Black Friday / Cyber Monday</h4>
            <p className="text-gray-400 text-sm mb-3">
              Triple your $100/day budget from Friday midnight through Monday midnight, then revert
              automatically.
            </p>
            <PromptBlock>
              Create a budget schedule on campaign 120210001234567: multiply the budget by 3x from
              Friday November 28 00:00 UTC to Monday December 1 00:00 UTC.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">
              Flash Sale -- Absolute Budget Cap
            </h4>
            <p className="text-gray-400 text-sm mb-3">
              Push exactly $500 in spend during a 24-hour flash sale, regardless of normal daily
              budget.
            </p>
            <PromptBlock>
              Schedule an absolute $500 budget for campaign 120210001234567 on Saturday from 00:00
              to 23:59 UTC.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Product Launch Day</h4>
            <PromptBlock>
              Create a budget schedule: 2x multiplier on March 15 from 06:00 to 23:59 EST for
              campaign 120210001234567.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Recurring Weekend Boosts</h4>
            <p className="text-gray-400 text-sm mb-3">
              Data shows weekends outperform by 40%? Set up a 4-week pattern of weekend boosts.
            </p>
            <PromptBlock>
              Create four weekend budget schedules on campaign 120210001234567: 1.5x multiplier for
              each Saturday 00:00 to Sunday 23:59 over the next 4 weekends.
            </PromptBlock>

            <h4 className="text-lg font-medium text-gray-200 mb-2">Cancel a Scheduled Boost</h4>
            <PromptBlock>
              List the budget schedules for campaign 120210001234567, then delete the Black Friday
              one.
            </PromptBlock>

            <div className="glass-card rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Quick reference:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-400">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-4 text-gray-300">Scenario</th>
                      <th className="text-left py-2 pr-4 text-gray-300">Type</th>
                      <th className="text-left py-2 text-gray-300">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-1.5 pr-4">Double for an event</td>
                      <td className="py-1.5 pr-4">MULTIPLIER</td>
                      <td className="py-1.5">2.0</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">+50% weekend boost</td>
                      <td className="py-1.5 pr-4">MULTIPLIER</td>
                      <td className="py-1.5">1.5</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">3x for BFCM</td>
                      <td className="py-1.5 pr-4">MULTIPLIER</td>
                      <td className="py-1.5">3.0</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">Fixed $200 spend cap</td>
                      <td className="py-1.5 pr-4">ABSOLUTE</td>
                      <td className="py-1.5">20000 (cents)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">Fixed $500 flash sale</td>
                      <td className="py-1.5 pr-4">ABSOLUTE</td>
                      <td className="py-1.5">50000 (cents)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ─── API REFERENCE ────────────────────────────────── */}

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
              Include your key in the <span className="mono text-cyan-400">Authorization</span>{' '}
              header of every request.
            </p>
            <div className="mono text-xs bg-black/30 rounded-lg p-4 border border-white/5">
              <p className="text-gray-500"># Include your API key in the Authorization header</p>
              <p>
                <span className="text-purple-400">Authorization:</span>{' '}
                <span className="text-cyan-400">Bearer your_api_key_here</span>
              </p>
            </div>
          </section>

          <section id="mcp-integration" className="mb-12">
            <h3 className="text-xl font-semibold mb-3">MCP Integration</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              The MCP (Model Context Protocol) integration is available on the Agency plan. It lets
              technical teams use Adynami&apos;s full suite of Meta Ads tools directly within
              compatible AI coding assistants, providing native access to ad operations without
              switching apps.
            </p>
            <div className="glass-card rounded-xl p-4 border-l-4 border-purple-500/50">
              <p className="text-sm text-gray-300">
                Agency plan subscribers can generate MCP connection credentials from their
                dashboard. Once connected, all 73 Meta Ads tools become available as MCP tools in
                your session. Contact support or visit the Agency settings page for setup details.
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

          {/* ─── ACCOUNT & BILLING ────────────────────────────── */}

          <div className="mb-4 mt-16">
            <h2 className="text-3xl font-bold">
              <span className="gradient-text">Account &amp; Billing</span>
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
                the fix. Navigate to Settings and click{' '}
                <span className="text-purple-400">Reconnect Meta Account</span>.
              </p>
            </div>
          </section>

          {/* ─── TIPS SECTION ─────────────────────────────────── */}

          <section className="mb-16">
            <h3 className="text-xl font-semibold mb-4">Tips for Getting the Best Results</h3>
            <div className="space-y-3">
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  <span className="text-purple-400 font-medium">Be specific about numbers.</span>{' '}
                  Instead of &quot;increase the budget&quot;, say &quot;increase the daily budget to
                  $75/day&quot;. Adynami will confirm before writing any changes.
                </p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  <span className="text-purple-400 font-medium">
                    Mention time ranges explicitly.
                  </span>{' '}
                  &quot;Last 30 days&quot; is clearer than &quot;recently&quot; and maps directly to
                  the correct parameters.
                </p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  <span className="text-purple-400 font-medium">
                    Ask for analysis before action.
                  </span>{' '}
                  For optimization decisions, ask Adynami to pull the data and summarize first, then
                  ask for the change as a follow-up. This gives you a chance to review before
                  anything is modified.
                </p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  <span className="text-purple-400 font-medium">
                    Watch for learning phase disruptions.
                  </span>{' '}
                  Pausing, duplicating, or significantly changing ad sets resets the learning phase.
                  Adynami will note when an action might trigger a reset, but keep this in mind
                  before making bulk changes mid-week.
                </p>
              </div>
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
