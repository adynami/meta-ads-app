import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Adynami',
  description: 'Adynami privacy policy. How we collect, use, and protect your data.',
};

export default function PrivacyPolicy() {
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
              href="/#pricing"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Pricing
            </Link>
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

      {/* Content */}
      <section className="relative pt-32 pb-16">
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400 mb-12">Last updated: February 26, 2026</p>

          <div className="space-y-10 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p>
                Adynami (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a Meta Ads
                management tool that lets you control your advertising accounts through a
                conversational AI interface. This Privacy Policy explains how we collect, use,
                store, and protect your information when you use our service at adynami.ai (the
                &quot;Service&quot;).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                2.1 Account Information
              </h3>
              <p>When you sign up via Meta OAuth, we receive and store:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Your name</li>
                <li>Your email address</li>
                <li>Your Meta user ID</li>
                <li>Your profile picture URL</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.2 Meta Ads Data</h3>
              <p>When you connect your Meta Ad accounts, we access:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Ad account IDs and names</li>
                <li>
                  Campaign, ad set, and ad data (performance metrics, settings, creative details)
                </li>
                <li>Audience and targeting information</li>
                <li>Meta API access tokens (stored encrypted &mdash; see Section 5)</li>
              </ul>
              <p className="mt-2">
                We access this data in real time via the Meta Marketing API to fulfill your
                requests. We do not permanently store your campaign data beyond the current session
                context.
              </p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.3 Conversation Data</h3>
              <p>
                We store your conversation history (messages you send and responses you receive) to
                provide continuity across sessions. Conversations are tied to your user account and
                specific ad account.
              </p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.4 Usage Data</h3>
              <p>
                We track API call counts and token usage per month for billing and plan enforcement
                purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Authenticate you and provide access to the Service</li>
                <li>
                  Execute Meta Ads API operations on your behalf (campaign management, reporting,
                  audience building)
                </li>
                <li>Process your natural language requests through our AI system</li>
                <li>Manage your subscription and billing</li>
                <li>Enforce usage limits based on your plan</li>
                <li>Improve the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                4. Data Processors &amp; Third-Party Services
              </h2>
              <p>
                We share Platform Data with the following service providers who act as data
                processors:
              </p>

              <div className="mt-4 space-y-4">
                <div className="glass-card rounded-xl p-5">
                  <h4 className="font-semibold text-white">Neon (PostgreSQL Database)</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Stores your user profile, encrypted access tokens, ad account IDs,
                    conversations, and usage data. All Meta access tokens are encrypted with
                    AES-256-GCM before storage.
                  </p>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <h4 className="font-semibold text-white">Anthropic (Claude AI)</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Processes your chat messages to generate responses and execute ad management
                    operations. Messages may reference ad account names or IDs. Meta access tokens
                    are never sent to Anthropic.
                  </p>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <h4 className="font-semibold text-white">Stripe (Payments)</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Processes subscription payments. Receives your email and name for customer
                    record creation. Does not receive any Meta advertising data.
                  </p>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <h4 className="font-semibold text-white">Vercel (Hosting)</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Hosts the application. All Platform Data transits through Vercel&apos;s
                    serverless infrastructure during normal operation.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
              <p>We implement the following security measures to protect your data:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Meta access tokens are encrypted using AES-256-GCM before database storage</li>
                <li>All data transmission uses HTTPS/TLS encryption</li>
                <li>
                  Database access is restricted to the application through secure connection strings
                </li>
                <li>Authentication is handled through Meta&apos;s official OAuth 2.0 flow</li>
                <li>
                  Encrypted tokens are never shared with AI processors (Anthropic) or payment
                  processors (Stripe)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                6. Data Retention &amp; Deletion
              </h2>
              <p>
                We retain your data for as long as your account is active. You can delete your
                account and all associated data at any time from the Settings page. When you delete
                your account, we permanently remove:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Your user profile (name, email, Meta user ID)</li>
                <li>All connected ad account records and encrypted tokens</li>
                <li>All conversation history</li>
                <li>All usage records</li>
                <li>All API keys</li>
              </ul>
              <p className="mt-2">
                You can also request data deletion by contacting us at the email below. Meta users
                can initiate data deletion through Meta&apos;s platform, which triggers our
                automated data deletion callback.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Meta Platform Data</h2>
              <p>
                Our use of information received from Meta APIs adheres to the{' '}
                <a
                  href="https://developers.facebook.com/terms/"
                  className="text-purple-400 hover:text-purple-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Meta Platform Terms
                </a>{' '}
                and{' '}
                <a
                  href="https://developers.facebook.com/policy/"
                  className="text-purple-400 hover:text-purple-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Developer Policies
                </a>
                . We do not sell Meta Platform Data. We do not use Meta Platform Data for purposes
                unrelated to providing the Service to you. We do not share Meta Platform Data with
                data brokers, ad networks, or any parties other than the processors listed in
                Section 4.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (via Settings or by contacting us)</li>
                <li>
                  Revoke Adynami&apos;s access to your Meta account at any time from your Meta
                  Business Settings
                </li>
                <li>Export your data upon request</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies &amp; Tracking</h2>
              <p>
                We use essential cookies for authentication and session management. We do not use
                third-party advertising trackers or analytics cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                10. Children&apos;s Privacy
              </h2>
              <p>
                The Service is not intended for users under the age of 18. We do not knowingly
                collect information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by posting the updated policy on this page with a revised &quot;Last
                updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Contact</h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your data
                rights, contact us at:
              </p>
              <p className="mt-2 text-white font-medium">privacy@adynami.ai</p>
            </section>
          </div>
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
              <Link href="/privacy" className="text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
            </div>
          </div>

          <div className="text-center text-gray-600 text-sm mt-8">&copy; 2026 Adynami</div>
        </div>
      </footer>
    </div>
  );
}
